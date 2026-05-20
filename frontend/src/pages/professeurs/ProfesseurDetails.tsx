import { useParams, useNavigate } from "react-router-dom";
import React, { useState, useEffect } from "react";
import { PageHeader } from "../../components";
import type {
  ProfessorProfile,
  TeachingSubject,
  CurrentSituation,
} from "../../types/professor";
import { professorService } from "../../services/professorService";
import { ProfessorProfileContent } from "../../components/professor/ProfessorProfileContent";
import { ProfessorCouponsContent } from "../../components/professor/ProfessorCouponsContent";
import { ProfessorAttestationsContent } from "../../components/professor/ProfessorAttestationsContent";
import { ProfessorElevesContent } from "../../components/professor/ProfessorElevesContent";
import { Badge } from "../../components/ui/badge";
import { authService } from "../../services/authService";
import rdvService from "../../services/rdvService";
import type { RendezVous } from "../../types/rdv";
import { RDV_HOURS } from "../../types/rdv";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";

// Helper pour formater les labels de situation actuelle
const formatCurrentSituation = (situation: CurrentSituation): string => {
  const labels: Record<CurrentSituation, string> = {
    enseignant_education_nationale: "Éduc. Nationale",
    enseignant_vacataire_contractuel: "Vacataire/Contractuel",
    etudiant_master_professorat: "Étudiant Master",
    enseignant_avec_activite_domicile: "Ens. + Activité domicile",
    enseignant_activite_professionnelle: "Ens. + Activité pro",
    enseignant_formation_professionnelle: "Formation pro",
    etudiant: "Étudiant",
  };
  return labels[situation] || situation;
};

