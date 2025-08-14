// debug-login.js
require("dotenv").config();

const bcrypt = require("bcryptjs");
const User = require("../../models/User");
const connectDB = require("../../config/database");

async function debugLogin() {
  await connectDB();

  const email = "admin@abc-cours.fr";
  const password = "admin123";

  console.log("🔍 DEBUG LOGIN");
  console.log("Email testé:", email);
  console.log("Password testé:", password);

  // 1. Chercher l'utilisateur
  const user = await User.findOne({ email });
  console.log("👤 Utilisateur trouvé:", !!user);

  if (!user) {
    console.log("Utilisateur introuvable !");
    process.exit(1);
  }

  console.log("📧 Email en base:", user.email);
  console.log("🔐 Hash en base:", user.password);
  console.log("Utilisateur actif:", user.isActive);

  // 2. Tester le mot de passe
  console.log("\n🧪 TEST DU MOT DE PASSE:");
  const isValid = await bcrypt.compare(password, user.password);
  console.log("Résultat bcrypt.compare:", isValid);

  // 3. Test manuel du hash
  console.log("\n🔧 TEST MANUEL:");
  const manualHash = await bcrypt.hash(password, 12);
  console.log("Hash manuel généré:", manualHash);
  const manualTest = await bcrypt.compare(password, manualHash);
  console.log("Test hash manuel:", manualTest);

  // 4. Vérifier la route auth
  console.log("\n📍 VÉRIFICATION ROUTE AUTH:");
  const authRoute = require("../../routes/auth");
  console.log("Route auth chargée:", !!authRoute);

  process.exit(0);
}

debugLogin().catch(console.error);
