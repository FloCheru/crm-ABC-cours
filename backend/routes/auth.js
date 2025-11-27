const express = require("express");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const Professor = require("../models/Professor");
const Admin = require("../models/Admin");
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
  
  return jwt.sign({ userId }, process.env.JWT_SECRET);
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
    refreshSecret
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

      // Vérifier si l'email existe déjà (dans Professor ou Admin)
      const existingProfessor = await Professor.findOne({ email });
      const existingAdmin = await Admin.findOne({ email });
      if (existingProfessor || existingAdmin) {
        return res.status(400).json({ message: "Cet email est déjà utilisé" });
      }

      // Créer le nouvel utilisateur selon son rôle
      let user;
      if (role === 'professor') {
        user = new Professor({
          email,
          password,
          firstName,
          lastName,
          phone,
        });
      } else if (role === 'admin') {
        user = new Admin({
          email,
          password,
          firstName,
          lastName,
          phone,
        });
      } else {
        return res.status(400).json({ message: "Rôle invalide" });
      }

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
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict'
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
        console.log("❌ [LOGIN] Validation échouée:", errors.array());
        return res.status(400).json({
          message: "Données invalides",
          errors: errors.array(),
        });
      }

      const { email, password } = req.body;
      console.log("🔐 [LOGIN] Tentative de connexion pour:", email);
      console.log("🔑 [LOGIN] Mot de passe reçu:", password);

      // Trouver l'utilisateur (dans Professor ou Admin)
      let user = await Professor.findOne({ email });
      let userType = "Professor";

      if (!user) {
        console.log("👤 [LOGIN] Utilisateur non trouvé dans Professor, recherche dans Admin...");
        user = await Admin.findOne({ email });
        userType = "Admin";
      }

      if (!user) {
        console.log("❌ [LOGIN] Aucun utilisateur trouvé avec cet email:", email);
        return res
          .status(401)
          .json({ message: "Email ou mot de passe incorrect" });
      }

      console.log("✅ [LOGIN] Utilisateur trouvé:", {
        type: userType,
        email: user.email,
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        isActive: user.isActive,
        hasPassword: !!user.password,
        passwordHash: user.password ? user.password.substring(0, 20) + "..." : "non défini"
      });

      // Vérifier si le compte est actif
      if (!user.isActive) {
        console.log("❌ [LOGIN] Compte désactivé pour:", email);
        return res.status(401).json({ message: "Compte désactivé" });
      }

      // Vérifier que le mot de passe a été défini (pour les professeurs créés par admin)
      if (!user.password) {
        console.log("❌ [LOGIN] Compte sans mot de passe défini pour:", email);
        return res.status(401).json({
          message: "Compte non encore activé. Veuillez contacter l'administrateur pour définir votre mot de passe."
        });
      }

      // Vérifier le mot de passe
      console.log("🔍 [LOGIN] Vérification du mot de passe...");
      const isMatch = await user.comparePassword(password);
      console.log("🔍 [LOGIN] Résultat de la comparaison:", isMatch ? "✅ MATCH" : "❌ PAS DE MATCH");

      if (!isMatch) {
        console.log("❌ [LOGIN] Mot de passe incorrect pour:", email);
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
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict'
      });

      console.log("✅ [LOGIN] Connexion réussie pour:", email, "- Token généré");
      console.log("🔍 [LOGIN] isPasswordSet:", user.isPasswordSet);

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
          isPasswordSet: user.isPasswordSet !== false, // true si undefined ou true, false si explicitement false
          lastLogin: user.lastLogin,
        },
      });
    } catch (error) {
      console.error("❌ [LOGIN] Erreur lors de la connexion:", error);
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

      // Mettre à jour l'utilisateur (déjà chargé via req.user par le middleware)
      if (firstName) req.user.firstName = firstName;
      if (lastName) req.user.lastName = lastName;
      if (phone) req.user.phone = phone;

      await req.user.save();

      res.json({
        message: "Profil mis à jour avec succès",
        user: {
          id: req.user._id,
          email: req.user.email,
          firstName: req.user.firstName,
          lastName: req.user.lastName,
          role: req.user.role,
          phone: req.user.phone,
        },
      });
    } catch (error) {
      console.error("Erreur lors de la mise à jour du profil:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  }
);

// @route   POST /api/auth/change-password
// @desc    Changer le mot de passe de l'utilisateur
// @access  Private
router.post(
  "/change-password",
  [
    authenticate,
    body("newPassword")
      .isLength({ min: 6 })
      .withMessage("Le mot de passe doit contenir au moins 6 caractères"),
  ],
  async (req, res) => {
    try {
      // Vérifier les erreurs de validation
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log("❌ [CHANGE-PASSWORD] Erreurs de validation:", errors.array());
        return res.status(400).json({
          message: "Données invalides",
          errors: errors.array(),
        });
      }

      const { newPassword } = req.body;
      const userId = req.user._id;

      console.log("🔐 [CHANGE-PASSWORD] Changement de mot de passe pour utilisateur:", userId);
      console.log("🔐 [CHANGE-PASSWORD] Nouveau mot de passe reçu (longueur):", newPassword?.length);

      // Récupérer l'utilisateur actuel (peut être Professor ou Admin)
      let user = await Professor.findById(userId);
      let userType = "Professor";

      if (!user) {
        user = await Admin.findById(userId);
        userType = "Admin";
      }

      if (!user) {
        console.log("❌ [CHANGE-PASSWORD] Utilisateur non trouvé:", userId);
        return res.status(404).json({ message: "Utilisateur non trouvé" });
      }

      console.log("✅ [CHANGE-PASSWORD] Utilisateur trouvé:", {
        type: userType,
        email: user.email,
        isPasswordSet: user.isPasswordSet,
        hasPassword: !!user.password,
      });

      console.log("🔐 [CHANGE-PASSWORD] Ancien hash:", user.password?.substring(0, 20) + "...");

      // Mettre à jour le mot de passe
      user.password = newPassword;
      user.isPasswordSet = true;

      console.log("🔐 [CHANGE-PASSWORD] Avant save - nouveau mot de passe (longueur):", user.password?.length);
      await user.save();
      console.log("🔐 [CHANGE-PASSWORD] Après save - hash du mot de passe:", user.password?.substring(0, 20) + "...");

      console.log("✅ [CHANGE-PASSWORD] Mot de passe changé avec succès");

      res.json({
        message: "Mot de passe changé avec succès",
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isPasswordSet: user.isPasswordSet,
        },
      });
    } catch (error) {
      console.error("❌ [CHANGE-PASSWORD] Erreur lors du changement de mot de passe:", error);
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
    
    // Récupérer l'utilisateur (dans Professor ou Admin)
    let user = await Professor.findById(decoded.userId).select("-password");
    if (!user) {
      user = await Admin.findById(decoded.userId).select("-password");
    }
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
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Refresh token invalide" });
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
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict'
    });
    
    // Mettre à jour la dernière activité
    req.user.lastLogin = new Date();
    await req.user.save();
    
    res.json({
      message: "Session étendue avec succès"
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
    const admins = await Admin.find({
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