export const ProfesseurDetails: React.FC = () => {
  const navigate = useNavigate();
  const { professorId } = useParams<{ professorId: string }>();
  const [professor, setProfessor] = useState<ProfessorProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [teachingSubjects, setTeachingSubjects] = useState<TeachingSubject[]>(
    []
  );
  const [lastCouponDate, setLastCouponDate] = useState<Date | null>(null);

  // États pour les commentaires admin
  const [adminComments, setAdminComments] = useState("");
  const [isSavingComments, setIsSavingComments] = useState(false);
  const [commentsSaveError, setCommentsSaveError] = useState<string | null>(
    null
  );
  const [commentsSaveSuccess, setCommentsSaveSuccess] = useState(false);

  // États pour les RDV
  const [rdvs, setRdvs] = useState<RendezVous[]>([]);
  const [isLoadingRdvs, setIsLoadingRdvs] = useState(false);
  const [showRdvModal, setShowRdvModal] = useState(false);
  const [rdvFormData, setRdvFormData] = useState({
    date: "",
    time: "09:00",
    type: "physique" as "physique" | "visio",
    notes: "",
  });

  // État pour la navigation principale (navbar horizontale professeur)
  const [mainTab, setMainTab] = useState<
    "profil" | "coupons" | "attestations" | "eleves"
  >("profil");

  useEffect(() => {
    if (professorId) {
      loadProfessorData();
      loadRdvs();
    } else {
      setIsLoading(false);
    }
  }, [professorId]);

  const loadProfessorData = async () => {
    try {
      setIsLoading(true);
      const professor = await professorService.getProfessorById(professorId!);
      setProfessor(professor);
      setTeachingSubjects((professor as any).teachingSubjects || []);

      // Charger la date du dernier coupon
      const date = await professorService.getLastCouponDate(professorId!);
      setLastCouponDate(date);

      // Initialiser les commentaires admin
      setAdminComments((professor as ProfessorProfile)?.adminComments || "");
    } catch (err) {
      console.error("Erreur lors du chargement du professeur:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadRdvs = async () => {
    if (!professorId) return;

    try {
      setIsLoadingRdvs(true);
      // Calculer début et fin de semaine
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Lundi
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6); // Dimanche

      const response = await rdvService.getRdvs({
        professorId,
        dateFrom: startOfWeek.toISOString().split("T")[0],
        dateTo: endOfWeek.toISOString().split("T")[0],
      });

      setRdvs(response.rdvs);
    } catch (err) {
      console.error("Erreur chargement RDV:", err);
    } finally {
      setIsLoadingRdvs(false);
    }
  };

  const handleSaveComments = async () => {
    try {
      setIsSavingComments(true);
      setCommentsSaveError(null);
      setCommentsSaveSuccess(false);

      await professorService.updateAdminComments(professorId!, adminComments);

      if (professor) {
        setProfessor({ ...professor, adminComments });
      }

      setCommentsSaveSuccess(true);
      setTimeout(() => setCommentsSaveSuccess(false), 3000);
    } catch (err) {
      setCommentsSaveError("Erreur lors de la sauvegarde");
    } finally {
      setIsSavingComments(false);
    }
  };

  const handleCreateRdv = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const currentUser = authService.getUser();
      console.log("Current user:", currentUser);

      const rdvPayload = {
        professorId: professorId!,
        assignedAdminId: currentUser?._id,
        entityType: "admin-professor" as const,
        date: rdvFormData.date,
        time: rdvFormData.time,
        type: rdvFormData.type,
        notes: rdvFormData.notes || undefined,
      };

      console.log("RDV payload:", rdvPayload);

      await rdvService.createRdv(rdvPayload);

      // Rafraîchir la liste
      await loadRdvs();

      // Réinitialiser le formulaire
      setRdvFormData({
        date: "",
        time: "09:00",
        type: "physique",
        notes: "",
      });

      // Fermer la modale
      setShowRdvModal(false);
    } catch (err) {
      console.error("Erreur création RDV:", err);
      alert("Erreur lors de la création du rendez-vous");
    }
  };

  React.useEffect(() => {
    if (!professorId) {
      navigate("/admin/professeurs", { replace: true });
    }
  }, [professorId, navigate]);

  if (isLoading) {
    return (
      <div>
        <PageHeader
          title="Chargement..."
          breadcrumb={[
            { label: "Professeurs", href: "/admin/professeurs" },
            { label: "Chargement..." },
          ]}
        />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-gray-500">
            Chargement des détails du professeur...
          </div>
        </div>
      </div>
    );
  }

  if (!professorId || !professor) {
    return null;
  }

  return (
    <main className="bg-gray-50 min-h-screen">
      <PageHeader
        title={
          professor
            ? `Détails du Professeur - ${professor.lastName.toUpperCase()} ${professor.firstName
                .charAt(0)
                .toUpperCase()}${professor.firstName.slice(1).toLowerCase()}`
            : "Détails du Professeur"
        }
        breadcrumb={[
          { label: "Professeurs", href: "/admin/professeurs" },
          { label: "Détails" },
        ]}
        backButton={{
          label: "Retour au tableau des professeurs",
          href: "/admin/professeurs",
        }}
        metadata={
          professor && (
            <div className="flex items-center gap-4">
              {/* Date de création */}
              {professor.createdAt && (
                <span className="text-sm text-text-secondary">
                  Créé le :{" "}
                  <span className="font-medium text-text-primary">
                    {new Date(professor.createdAt).toLocaleDateString("fr-FR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </span>
                </span>
              )}

              {/* Statut d'emploi */}
              {professor.employmentStatus ? (
                <Badge
                  className={
                    professor.employmentStatus === "auto-entrepreneur"
                      ? "bg-success text-white"
                      : professor.employmentStatus === "salarie"
                      ? "bg-primary text-white"
                      : "bg-warning text-white"
                  }
                >
                  {professor.employmentStatus === "auto-entrepreneur"
                    ? "Auto-entrepreneur"
                    : professor.employmentStatus === "salarie"
                    ? "Salarié"
                    : "Formation professionnel"}
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="bg-surface-secondary text-text-tertiary"
                >
                  Statut non défini
                </Badge>
              )}

              {/* Situation actuelle */}
              {professor.currentSituation ? (
                <Badge className="bg-primary text-white">
                  {formatCurrentSituation(professor.currentSituation)}
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-gray-200 text-gray-600">
                  Situation non renseignée
                </Badge>
              )}

              {/* Statut actif/inactif */}
              <Badge className="bg-secondary text-white">
                {professor.isActive ? "Actif" : "Inactif"}
              </Badge>

              {/* Dernier coupon saisi */}
              <span className="text-sm text-text-secondary">
                Dernier coupon saisi le :{" "}
                {lastCouponDate ? (
                  <span className="font-medium text-text-primary">
                    {new Date(lastCouponDate).toLocaleDateString("fr-FR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </span>
                ) : (
                  <span className="text-text-tertiary">Aucun coupon</span>
                )}
              </span>
            </div>
          )
        }
      />

      {/* Section Admin : Commentaires + RDV */}
      {authService.getUser()?.role === "admin" && (
        <div className="w-full px-4 mt-6">
          <div className="grid grid-cols-4 gap-4">
            {/* Colonne 1 : Commentaires Admin (1/4) */}
            <div className="col-span-1 bg-gray-50 border border-gray-200 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Commentaires Admin (non visibles par le professeur)
              </label>
              <textarea
                value={adminComments}
                onChange={(e) => setAdminComments(e.target.value)}
                placeholder="Notes internes sur ce professeur..."
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                rows={3}
              />

              {/* Messages feedback minimalistes */}
              {commentsSaveError && (
                <p className="text-xs text-red-600 mt-2">{commentsSaveError}</p>
              )}
              {commentsSaveSuccess && (
                <p className="text-xs text-green-600 mt-2">
                  Enregistré avec succès
                </p>
              )}

              {/* Bouton sauvegarde */}
              <button
                onClick={handleSaveComments}
                disabled={
                  isSavingComments || adminComments === professor?.adminComments
                }
                className="mt-3 px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSavingComments ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>

            {/* Colonne 2 : Rendez-vous du professeur (3/4) */}
            <div className="col-span-3 bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-700">
                  Rendez-vous de la semaine
                </h3>
                <button
                  onClick={() => setShowRdvModal(true)}
                  className="px-3 py-1.5 text-xs bg-primary text-white rounded-md hover:bg-primary-hover"
                >
                  + Saisir un RDV
                </button>
              </div>

              {/* Liste des RDV */}
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {isLoadingRdvs ? (
                  <p className="text-xs text-gray-500">Chargement...</p>
                ) : rdvs.length === 0 ? (
                  <p className="text-xs text-gray-500">Aucun RDV cette semaine</p>
                ) : (
                  rdvs.map((rdv) => (
                    <div
                      key={rdv._id}
                      className="p-2 bg-white rounded border border-gray-200"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs font-medium text-gray-800">
                            {new Date(rdv.date).toLocaleDateString("fr-FR", {
                              weekday: "short",
                              day: "numeric",
                              month: "short",
                            })}{" "}
                            • {rdv.time}
                          </p>
                          <p className="text-xs text-gray-600 mt-0.5">
                            {rdv.type === "physique" ? "📍" : "💻"} {rdv.type}
                          </p>
                          {rdv.notes && (
                            <p className="text-xs text-gray-500 mt-1 truncate">
                              {rdv.notes}
                            </p>
                          )}
                        </div>
                        <Badge
                          className={
                            rdv.status === "planifie"
                              ? "bg-info text-white"
                              : "bg-success text-white"
                          }
                        >
                          {rdv.status === "planifie" ? "Prévu" : "Réalisé"}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navbar horizontale professeur */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 max-w-6xl">
          <nav className="flex gap-1">
            <button
              onClick={() => setMainTab("profil")}
              className={`px-6 py-4 text-sm font-medium transition-all ${
                mainTab === "profil"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 border-b-2 border-transparent hover:text-blue-600 hover:border-blue-200"
              }`}
            >
              Mon profil
            </button>
            <button
              onClick={() => setMainTab("coupons")}
              className={`px-6 py-4 text-sm font-medium transition-all ${
                mainTab === "coupons"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 border-b-2 border-transparent hover:text-blue-600 hover:border-blue-200"
              }`}
            >
              Mes coupons
            </button>
            <button
              onClick={() => setMainTab("attestations")}
              className={`px-6 py-4 text-sm font-medium transition-all ${
                mainTab === "attestations"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 border-b-2 border-transparent hover:text-blue-600 hover:border-blue-200"
              }`}
            >
              Mes Attestations
            </button>
            <button
              onClick={() => setMainTab("eleves")}
              className={`px-6 py-4 text-sm font-medium transition-all ${
                mainTab === "eleves"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 border-b-2 border-transparent hover:text-blue-600 hover:border-blue-200"
              }`}
            >
              Mes élèves
            </button>
          </nav>
        </div>
      </div>

      {/* Alerte RIB manquant */}
      {professor && (!professor.iban || !professor.employmentStatus) && (
        <div className="container mx-auto px-4 max-w-6xl mb-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <span className="text-xl">⚠️</span>
              <div>
                <h4 className="font-semibold text-yellow-900 mb-1">
                  RIB à ajouter
                </h4>
                <p className="text-sm text-yellow-800">
                  Le professeur doit renseigner ses informations bancaires avant
                  toute saisie de coupon. Veuillez compléter l'onglet "Mon RIB"
                  ci-dessous.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section Mon profil */}
      {mainTab === "profil" && professorId && (
        <div className="container mx-auto px-4 py-12 max-w-6xl">
          <ProfessorProfileContent
            professorId={professorId}
            defaultTab="informations"
            teachingSubjects={teachingSubjects}
            onProfileUpdated={loadProfessorData}
          />
        </div>
      )}

      {/* Section Mes coupons */}
      {mainTab === "coupons" && professorId && (
        <div className="container mx-auto px-4 py-12 max-w-6xl">
          <ProfessorCouponsContent
            professorId={professorId}
            iban={(professor as any)?.iban}
            employmentStatus={(professor as any)?.employmentStatus}
          />
        </div>
      )}

      {/* Section Mes Attestations */}
      {mainTab === "attestations" && professorId && (
        <div className="container mx-auto px-4 py-12 max-w-6xl">
          <ProfessorAttestationsContent professorId={professorId} />
        </div>
      )}

      {/* Section Mes élèves */}
      {mainTab === "eleves" && professorId && (
        <div className="container mx-auto px-4 py-12 max-w-6xl">
          <ProfessorElevesContent professorId={professorId} />
        </div>
      )}

      {/* Modale de saisie de RDV */}
      {showRdvModal && (
        <Dialog open={showRdvModal} onOpenChange={setShowRdvModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Nouveau rendez-vous avec {professor?.firstName}{" "}
                {professor?.lastName}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleCreateRdv} className="space-y-4">
              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date *
                </label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split("T")[0]}
                  value={rdvFormData.date}
                  onChange={(e) =>
                    setRdvFormData({ ...rdvFormData, date: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              {/* Heure */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Heure *
                </label>
                <select
                  required
                  value={rdvFormData.time}
                  onChange={(e) =>
                    setRdvFormData({ ...rdvFormData, time: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  {RDV_HOURS.map((hour) => (
                    <option key={hour} value={hour}>
                      {hour}
                    </option>
                  ))}
                </select>
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type *
                </label>
                <select
                  required
                  value={rdvFormData.type}
                  onChange={(e) =>
                    setRdvFormData({
                      ...rdvFormData,
                      type: e.target.value as "physique" | "visio",
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="physique">Physique</option>
                  <option value="visio">Visio</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (optionnel)
                </label>
                <textarea
                  rows={3}
                  maxLength={1000}
                  value={rdvFormData.notes}
                  onChange={(e) =>
                    setRdvFormData({ ...rdvFormData, notes: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Notes sur le rendez-vous..."
                />
              </div>

              {/* Boutons */}
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowRdvModal(false)}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm bg-primary text-white rounded-md hover:bg-primary-hover"
                >
                  Créer le RDV
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </main>
  );
};
