const express = require("express");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

// Stockage des refresh tokens en mémoire (en prod: Redis ou DB)
const refreshTokens = new Set();

// Générer un access token JWT
const generateAccessToken = (userId) => {
  if (!process.env.JWT_SECRET) {
    console.error('❌ ERREUR CRITIQUE: JWT_SECRET manquant dans les variables d\'environnement');
    throw new Error('Configuration JWT_SECRET manquante - impossible de générer les tokens d\'authentification');
  }
  
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '24h', // Défaut 24h si pas défini
  });
};

// Générer un refresh token JWT
const generateRefreshToken = (userId) => {
  const refreshSecret = process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET;
  
  if (!refreshSecret) {
    console.error('❌ ERREUR CRITIQUE: Aucun secret disponible pour les refresh tokens');
    throw new Error('Configuration secrets JWT manquante - impossible de générer les refresh tokens');
  }
  
  return jwt.sign(
    { userId, type: 'refresh' }, 
    refreshSecret, 
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRE || '1h', // Défaut 1h si pas défini
    }
  );
};

// @route   POST /api/auth/register
// @desc    Enregistrer un nouvel utilisateur
// @access  Public
router.post(
  "/register",
  [
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 6 }),
    body("firstName").trim().notEmpty(),
    body("lastName").trim().notEmpty(),
    body("role").isIn(["admin", "professor"]),
  ],
  async (req, res) => {
    try {
      // Vérifier les erreurs de validation
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: "Données invalides",
          errors: errors.array(),
        });
      }

      const { email, password, firstName, lastName, role, phone } = req.body;

      // Vérifier si l'utilisateur existe déjà
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: "Cet email est déjà utilisé" });
      }

      // Créer le nouvel utilisateur
      const user = new User({
        email,
        password,
        firstName,
        lastName,
        role,
        phone,
      });

      await user.save();

      // Générer les tokens
      const accessToken = generateAccessToken(user._id);
      const refreshToken = generateRefreshToken(user._id);
      
      // Stocker le refresh token
      refreshTokens.add(refreshToken);

      // Cookie httpOnly pour refresh token
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        maxAge: 60 * 60 * 1000 // 1 heure
      });

      res.status(201).json({
        message: "Utilisateur créé avec succès",
        accessToken,
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isActive: user.isActive,
        },
      });
    } catch (error) {
      console.error("Erreur lors de l'enregistrement:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  }
);

// @route   POST /api/auth/login
// @desc    Connexion utilisateur
// @access  Public
router.post(
  "/login",
  [body("email").isEmail().normalizeEmail(), body("password").notEmpty()],
  async (req, res) => {
    try {
      // Vérifier les erreurs de validation
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: "Données invalides",
          errors: errors.array(),
        });
      }

      const { email, password } = req.body;

      // Trouver l'utilisateur
      const user = await User.findOne({ email });
      if (!user) {
        return res
          .status(401)
          .json({ message: "Email ou mot de passe incorrect" });
      }

      // Vérifier si le compte est actif
      if (!user.isActive) {
        return res.status(401).json({ message: "Compte désactivé" });
      }

      // Vérifier le mot de passe
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res
          .status(401)
          .json({ message: "Email ou mot de passe incorrect" });
      }

      // Mettre à jour la dernière connexion
      user.lastLogin = new Date();
      await user.save();

      // Générer les tokens
      const accessToken = generateAccessToken(user._id);
      const refreshToken = generateRefreshToken(user._id);
      
      // Stocker le refresh token
      refreshTokens.add(refreshToken);

      // Cookie httpOnly pour refresh token
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        maxAge: 60 * 60 * 1000 // 1 heure
      });

      res.json({
        message: "Connexion réussie",
        accessToken,
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isActive: user.isActive,
          lastLogin: user.lastLogin,
        },
      });
    } catch (error) {
      console.error("Erreur lors de la connexion:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  }
);

// @route   GET /api/auth/me
// @desc    Obtenir les informations de l'utilisateur connecté
// @access  Private
router.get("/me", authenticate, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        email: req.user.email,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        role: req.user.role,
        isActive: req.user.isActive,
        lastLogin: req.user.lastLogin,
      },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération du profil:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// @route   PUT /api/auth/profile
// @desc    Mettre à jour le profil utilisateur
// @access  Private
router.put(
  "/profile",
  [
    authenticate,
    body("firstName").optional().trim().notEmpty(),
    body("lastName").optional().trim().notEmpty(),
    body("phone").optional().trim(),
  ],
  async (req, res) => {
    try {
      // Vérifier les erreurs de validation
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: "Données invalides",
          errors: errors.array(),
        });
      }

      const { firstName, lastName, phone } = req.body;

      // Mettre à jour l'utilisateur
      const user = await User.findById(req.user._id);
      if (firstName) user.firstName = firstName;
      if (lastName) user.lastName = lastName;
      if (phone) user.phone = phone;

      await user.save();

      res.json({
        message: "Profil mis à jour avec succès",
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          phone: user.phone,
        },
      });
    } catch (error) {
      console.error("Erreur lors de la mise à jour du profil:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  }
);

// @route   POST /api/auth/refresh
// @desc    Renouvellement du access token avec refresh token
// @access  Public (utilise refresh token en cookie)
router.post("/refresh", async (req, res) => {
  try {
    const { refreshToken } = req.cookies;
    
    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token manquant" });
    }
    
    if (!refreshTokens.has(refreshToken)) {
      return res.status(401).json({ message: "Refresh token invalide" });
    }
    
    // Vérifier et décoder le refresh token
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    
    if (decoded.type !== 'refresh') {
      return res.status(401).json({ message: "Type de token invalide" });
    }
    
    // Récupérer l'utilisateur
    const user = await User.findById(decoded.userId).select("-password");
    if (!user || !user.isActive) {
      refreshTokens.delete(refreshToken);
      return res.status(401).json({ message: "Utilisateur invalide" });
    }
    
    // Générer nouveau access token
    const newAccessToken = generateAccessToken(user._id);
    
    // Mettre à jour la dernière activité
    user.lastLogin = new Date();
    await user.save();
    
    res.json({
      message: "Access token renouvelé avec succès",
      accessToken: newAccessToken,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
      },
    });
  } catch (error) {
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Refresh token invalide ou expiré" });
    }
    console.error("Erreur lors du renouvellement du token:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// @route   POST /api/auth/extend-session
// @desc    Étendre la session utilisateur (renouveler refresh token)
// @access  Private
router.post("/extend-session", authenticate, async (req, res) => {
  try {
    const { refreshToken } = req.cookies;
    
    if (!refreshToken || !refreshTokens.has(refreshToken)) {
      return res.status(401).json({ message: "Session invalide" });
    }
    
    // Supprimer l'ancien refresh token
    refreshTokens.delete(refreshToken);
    
    // Générer un nouveau refresh token avec nouvelle expiration
    const newRefreshToken = generateRefreshToken(req.user._id);
    refreshTokens.add(newRefreshToken);
    
    // Mettre à jour le cookie avec le nouveau refresh token
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
      maxAge: 60 * 60 * 1000 // Nouvelle heure complète
    });
    
    // Mettre à jour la dernière activité
    req.user.lastLogin = new Date();
    await req.user.save();
    
    res.json({ 
      message: "Session étendue avec succès",
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString()
    });
  } catch (error) {
    console.error("Erreur lors de l'extension de session:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// @route   POST /api/auth/logout
// @desc    Déconnexion avec suppression refresh token
// @access  Private
router.post("/logout", authenticate, (req, res) => {
  const { refreshToken } = req.cookies;
  
  // Supprimer le refresh token du stockage
  if (refreshToken) {
    refreshTokens.delete(refreshToken);
  }
  
  // Supprimer le cookie
  res.clearCookie('refreshToken');
  
  res.json({ message: "Déconnexion réussie" });
});

// @route   GET /api/auth/admins
// @desc    Obtenir la liste des administrateurs actifs
// @access  Private
router.get("/admins", authenticate, async (req, res) => {
  try {
    // Récupérer tous les administrateurs actifs
    const admins = await User.find({ 
      role: "admin", 
      isActive: true 
    })
    .select("firstName lastName email")
    .sort({ firstName: 1, lastName: 1 });

    res.json({
      message: "Administrateurs récupérés avec succès",
      admins: admins.map(admin => ({
        id: admin._id,
        firstName: admin.firstName,
        lastName: admin.lastName,
        email: admin.email,
        fullName: `${admin.firstName} ${admin.lastName}`
      }))
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des administrateurs:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

module.exports = router;
