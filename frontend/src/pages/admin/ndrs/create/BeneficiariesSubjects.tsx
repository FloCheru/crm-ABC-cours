import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { PageHeader, Container, Button } from "../../../../components";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../../../components/ui/card";
import { Badge } from "../../../../components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../../../../components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../../../components/ui/popover";
import { cn } from "../../../../lib/utils";
import { subjectService } from "../../../../services/subjectService";
import { familyService } from "../../../../services/familyService";
import { AddStudentModal } from "../../../../components/domain/AddStudentModal";
import { DeleteStudentModal } from "../../../../components/domain/DeleteStudentModal";
import { ErrorMessage } from "../../../../components/ui/error-message";
import { toast } from "sonner";
import type { Family } from "../../../../types/family";
import type { Subject } from "../../../../types/subject";

export const BeneficiariesSubjects: React.FC = () => {
  const navigate = useNavigate();
  const [family, setfamily] = useState<Family | null>(null);
  const [selectedBeneficiaries, setSelectedBeneficiaries] = useState<string[]>(
    []
  );
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showDeleteStudentModal, setShowDeleteStudentModal] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [beneficiaryError, setBeneficiaryError] = useState(false);
  const [subjectError, setSubjectError] = useState(false);
  const [ndrData, setNdrData] = useState({
    familyId: "",
    beneficiaries: {
      students: [] as Array<{ id: string }>,
      adult: false,
    },
    subjects: [] as Array<{id: string}>,
    professor: null,
  });

  // Fonction helper pour récupérer l'ID de famille de manière fiable
  const getFamilyId = (): string => {
    // 1. Priorité à l'état chargé
    if (family?._id) return family._id;

    // 2. Fallback sur localStorage si le state n'est pas encore chargé
    try {
      const cachedFamily = localStorage.getItem("selectedFamily");
      if (cachedFamily) {
        const parsed = JSON.parse(cachedFamily);
        return parsed._id || "";
      }
    } catch (error) {
      console.error("Erreur lors de la lecture du localStorage:", error);
    }

    return "";
  };

  //Pour set l'id family dans ndr data et charger les données à jour
  useEffect(() => {
    const loadFamily = async () => {
      const familyData = localStorage.getItem("selectedFamily");

      if (familyData) {
        const cachedFamily = JSON.parse(familyData);
        console.log("selectedFamily dans BeneficiariesSubjects (cache):", cachedFamily);

        // Charger les données à jour depuis l'API
        try {
          console.log("🔄 [LOAD] Chargement de la famille à jour depuis l'API...");
          const freshFamily = await familyService.getFamily(cachedFamily._id);
          console.log("✅ [LOAD] Famille rechargée avec données à jour:", freshFamily);
          setfamily(freshFamily);
          setNdrData((prev) => ({ ...prev, familyId: freshFamily._id }));

          // Mettre à jour le localStorage avec les données fraîches
          localStorage.setItem("selectedFamily", JSON.stringify(freshFamily));
        } catch (error) {
          console.error("❌ [LOAD] Erreur lors du chargement de la famille:", error);
          // En cas d'erreur, utiliser les données du cache
          setfamily(cachedFamily);
          setNdrData((prev) => ({ ...prev, familyId: cachedFamily._id }));
        }
      } else {
        navigate("/admin/family-selection");
      }
    };

    loadFamily();
  }, [navigate]);

  //récupérer les matières au chargement
  useEffect(() => {
    const loadSubjects = async () => {
      try {
        const subjectsData = await subjectService.getSubjects();
        setSubjects(subjectsData);
      } catch (error) {
        console.error("Erreur lors du chargement des matières:", error);
      }
    };
    loadSubjects();
  }, []);

  const toggleBeneficiary = (id: string, type: "adult" | "student") => {
    // Réinitialiser l'erreur lors de la sélection
    if (beneficiaryError) setBeneficiaryError(false);

    if (type === "adult") {
      const isSelected = selectedBeneficiaries.includes("adult");
      if (isSelected) {
        setSelectedBeneficiaries((prev) => prev.filter((b) => b !== "adult"));
        setNdrData((prev) => ({
          ...prev,
          beneficiaries: { ...prev.beneficiaries, adult: false },
        }));
      } else {
        setSelectedBeneficiaries((prev) => [...prev, "adult"]);
        setNdrData((prev) => ({
          ...prev,
          beneficiaries: { ...prev.beneficiaries, adult: true },
        }));
      }
    } else {
      const isSelected = selectedBeneficiaries.includes(id);
      if (isSelected) {
        setSelectedBeneficiaries((prev) => prev.filter((b) => b !== id));
        setNdrData((prev) => ({
          ...prev,
          beneficiaries: {
            ...prev.beneficiaries,
            students: prev.beneficiaries.students.filter((s) => s.id !== id),
          },
        }));
      } else {
        setSelectedBeneficiaries((prev) => [...prev, id]);
        setNdrData((prev) => ({
          ...prev,
          beneficiaries: {
            ...prev.beneficiaries,
            students: [...prev.beneficiaries.students, { id }],
          },
        }));
      }
    }
  };

  const toggleSubject = (subjectId: string) => {
    // Réinitialiser l'erreur lors de la sélection
    if (subjectError) setSubjectError(false);

    const isSelected = selectedSubjects.includes(subjectId);
    if (isSelected) {
      setSelectedSubjects((prev) => prev.filter((s) => s !== subjectId));
      setNdrData((prev) => ({
        ...prev,
        subjects: prev.subjects.filter((s) => s.id !== subjectId),
      }));
    } else {
      setSelectedSubjects((prev) => [...prev, subjectId]);
      setNdrData((prev) => ({
        ...prev,
        subjects: [...prev.subjects, {id: subjectId}],
      }));
    }
  };

  const removeSubject = (subjectId: string) => {
    setSelectedSubjects((prev) => prev.filter((s) => s !== subjectId));
    setNdrData((prev) => ({
      ...prev,
      subjects: prev.subjects.filter((s) => s.id !== subjectId),
    }));
  };

  const handleNext = () => {
    console.log("🎯 [HANDLE NEXT] Bouton Suivant cliqué");
    console.log("🎯 [HANDLE NEXT] selectedBeneficiaries:", selectedBeneficiaries);
    console.log("🎯 [HANDLE NEXT] selectedSubjects:", selectedSubjects);
    console.log("🎯 [HANDLE NEXT] ndrData.familyId:", ndrData.familyId);

    // Reset des erreurs
    setBeneficiaryError(false);
    setSubjectError(false);

    // Validation
    const noBeneficiaries = selectedBeneficiaries.length === 0;
    const noSubjects = selectedSubjects.length === 0;
    const noFamilyId = !ndrData.familyId;

    console.log("🎯 [HANDLE NEXT] noBeneficiaries:", noBeneficiaries);
    console.log("🎯 [HANDLE NEXT] noSubjects:", noSubjects);
    console.log("🎯 [HANDLE NEXT] noFamilyId:", noFamilyId);

    if (noBeneficiaries || noSubjects || noFamilyId) {
      console.log("❌ [HANDLE NEXT] Validation échouée");
      if (noFamilyId) {
        console.log("❌ [HANDLE NEXT] Erreur: familyId manquant");
        toast.error("Erreur: la famille n'a pas pu être chargée. Veuillez réessayer.");
        navigate("/admin/family-selection");
        return;
      }
      if (noBeneficiaries) {
        console.log("❌ [HANDLE NEXT] Erreur bénéficiaire activée");
        setBeneficiaryError(true);
        toast.error("Vous devez sélectionner au moins un bénéficiaire");
      }
      if (noSubjects) {
        console.log("❌ [HANDLE NEXT] Erreur matière activée");
        setSubjectError(true);
        toast.error("Vous devez sélectionner au moins une matière");
      }
      return;
    }

    // Si validation OK, continuer
    console.log("✅ [HANDLE NEXT] Validation réussie, navigation vers pricing-payment");
    localStorage.setItem("ndrData", JSON.stringify(ndrData));
    navigate("/admin/pricing-payment");
  };

  const handleBack = () => {
    navigate("/admin/family-selection");
  };

  const handleStudentAdded = async () => {
    // Recharger la famille pour obtenir le nouvel élève
    if (family?._id) {
      try {
        const updatedFamily = await familyService.getFamily(family._id);
        setfamily(updatedFamily);
        // Mettre à jour le localStorage avec les données fraîches
        localStorage.setItem("selectedFamily", JSON.stringify(updatedFamily));
        console.log("✅ [STUDENT ADDED] localStorage mis à jour avec le nouvel élève");
      } catch (error) {
        console.error("Erreur lors du rechargement de la famille:", error);
      }
    }
  };

  const handlePrefillTest = () => {
    // Cette fonction sera appelée par AddStudentModal pour préremplir les champs
    // La modal doit gérer le préremplissage en interne
    console.log("Préremplissage des champs de test");
  };

  const handleDeleteClick = (studentId: string, studentName: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Empêcher la sélection/désélection de la carte
    console.log("🗑️ [DELETE CLICK] Tentative de suppression:", {
      studentId,
      studentName,
      familyId: family?._id
    });
    setStudentToDelete({ id: studentId, name: studentName });
    setShowDeleteStudentModal(true);
  };

  const handleDeleteConfirm = async () => {
    console.log("✅ [DELETE CONFIRM] Début de la suppression:", {
      studentToDelete,
      familyId: family?._id
    });

    if (!studentToDelete || !family) {
      console.log("❌ [DELETE CONFIRM] Données manquantes:", { studentToDelete, hasFamily: !!family });
      return;
    }

    setIsDeleting(true);
    try {
      // Vérifier si l'élève peut être supprimé
      console.log("🔍 [DELETE CONFIRM] Vérification si l'élève peut être supprimé...");
      const checkResult = await familyService.checkStudentCanDelete(
        family._id,
        studentToDelete.id
      );
      console.log("📊 [DELETE CONFIRM] Résultat de la vérification:", checkResult);

      if (!checkResult.canDelete) {
        console.log("⛔ [DELETE CONFIRM] Suppression bloquée:", checkResult.unusedCoupons, "coupons non utilisés");
        toast.error(
          `Impossible de supprimer cet élève : ${checkResult.unusedCoupons} coupon(s) non utilisé(s)`
        );
        setShowDeleteStudentModal(false);
        setStudentToDelete(null);
        return;
      }

      // Supprimer l'élève
      console.log("🗑️ [DELETE CONFIRM] Appel removeStudent...");
      await familyService.removeStudent(family._id, studentToDelete.id);
      console.log("✅ [DELETE CONFIRM] removeStudent terminé");

      // Mettre à jour la famille localement
      console.log("🔄 [DELETE CONFIRM] Rechargement de la famille...");
      const updatedFamily = await familyService.getFamily(family._id);
      console.log("✅ [DELETE CONFIRM] Famille rechargée:", updatedFamily);
      console.log("✅ [DELETE CONFIRM] Nombre d'étudiants après suppression:", updatedFamily.students?.length || 0);
      console.log("✅ [DELETE CONFIRM] Liste des étudiants:", updatedFamily.students?.map((s: any) => ({ id: s.id, name: `${s.firstName} ${s.lastName}` })));

      // Forcer le re-render en créant un nouvel objet
      setfamily({ ...updatedFamily });

      // Mettre à jour le localStorage avec les données fraîches
      localStorage.setItem("selectedFamily", JSON.stringify(updatedFamily));
      console.log("✅ [DELETE CONFIRM] localStorage mis à jour après suppression");

      // Retirer l'élève des bénéficiaires sélectionnés s'il y était
      console.log("🔄 [DELETE CONFIRM] Mise à jour des bénéficiaires sélectionnés...");
      setSelectedBeneficiaries((prev) => {
        const updated = prev.filter((b) => b !== studentToDelete.id);
        console.log("📋 [DELETE CONFIRM] Bénéficiaires avant:", prev, "après:", updated);
        return updated;
      });
      setNdrData((prev) => {
        const updated = {
          ...prev,
          beneficiaries: {
            ...prev.beneficiaries,
            students: prev.beneficiaries.students.filter(
              (s) => s.id !== studentToDelete.id
            ),
          },
        };
        console.log("📋 [DELETE CONFIRM] NdrData avant:", prev, "après:", updated);
        return updated;
      });

      console.log("🎉 [DELETE CONFIRM] Suppression terminée avec succès");
      toast.success("Élève supprimé avec succès");
      setShowDeleteStudentModal(false);
      setStudentToDelete(null);
    } catch (error) {
      console.error("❌ [DELETE CONFIRM] Erreur lors de la suppression:", error);
      toast.error("Erreur lors de la suppression de l'élève");
    } finally {
      setIsDeleting(false);
      console.log("🏁 [DELETE CONFIRM] Fin du processus");
    }
  };

  if (!family) {
    return (
      <div>
        <PageHeader title="Bénéficiaires et matières" />
        <Container layout="flex-col">
          <div className="text-center py-8">
            <p>Chargement...</p>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Bénéficiaires et matières" />
      <Container layout="flex-col">
        <div className="mb-6">
          <h2>Étape 2 : Sélection des bénéficiaires et matières</h2>
          <p>
            Sélectionnez les bénéficiaires et les matières pour la note de
            règlement de la famille {family.primaryContact.firstName}{" "}
            {family.primaryContact.lastName}.
          </p>
        </div>

        {/* Section Bénéficiaires */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <h3 className="text-lg font-semibold">Bénéficiaires</h3>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowAddStudentModal(true)}
            >
              Ajouter un bénéficiaire
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            {/* Primary Contact */}
            <Card
              className={`cursor-pointer hover:bg-accent transition-colors ${
                selectedBeneficiaries.includes("adult")
                  ? "ring-2 ring-primary"
                  : ""
              }`}
              onClick={() => toggleBeneficiary("adult", "adult")}
            >
              <CardHeader>
                <CardTitle>
                  {family.primaryContact.firstName}{" "}
                  {family.primaryContact.lastName}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge>Adulte</Badge>
              </CardContent>
            </Card>

            {/* Students */}
            {family.students?.map((student) => (
              <Card
                key={student.id}
                className={`cursor-pointer hover:bg-accent transition-colors relative ${
                  selectedBeneficiaries.includes(student.id)
                    ? "ring-2 ring-primary"
                    : ""
                }`}
                onClick={() => toggleBeneficiary(student.id, "student")}
              >
                <button
                  onClick={(e) =>
                    handleDeleteClick(
                      student.id,
                      `${student.firstName} ${student.lastName}`,
                      e
                    )
                  }
                  className="absolute top-2 right-2 p-1 rounded-full hover:bg-destructive hover:text-destructive-foreground transition-colors z-10"
                  title="Supprimer l'élève"
                >
                  <X className="w-4 h-4" />
                </button>
                <CardHeader>
                  <CardTitle>
                    {student.firstName} {student.lastName}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant="secondary">Étudiant</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
          {beneficiaryError && (
            <ErrorMessage>Aucun bénéficiaire sélectionné</ErrorMessage>
          )}
        </div>

        {/* Section Matières */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Matières</h3>

          {/* Combobox pour sélectionner les matières */}
          <div className={cn("mb-4", subjectError && "ring-2 ring-error rounded-md p-1")}>
            <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={comboboxOpen}
                  className="w-full justify-between"
                >
                  Sélectionner des matières...
                  <ChevronsUpDown className="opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput
                    placeholder="Rechercher une matière..."
                    className="h-9"
                  />
                  <CommandList>
                    <CommandEmpty>Aucune matière trouvée.</CommandEmpty>
                    <CommandGroup>
                      {subjects.map((subject) => (
                        <CommandItem
                          key={subject._id}
                          value={subject.name}
                          onSelect={() => {
                            toggleSubject(subject._id);
                          }}
                        >
                          {subject.name}
                          <Check
                            className={cn(
                              "ml-auto",
                              selectedSubjects.includes(subject._id)
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          {subjectError && (
            <ErrorMessage>0 matière sélectionnée</ErrorMessage>
          )}

          {/* Liste des matières sélectionnées */}
          {selectedSubjects.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Matières sélectionnées :</p>
              <div className="flex flex-wrap gap-2">
                {selectedSubjects.map((subjectId) => {
                  const subject = subjects.find((s) => s._id === subjectId);
                  return (
                    <Badge
                      key={subjectId}
                      variant="secondary"
                      className="flex items-center gap-1 cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => removeSubject(subjectId)}
                    >
                      {subject?.name}
                      <X className="w-3 h-3" />
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-4 justify-between">
          <Button variant="outline" onClick={handleBack}>
            Retour
          </Button>
          <Button
            variant="primary"
            onClick={handleNext}
          >
            Suivant
          </Button>
        </div>
      </Container>

      {/* Modal d'ajout d'élève */}
      <AddStudentModal
        isOpen={showAddStudentModal}
        onClose={() => setShowAddStudentModal(false)}
        familyId={getFamilyId()}
        onSaveSuccess={handleStudentAdded}
        onPrefillTest={handlePrefillTest}
      />

      {/* Modal de suppression d'élève */}
      <DeleteStudentModal
        isOpen={showDeleteStudentModal}
        onClose={() => {
          setShowDeleteStudentModal(false);
          setStudentToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        studentName={studentToDelete?.name || ""}
        isDeleting={isDeleting}
      />
    </div>
  );
};
