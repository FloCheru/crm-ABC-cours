# Tests Components

Ce dossier contient les tests unitaires pour les composants React réutilisables.

## Structure recommandée
```
components/
├── forms/
│   ├── EntityForm.test.js
│   └── SearchInput.test.js
├── ui/
│   ├── Button.test.js
│   ├── Modal.test.js
│   └── Table.test.js
└── layout/
    ├── Header.test.js
    └── Sidebar.test.js
```

## Exemple de test composant
```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import Button from '../../src/components/ui/Button';

describe('Button Component', () => {
  test('renders button with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
  
  test('calls onClick handler when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

## Patterns à suivre
- 1 fichier de test par composant
- Tests des props, états, interactions
- Mocks des dépendances externes
- Snapshots pour composants complexes (optionnel)