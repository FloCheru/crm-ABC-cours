require("dotenv").config();
const bcrypt = require("bcryptjs");
const User = require("../../models/User");
const connectDB = require("../../config/database");

async function fixPassword() {
  await connectDB();

  const email = "admin@abc-cours.fr";
  const newPassword = "admin123";

  console.log("🔧 CORRECTION DU MOT DE PASSE");

  // Générer le bon hash
  const correctHash = await bcrypt.hash(newPassword, 12);
  console.log("🔐 Nouveau hash généré:", correctHash);

  // Mettre à jour directement en base
  const result = await User.updateOne(
    { email },
    { $set: { password: correctHash } }
  );

  console.log(
    "📝 Mise à jour effectuée:",
    result.modifiedCount === 1 ? "SUCCESS" : "FAILED"
  );

  // Vérification immédiate
  const user = await User.findOne({ email });
  const testResult = await bcrypt.compare(newPassword, user.password);
  console.log("Test final:", testResult ? "SUCCESS" : "FAILED");

  if (testResult) {
    console.log("🎉 Mot de passe fixé ! Tu peux maintenant te connecter.");
  }

  process.exit(0);
}

fixPassword().catch(console.error);
