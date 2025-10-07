const express = require("express");
const mongoose = require("mongoose");
const { body, validationResult } = require("express-validator");
const Family = require("../models/Family");
const FamilyService = require("../services/familyService");
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();

// Appliquer l'authentification à toutes les routes
router.use(authenticate);

// @route   GET /api/families
// @desc    Obtenir les familles
// @access  Private
router.get("/", async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    // Utiliser le service pour récupérer les familles formatées
    const families = await FamilyService.getFamilies(limit);

    res.json(families);
  } catch (error) {
    console.error("Erreur lors de la récupération des familles:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// @route   GET /api/families/stats
// @desc    Obtenir les statistiques des familles
// @access  Private
router.get("/stats", async (req, res) => {
  try {
    const familiesStats = await FamilyService.getFamiliesStats();

    res.json(familiesStats);
  } catch (error) {
    console.error("Erreur lors de la récupération des statistiques:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// @route   GET /api/families/:id
// @desc    Obtenir une famille par ID
// @access  Private
router.get("/:id", async (req, res) => {
  try {
    const family = await FamilyService.getFamilyById(req.params.id);

    if (!family) {
      return res.status(404).json({ message: "Famille non trouvée" });
    }

    res.json({ family });
  } catch (error) {
    console.error("Erreur lors de la récupération de la famille:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// @route   POST /api/families
// @desc    Créer une nouvelle famille
// @access  Private (Admin)
router.post("/", authorize(["admin"]), async (req, res) => {
  try {
    const familyData = {
      ...req.body,
      createdBy: { userId: req.user._id },
    };

    const savedFamily = await FamilyService.createFamily(familyData);
    const formattedFamily = await FamilyService.formatFamilyForCache(
      savedFamily.toObject()
    );

    res.status(201).json({
      message: "Famille créée avec succès",
      family: formattedFamily,
    });
  } catch (error) {
    console.error("Erreur lors de la création de la famille:", error);

    // Gérer les erreurs de validation Mongoose
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        message: errors.join(", "),
        errors: errors,
      });
    }

    res.status(500).json({ message: "Erreur serveur" });
  }
});

// @route   PATCH /api/families/:id
// @desc    Mettre à jour les champs simples d'une famille
// @access  Private (Admin)
router.patch("/:id", authorize(["admin"]), async (req, res) => {
  try {
    // Appeler la fonction du service qui gère la validation, mise à jour et cache
    const result = await FamilyService.updateFamily(req.params.id, req.body);

    res.json(result);
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la famille:", error);

    // Gérer les erreurs métier du service
    if (error.message === "Famille non trouvée") {
      return res.status(404).json({ message: error.message });
    }
    if (error.message === "ID famille invalide") {
      return res.status(400).json({ message: error.message });
    }
    if (error.message === "Aucun champ valide à mettre à jour") {
      return res.status(400).json({ message: error.message });
    }

    res.status(500).json({ message: "Erreur serveur" });
  }
});

// @route   PATCH /api/families/:id/primary-contact
// @desc    Mettre à jour les informations du contact principal ET l'adresse
// @access  Private (Admin)
router.patch("/:id/primary-contact", authorize(["admin"]), async (req, res) => {
  try {
    // Construire l'objet de mise à jour pour primaryContact
    const primaryContactData = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      primaryPhone: req.body.primaryPhone,
      secondaryPhone: req.body.secondaryPhone,
      email: req.body.email,
      birthDate: req.body.birthDate,
      relation: req.body.relation,
    };

    // Ajouter les champs optionnels s'ils sont fournis
    if (req.body.secondaryPhone !== undefined) {
      primaryContactData.secondaryPhone = req.body.secondaryPhone || null;
    }
    if (req.body.birthDate !== undefined) {
      primaryContactData.birthDate = req.body.birthDate
        ? new Date(req.body.birthDate)
        : null;
    }

    // Ajouter l'adresse dans primaryContact si fournie
    if (req.body.address) {
      primaryContactData.address = {
        street: req.body.address.street,
        city: req.body.address.city,
        postalCode: req.body.address.postalCode,
      };
    }

    const family = await FamilyService.updatePrimaryContact(
      req.params.id,
      primaryContactData
    );

    if (!family) {
      return res.status(404).json({ message: "Famille non trouvée" });
    }

    res.json({
      message: "Contact principal mis à jour avec succès",
      primaryContact: family.primaryContact,
      family: {
        id: family.id,
        primaryContact: family.primaryContact,
      },
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du contact principal:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});
// @route   PATCH /api/families/:id/secondary-contact
// @desc    Mettre à jour les informations du contact secondaire
// @access  Private (Admin)
router.patch(
  "/:id/secondary-contact",
  authorize(["admin"]),
  async (req, res) => {
    try {
      const secondaryContactData = {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        phone: req.body.phone,
        email: req.body.email,
        birthDate: req.body.birthDate,
        relation: req.body.relation,
      };

      console.log("📋 secondaryContactData reçu:", secondaryContactData);

      // Validation métier
      FamilyService.validateSecondaryContactData({
        secondaryContact: secondaryContactData,
      });

      const family = await FamilyService.updateSecondaryContact(
        req.params.id,
        secondaryContactData
      );

      if (!family) {
        return res.status(404).json({ message: "Famille non trouvée" });
      }

      res.json({
        message: "Contact secondaire mis à jour avec succès",
        secondaryContact: family.secondaryContact,
        family: {
          id: family.id,
          secondaryContact: family.secondaryContact,
        },
      });
    } catch (error) {
      console.error(
        "Erreur lors de la mise à jour du contact secondaire:",
        error
      );
      res.status(500).json({ message: "Erreur serveur" });
    }
  }
);

// @route   PATCH /api/families/:id/demande
// @desc    Mettre à jour la demande
// @access  Private (Admin)
router.patch("/:id/demande", authorize(["admin"]), async (req, res) => {
  try {
    const demandeData = {
      grade: req.body.grade,
      subjects: req.body.subjects,
    };

    const family = await FamilyService.updateDemande(
      req.params.id,
      demandeData
    );

    if (!family) {
      return res.status(404).json({ message: "Famille non trouvée" });
    }

    res.json({
      message: "Demande mise à jour avec succès",
      demande: family.demande,
      family: {
        id: family.id,
        demande: family.demande,
      },
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la demande:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// @route   PATCH /api/families/:id/billing-address
// @desc    Mettre à jour l'adresse de facturation
// @access  Private (Admin)
router.patch("/:id/billing-address", authorize(["admin"]), async (req, res) => {
  try {
    const billingAddressData = {
      street: req.body.street,
      city: req.body.city,
      postalCode: req.body.postalCode,
    };

    const family = await FamilyService.updateBillingAddress(
      req.params.id,
      billingAddressData
    );

    if (!family) {
      return res.status(404).json({ message: "Famille non trouvée" });
    }

    res.json({
      message: "Adresse de facturation mise à jour avec succès",
      billingAddress: family.billingAddress,
      family: {
        id: family.id,
        billingAddress: family.billingAddress,
      },
    });
  } catch (error) {
    console.error(
      "Erreur lors de la mise à jour de l'adresse de facturation:",
      error
    );
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// @route   PATCH /api/families/:id/company-info
// @desc    Mettre à jour les informations entreprise
// @access  Private (Admin)
router.patch("/:id/company-info", authorize(["admin"]), async (req, res) => {
  try {
    const companyInfoData = {
      urssafNumber: req.body.urssafNumber,
    };

    const family = await FamilyService.updateCompanyInfo(
      req.params.id,
      companyInfoData
    );

    if (!family) {
      return res.status(404).json({ message: "Famille non trouvée" });
    }

    res.json({
      message: "Informations entreprise mises à jour avec succès",
      companyInfo: family.companyInfo,
      family: {
        id: family.id,
        companyInfo: family.companyInfo,
      },
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour des infos entreprise:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

//====================
//SUPPRESSION
//====================

// @route   DELETE /api/families/:id
// @desc    Supprimer une famille
// @access  Private (Admin)
router.delete("/:id", authorize(["admin"]), async (req, res) => {
  try {
    const result = await FamilyService.deleteFamily(req.params.id);

    if (!result) {
      return res.status(404).json({
        message: "Famille non trouvée ou déjà supprimée",
        id: req.params.id,
      });
    }

    res.json(result);
  } catch (error) {
    console.error("Erreur lors de la suppression de la famille:", error);

    // Gérer les erreurs de validation du service
    if (
      error.message.includes("ID de famille invalide") ||
      error.message.includes("Format d'ID invalide")
    ) {
      return res.status(400).json({
        message: error.message,
        id: req.params.id,
      });
    }

    res.status(500).json({ message: "Erreur serveur" });
  }
});

//_____STUDENTS______

// @route   POST /api/families/:id/students
// @desc    Ajouter un élève embedded à une famille existante (selon dataFlow.md)
// @access  Private (Admin)
router.post("/:id/students", authorize(["admin"]), async (req, res) => {
  try {
    const result = await FamilyService.addStudent(req.params.id, req.body);

    res.status(201).json(result);
  } catch (error) {
    console.error("Erreur lors de l'ajout de l'élève:", error);

    // Gérer les erreurs de validation Mongoose
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        message: "Erreur de validation : " + errors.join(", "),
        errors: errors,
      });
    }

    // Gérer les erreurs métier du service
    if (error.message === "Famille non trouvée") {
      return res.status(404).json({ message: error.message });
    }

    res.status(500).json({ message: "Erreur serveur" });
  }
});

// @route   PATCH /api/families/:id/students/:studentId
// @desc    Modifier un élève embedded dans une famille (selon dataFlow.md)
// @access  Private (Admin)
router.patch(
  "/:id/students/:studentId",
  authorize(["admin"]),
  async (req, res) => {
    try {
      const { id: familyId, studentId } = req.params;

      console.log(
        `✏️ [UPDATE STUDENT] Tentative de modification - Famille: ${familyId}, Élève: ${studentId}`
      );

      // Validation métier (pour les champs fournis dans la mise à jour)
      FamilyService.validateStudentData(req.body);

      // Trouver la famille
      const family = await Family.findById(familyId);
      if (!family) {
        console.error(`❌ [UPDATE STUDENT] Famille non trouvée: ${familyId}`);
        return res.status(404).json({ message: "Famille non trouvée" });
      }

      // Trouver l'élève dans le tableau
      const studentIndex = family.students.findIndex(
        (s) => s.id.toString() === studentId
      );
      if (studentIndex === -1) {
        console.error(`❌ [UPDATE STUDENT] Élève non trouvé: ${studentId}`);
        return res
          .status(404)
          .json({ message: "Élève non trouvé dans cette famille" });
      }

      const oldStudent = family.students[studentIndex];
      console.log(
        `🔄 [UPDATE STUDENT] Modification de l'élève ${oldStudent.firstName} ${oldStudent.lastName}...`
      );

      // Préparer les nouvelles données de l'élève
      const updatedStudentData = {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        birthDate: new Date(req.body.birthDate),
        school: {
          name: req.body.school.name,
          grade: req.body.school.grade,
        },
        contact: req.body.contact || oldStudent.contact,
        address: req.body.address || oldStudent.address,
        availability: req.body.availability || oldStudent.availability,
        notes: req.body.notes || oldStudent.notes,
      };

      // Mettre à jour l'élève dans le tableau
      family.students[studentIndex] = {
        ...oldStudent.toObject(),
        ...updatedStudentData,
      };

      // Sauvegarder la famille
      const updatedFamily = await family.save();

      console.log(
        `✅ [UPDATE STUDENT] Élève modifié avec succès: ${updatedStudentData.firstName} ${updatedStudentData.lastName}`
      );

      res.status(200).json({
        message: "Élève modifié avec succès",
        student: family.students[studentIndex],
        family: {
          id: updatedFamily._id,
          primaryContact: {
            firstName: updatedFamily.primaryContact.firstName,
            lastName: updatedFamily.primaryContact.lastName,
          },
          studentsCount: updatedFamily.students.length,
        },
      });
    } catch (error) {
      console.error("❌ [UPDATE STUDENT] Erreur:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  }
);

// @route   DELETE /api/families/:id/students/:studentId
// @desc    Supprimer un élève embedded  (selon dataFlow.md)
// @access  Private (Admin)
router.delete(
  "/:id/students/:studentId",
  authorize(["admin"]),
  async (req, res) => {
    try {
      const { id: familyId, studentId } = req.params;

      console.log(
        `🗑️ [DELETE STUDENT] Tentative de suppression - Famille: ${familyId}, Élève: ${studentId}`
      );

      // Validation des IDs ObjectId
      if (!mongoose.Types.ObjectId.isValid(familyId)) {
        console.error(`❌ [DELETE STUDENT] ID famille invalide: ${familyId}`);
        return res.status(400).json({ message: "ID de famille invalide" });
      }

      if (!mongoose.Types.ObjectId.isValid(studentId)) {
        console.error(`❌ [DELETE STUDENT] ID élève invalide: ${studentId}`);
        return res.status(400).json({ message: "ID d'élève invalide" });
      }

      // Trouver et supprimer l'élève du tableau students
      const family = await Family.findById(familyId);
      if (!family) {
        console.error(`❌ [DELETE STUDENT] Famille non trouvée: ${familyId}`);
        return res.status(404).json({ message: "Famille non trouvée" });
      }

      // Trouver l'élève dans le tableau
      const student = family.students.find(
        (s) => s.id.toString() === studentId
      );
      if (!student) {
        console.error(`❌ [DELETE STUDENT] Élève non trouvé: ${studentId}`);
        return res
          .status(404)
          .json({ message: "Élève non trouvé dans cette famille" });
      }

      console.log(
        `🔄 [DELETE STUDENT] Suppression de l'élève ${student.firstName} ${student.lastName} de la famille...`
      );

      // Supprimer l'élève du tableau students
      const updatedFamily = await Family.findByIdAndUpdate(
        familyId,
        { $pull: { students: { id: studentId } } },
        { new: true }
      );

      if (!updatedFamily) {
        console.error(
          `❌ [DELETE STUDENT] Échec de la mise à jour de la famille ${familyId}`
        );
        return res
          .status(500)
          .json({ message: "Erreur lors de la mise à jour de la famille" });
      }

      console.log(
        `✅ [DELETE STUDENT] Élève ${student.firstName} ${student.lastName} supprimé avec succès de la famille ${familyId}`
      );

      res.json({
        message: "Élève supprimé avec succès de la famille",
        deletedStudent: {
          id: studentId,
          name: `${student.firstName} ${student.lastName}`,
        },
      });
    } catch (error) {
      console.error(
        "❌ [DELETE STUDENT] Erreur lors de la suppression de l'élève:",
        error
      );
      console.error("❌ [DELETE STUDENT] Stack trace:", error.stack);
      res.status(500).json({
        message: "Erreur serveur lors de la suppression de l'élève",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

module.exports = router;

// @route   GET /api/families/:id/deletion-preview
// @desc    Aperçu des éléments qui seront supprimés avec la famille
// @access  Private (Admin)
// router.get("/:id/deletion-preview", authorize(["admin"]), async (req, res) => {
//   try {
//     const family = await Family.findById(req.params.id);

//     if (!family) {
//       return res.status(404).json({ message: "Famille non trouvée" });
//     }

//     console.log(`🔍 Aperçu de suppression pour la famille ${req.params.id}`);

//     // Compter les éléments liés
//     const Coupon = require("../models/Coupon");
//     const CouponSeries = require("../models/CouponSeries");
//     const SettlementNote = require("../models/NDR");

//     // Les students sont maintenant embedded dans la famille
//     const studentsCount = family.students ? family.students.length : 0;
//     const studentsDetails = family.students || [];

//     const [couponsCount, seriesCount, settlementNotesCount] = await Promise.all(
//       [
//         Coupon.countDocuments({ familyId: req.params.id }),
//         CouponSeries.countDocuments({ familyId: req.params.id }),
//         SettlementNote.countDocuments({ familyId: req.params.id }),
//       ]
//     );

//     // Récupérer les détails des éléments liés
//     const [couponsDetails, seriesDetails, settlementNotesDetails] =
//       await Promise.all([
//         Coupon.find({ familyId: req.params.id }).select("code status").lean(),
//         CouponSeries.find({ familyId: req.params.id })
//           .populate("subject", "name")
//           .select("totalCoupons usedCoupons hourlyRate status subject")
//           .lean(),
//         SettlementNote.find({ familyId: req.params.id })
//           .select(
//             "clientName subjects.quantity subjects.hourlyRate status createdAt"
//           )
//           .lean(),
//       ]);

//     const deletionPreview = {
//       family: {
//         name: `${family.primaryContact.firstName} ${family.primaryContact.lastName}`,
//         status: family.status,
//         prospectStatus: family.prospectStatus,
//       },
//       itemsToDelete: {
//         students: {
//           count: studentsCount,
//           details: studentsDetails.map((s) => ({
//             name: `${s.firstName} ${s.lastName}`,
//             grade: s.school?.grade || "Non précisé",
//           })),
//         },
//         couponSeries: {
//           count: seriesCount,
//           details: seriesDetails.map((s) => ({
//             subject: s.subject?.name || "Matière non précisée",
//             totalCoupons: s.totalCoupons,
//             usedCoupons: s.usedCoupons,
//             remainingCoupons: s.totalCoupons - s.usedCoupons,
//             hourlyRate: s.hourlyRate,
//             status: s.status,
//           })),
//         },
//         coupons: {
//           count: couponsCount,
//           availableCount: couponsDetails.filter((c) => c.status === "available")
//             .length,
//           usedCount: couponsDetails.filter((c) => c.status === "used").length,
//         },
//         settlementNotes: {
//           count: settlementNotesCount,
//           details: settlementNotesDetails.map((ndr) => ({
//             clientName: ndr.clientName,
//             totalHours:
//               ndr.subjects?.reduce((sum, s) => sum + (s.quantity || 0), 0) || 0,
//             totalAmount:
//               ndr.subjects?.reduce(
//                 (sum, s) => sum + (s.quantity || 0) * (s.hourlyRate || 0),
//                 0
//               ) || 0,
//             status: ndr.status,
//             date: new Date(ndr.createdAt).toLocaleDateString("fr-FR"),
//           })),
//         },
//       },
//       totalItems:
//         studentsCount + seriesCount + couponsCount + settlementNotesCount,
//     };

//     console.log(
//       `🔍 Aperçu calculé: ${deletionPreview.totalItems} éléments à supprimer`
//     );
//     res.json(deletionPreview);
//   } catch (error) {
//     console.error("Erreur lors du calcul de l'aperçu de suppression:", error);
//     res.status(500).json({ message: "Erreur serveur" });
//   }
// });
