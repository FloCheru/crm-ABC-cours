# Configuration Railway URGENTE

## 🚨 Variables d'environnement manquantes

### JWT_SECRET (CRITIQUE)
```bash
# Sur Railway Dashboard > Variables
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long-random-string-2024

# ⚠️ IMPORTANT: Générer une clé aléatoire sécurisée
# Exemple de génération : 
# openssl rand -base64 32
# ou utiliser un générateur en ligne
```

### Variables existantes à vérifier
```bash
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
FRONTEND_URL=https://crm-abc-cours.vercel.app
PORT=3000
```

## 🔧 Étapes de correction

1. **Ajouter JWT_SECRET sur Railway**
   - Aller sur Railway Dashboard
   - Sélectionner le projet backend
   - Onglet "Variables"
   - Ajouter `JWT_SECRET` avec une valeur sécurisée
   
2. **Redéployer l'application**
   - Le déploiement se fera automatiquement après ajout de la variable
   - Vérifier les logs pour confirmation

## 📋 Vérifications post-déploiement

- [ ] Authentification fonctionne
- [ ] Pas d'erreur JWT dans les logs
- [ ] Rate limiting OK (pas d'erreur X-Forwarded-For)
- [ ] Application accessible

## ⚡ Status
- Trust Proxy: ✅ Configuré
- JWT_SECRET: ⏳ À configurer sur Railway