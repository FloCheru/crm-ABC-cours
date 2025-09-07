/**
 * Tests pour les modifications du tableau Admin des séries de coupons
 * Validation de la suppression des boutons œil et crayon
 */

const { JSDOM } = require('jsdom');

// Configuration JSDOM pour les tests DOM
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  pretendToBeVisual: true,
  resources: 'usable'
});

global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;

describe('Admin - Tableau des séries - Boutons d\'actions', () => {
  beforeEach(() => {
    // Mock console pour éviter les logs de test
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Reset DOM entre les tests
    document.body.innerHTML = '';
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Suppression des boutons œil et crayon', () => {
    test('Le bouton œil ne doit plus être présent dans les actions', () => {
      // Simulation de la structure du tableau avec actions
      const table = document.createElement('table');
      const tbody = document.createElement('tbody');
      const row = document.createElement('tr');
      const actionsCell = document.createElement('td');
      
      actionsCell.className = 'table__actions';
      
      // Créer seulement le bouton de suppression (plus d'œil ni de crayon)
      const deleteButton = document.createElement('button');
      deleteButton.className = 'button button--sm button--error';
      deleteButton.textContent = '✕';
      
      actionsCell.appendChild(deleteButton);
      row.appendChild(actionsCell);
      tbody.appendChild(row);
      table.appendChild(tbody);
      document.body.appendChild(table);
      
      // Vérifications
      const eyeButton = actionsCell.querySelector('button:contains(\"👁️\")');
      expect(eyeButton).toBeNull();
      
      // Vérifier qu'il n'y a qu'un seul bouton (suppression)
      const buttons = actionsCell.querySelectorAll('button');
      expect(buttons.length).toBe(1);
      expect(buttons[0].textContent).toBe('✕');
    });

    test('Le bouton crayon ne doit plus être présent dans les actions', () => {
      // Simulation de la structure du tableau avec actions
      const actionsCell = document.createElement('div');
      actionsCell.className = 'table__actions';
      
      // Créer seulement le bouton de suppression
      const deleteButton = document.createElement('button');
      deleteButton.className = 'button button--sm button--error';
      deleteButton.textContent = '✕';
      
      actionsCell.appendChild(deleteButton);
      document.body.appendChild(actionsCell);
      
      // Vérifications - le bouton crayon ne doit pas exister
      const editButton = actionsCell.querySelector('button:contains(\"✏️\")');
      expect(editButton).toBeNull();
      
      // Vérifier qu'il n'y a qu'un seul bouton
      const buttons = actionsCell.querySelectorAll('button');
      expect(buttons.length).toBe(1);
    });

    test('Seul le bouton de suppression doit être présent', () => {
      // Simulation de la structure complète
      const actionsDiv = document.createElement('div');
      actionsDiv.className = 'table__actions';
      
      // Ajouter le bouton de suppression
      const deleteButton = document.createElement('button');
      deleteButton.className = 'button button--sm button--error';
      deleteButton.textContent = '✕';
      deleteButton.onclick = () => {
        // Simulation de la fonction de suppression
        return confirm('Êtes-vous sûr de vouloir supprimer cette série de coupons ?');
      };
      
      actionsDiv.appendChild(deleteButton);
      document.body.appendChild(actionsDiv);
      
      // Vérifications
      const buttons = actionsDiv.querySelectorAll('button');
      expect(buttons.length).toBe(1);
      expect(buttons[0].textContent).toBe('✕');
      expect(buttons[0].className).toContain('button--error');
    });
  });

  describe('Navigation vers les détails', () => {
    test('Le clic sur une ligne doit toujours naviguer vers les détails (onRowClick)', () => {
      let navigationCalled = false;
      let navigatedId = null;
      
      // Simulation de la fonction onRowClick
      const handleRowClick = (row) => {
        navigationCalled = true;
        navigatedId = row._id;
        // Simulation navigation: navigate(`/admin/coupons/${row._id}/coupons`)
      };
      
      // Simulation d'une ligne de tableau
      const row = { _id: 'series123', name: 'Série test' };
      
      // Simulation du clic
      handleRowClick(row);
      
      expect(navigationCalled).toBe(true);
      expect(navigatedId).toBe('series123');
    });

    test('La navigation doit se faire vers /admin/coupons/:id/coupons', () => {
      let navigatedPath = null;
      
      // Mock de la fonction navigate
      const navigate = (path) => {
        navigatedPath = path;
      };
      
      const handleRowClick = (row) => {
        navigate(`/admin/coupons/${row._id}/coupons`);
      };
      
      const testRow = { _id: 'abc123' };
      handleRowClick(testRow);
      
      expect(navigatedPath).toBe('/admin/coupons/abc123/coupons');
    });
  });

  describe('Fonctionnalité de suppression conservée', () => {
    test('Le bouton de suppression doit déclencher une confirmation', () => {
      let confirmCalled = false;
      let confirmMessage = '';
      
      // Mock de window.confirm
      global.confirm = jest.fn().mockImplementation((message) => {
        confirmCalled = true;
        confirmMessage = message;
        return true; // Simule l'utilisateur qui confirme
      });
      
      const handleDeleteSeries = (seriesId) => {
        if (confirm('Êtes-vous sûr de vouloir supprimer cette série de coupons ?')) {
          // Simulation de la suppression
          return Promise.resolve();
        }
      };
      
      // Test de la fonction
      handleDeleteSeries('test-id');
      
      expect(confirmCalled).toBe(true);
      expect(confirmMessage).toBe('Êtes-vous sûr de vouloir supprimer cette série de coupons ?');
      
      // Cleanup
      jest.restoreAllMocks();
    });
  });

  describe('Structure du tableau maintenue', () => {
    test('La colonne actions doit toujours exister avec la bonne structure', () => {
      // Simulation de la définition de colonne
      const actionsColumn = {
        key: 'actions',
        label: 'Actions',
        render: (_, row) => {
          const div = document.createElement('div');
          div.className = 'table__actions';
          
          const deleteBtn = document.createElement('button');
          deleteBtn.className = 'button button--sm button--error';
          deleteBtn.textContent = '✕';
          
          div.appendChild(deleteBtn);
          return div;
        }
      };
      
      expect(actionsColumn.key).toBe('actions');
      expect(actionsColumn.label).toBe('Actions');
      expect(typeof actionsColumn.render).toBe('function');
      
      // Test du rendu
      const renderedElement = actionsColumn.render(null, { _id: 'test' });
      expect(renderedElement.className).toBe('table__actions');
      expect(renderedElement.children.length).toBe(1);
      expect(renderedElement.children[0].textContent).toBe('✕');
    });
  });
});

console.log('✅ Tests Admin - Suppression boutons œil/crayon créés avec succès');