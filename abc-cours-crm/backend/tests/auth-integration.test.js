// tests/auth-simple.test.js - Tests d'authentification simplifiés
const request = require("supertest");
const express = require("express");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Créer une app Express pour les tests
const app = express();
app.use(express.json());

// Modèle User simplifié pour les tests
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ["admin", "professor", "family"],
    default: "family",
  },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
});

userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model("User", userSchema);

// Routes d'authentification simplifiées
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(401)
        .json({ message: "Email ou mot de passe incorrect" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ message: "Email ou mot de passe incorrect" });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || "test-secret",
      { expiresIn: "24h" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

app.get("/api/auth/me", async (req, res) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({ message: "Token manquant" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "test-secret");
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(401).json({ message: "Utilisateur non trouvé" });
    }

    res.json({ user });
  } catch (error) {
    res.status(401).json({ message: "Token invalide" });
  }
});

// Configuration des tests
let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
  console.log("✅ Test database connected");
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
  console.log("🧹 Test database cleaned up");
});

beforeEach(async () => {
  await User.deleteMany({});
});

describe("Authentication Tests", () => {
  describe("POST /api/auth/login", () => {
    beforeEach(async () => {
      const testUser = new User({
        email: "test@admin.fr",
        password: "password123",
        role: "admin",
        firstName: "Test",
        lastName: "Admin",
      });
      await testUser.save();
    });

    it("should login with valid credentials", async () => {
      const response = await request(app).post("/api/auth/login").send({
        email: "test@admin.fr",
        password: "password123",
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("token");
      expect(response.body).toHaveProperty("user");
      expect(response.body.user.email).toBe("test@admin.fr");
    });

    it("should reject invalid email", async () => {
      const response = await request(app).post("/api/auth/login").send({
        email: "wrong@email.fr",
        password: "password123",
      });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("message");
    });

    it("should reject invalid password", async () => {
      const response = await request(app).post("/api/auth/login").send({
        email: "test@admin.fr",
        password: "wrongpassword",
      });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("message");
    });
  });

  describe("GET /api/auth/me", () => {
    let authToken;

    beforeEach(async () => {
      const testUser = new User({
        email: "test@admin.fr",
        password: "password123",
        role: "admin",
        firstName: "Test",
        lastName: "Admin",
      });
      await testUser.save();

      const loginResponse = await request(app).post("/api/auth/login").send({
        email: "test@admin.fr",
        password: "password123",
      });

      authToken = loginResponse.body.token;
    });

    it("should return user info with valid token", async () => {
      const response = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.user.email).toBe("test@admin.fr");
    });

    it("should reject request without token", async () => {
      const response = await request(app).get("/api/auth/me");

      expect(response.status).toBe(401);
    });
  });
});
