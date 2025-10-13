const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Middleware pour vérifier le token JWT
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ message: "Token d'accès requis" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(401).json({ message: "Utilisateur non trouvé" });
    }

    if (!user.isActive) {
      return res.status(401).json({ message: "Compte désactivé" });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Token invalide" });
    }
    res.status(500).json({ message: "Erreur d'authentification" });
  }
};

// Middleware pour vérifier le rôle admin
const requireAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Accès refusé - Admin requis" });
  }
  next();
};

// Middleware pour vérifier le rôle professeur
const requireProfessor = (req, res, next) => {
  if (req.user.role !== "professor") {
    return res
      .status(403)
      .json({ message: "Accès refusé - Professeur requis" });
  }
  next();
};

// Middleware pour vérifier que l'utilisateur est soit admin soit le professeur concerné
const requireAdminOrSelf = (req, res, next) => {
  if (req.user.role === "admin") {
    return next();
  }

  if (
    req.user.role === "professor" &&
    req.params.id === req.user._id.toString()
  ) {
    return next();
  }

  res.status(403).json({ message: "Accès refusé" });
};

// Middleware pour autoriser des rôles spécifiques
const authorize = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Accès refusé - Rôles autorisés: ${roles.join(", ")}`,
      });
    }

    next();
  };
};

module.exports = {
  authenticate: authenticateToken,
  authenticateToken,
  requireAdmin,
  requireProfessor,
  requireAdminOrSelf,
  authorize,
};
