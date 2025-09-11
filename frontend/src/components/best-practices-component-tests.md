# Guide Tests de Composants React

## ✅ Quoi tester
- **Rendu** avec différentes props
- **Interactions utilisateur** (click, type, submit)
- **États** (loading, error, success)
- **Callbacks** (onSubmit, onClick, onChange)
- **Accessibilité** (focus, ARIA, navigation clavier, screen readers)

## ❌ Quoi PAS tester
- État interne (useState, useEffect)
- Détails d'implémentation
- Librairies externes (React)
- CSS/styles

## 📋 Checklist par Type

### **Button**
- [ ] Rendu texte/icône
- [ ] Click → callback appelé
- [ ] États disabled/loading
- [ ] Accessibilité (role, aria-label)
- [ ] Navigation clavier (Enter, Space)
- [ ] Focus visible

### **Input/Form**
- [ ] Saisie → onChange appelé
- [ ] Validation (requis, format)
- [ ] Soumission → onSubmit appelé
- [ ] Messages erreur affichés
- [ ] Labels associés (for/id ou aria-labelledby)
- [ ] Navigation clavier (Tab, Enter)
- [ ] États focus visibles

### **Modal**
- [ ] Ouverture/fermeture
- [ ] ESC → ferme
- [ ] Overlay click → ferme
- [ ] Focus trap
- [ ] Retour focus élément déclencheur
- [ ] Attributs ARIA (role="dialog", aria-modal="true", aria-labelledby)
- [ ] Navigation clavier (Tab, Shift+Tab, flèches)
- [ ] Annonce screen reader (ouverture/fermeture)
- [ ] Focus visible et contrasté

### **Liste**
- [ ] Rendu items
- [ ] Liste vide → message
- [ ] Click item → callback
- [ ] États loading/error

## 🔍 Queries (ordre priorité)
```javascript
1. getByRole('button', { name: /submit/i })
2. getByLabelText(/email/i) 
3. getByText(/loading/i)
4. getByTestId('custom') // dernier recours
```

## 📝 Pattern de base
```javascript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

test('should call onClick when clicked', async () => {
  const user = userEvent.setup();
  const mockClick = jest.fn();
  
  render(<Button onClick={mockClick}>Click me</Button>);
  
  await user.click(screen.getByRole('button'));
  
  expect(mockClick).toHaveBeenCalledTimes(1);
});
```

## 🎯 Structure test
```javascript
describe('MonComposant', () => {
  test('should render with props', () => {
    // Arrange
    render(<MonComposant title="Test" />);
    
    // Act (optionnel)
    
    // Assert
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
```

## ⚡ Async/Loading
```javascript
// Attendre apparition
await screen.findByText('Success');

// Attendre disparition  
await waitForElementToBeRemoved(screen.getByText('Loading...'));
```

## 🚨 Erreurs courantes
- ❌ `fireEvent` → ✅ `userEvent`
- ❌ `getByTestId` partout → ✅ `getByRole` priorité
- ❌ Tester implémentation → ✅ Tester comportement
- ❌ Tests fragiles → ✅ Tests robustes