# Déploiement Frontend - ABC Cours CRM

## Configuration Vercel

### Variables d'environnement à configurer sur Vercel :

```bash
VITE_API_URL=https://votre-backend-railway.railway.app
VITE_NODE_ENV=production
VITE_DEBUG=false
```

### Build Settings
- **Framework Preset:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

### Étapes de déploiement

1. Connecter le repository GitHub à Vercel
2. Sélectionner le dossier `frontend/` comme root directory
3. Configurer les variables d'environnement dans Vercel
4. Déployer

### URL Backend Railway
Remplacer `votre-backend-railway.railway.app` par l'URL fournie par Railway après le déploiement du backend.