# Todolist Modal Component

## Tâches à réaliser

### 🔧 Uniformisation data student et RDV
- **Problème :** Différences de logique entre student et RDV dans les handlers
- **Actions nécessaires :**
  - Corriger les différences de logique entre les deux handlers
  - Uniformiser la gestion du familyId/family
  - S'assurer que les deux types utilisent la même structure de données
  - Vérifier la cohérence des paramètres entre `update` functions

**Détails techniques :**
- Student utilise `originalData.family` pour récupérer le familyId
- RDV utilise `preparedData.familyId` 
- Les signatures des fonctions update sont différentes
- La logique de fallback `||` n'est pas cohérente

---

*Créé le : 2025-09-07*