import React, { useState, useEffect } from "react";
import { PageHeader, Modal } from "../../components";
import type { RendezVous } from "../../types/rdv";
import type { NDR } from "../../services/ndrService";
import rdvService from "../../services/rdvService";
import { ndrService } from "../../services/ndrService";
import { useAuthStore } from "../../stores";
import { Checkbox } from "../../components/ui/checkbox";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";

export const MesRendezVous: React.FC = () => {
  // États
  const [rdvs, setRdvs] = useState<RendezVous[]>([]);
  const [filteredRdvs, setFilteredRdvs] = useState<RendezVous[]>([]);
  const [myNdrs, setMyNdrs] = useState<NDR[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingNdrs, setIsLoadingNdrs] = useState(true);

  // États filtres
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  // États modals
  const [isRdvModalOpen, setIsRdvModalOpen] = useState(false);
  const [isDemandeModalOpen, setIsDemandeModalOpen] = useState(false);
  const [selectedRdv, setSelectedRdv] = useState<RendezVous | null>(null);

  // Demande RDV admin
  const [demandeData, setDemandeData] = useState({
    date: "",
    time: "",
    type: "physique" as "physique" | "virtuel",
    notes: "",
  });

  // User connecté
  const user = useAuthStore((state) => state.user);
  const professorId = user?._id || "";

  // Charger les données au montage
  useEffect(() => {
    loadRdvs();
    loadMyNdrs();
  }, []);

  // Appliquer les filtres quand rdvs ou filtres changent
  useEffect(() => {
    applyFilters();
  }, [rdvs, statusFilter, selectedStudents]);

  const loadRdvs = async () => {
    if (!professorId) return;

    try {
      setIsLoading(true);
      const allRdvs = await rdvService.getRdvsByProfessor(professorId);

      // Filtrer : RDV futurs uniquement
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const futureRdvs = allRdvs.filter((rdv) => {
        const rdvDate = new Date(rdv.date);
        rdvDate.setHours(0, 0, 0, 0);
        // Inclure aujourd'hui et futurs, exclure les annulés par défaut
        return rdvDate >= today && rdv.status !== "annule";
      });

      // Trier par date croissante
      futureRdvs.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      setRdvs(futureRdvs);
    } catch (err) {
      console.error("Erreur lors du chargement des RDV:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMyNdrs = async () => {
    try {
      setIsLoadingNdrs(true);
      const ndrs = await ndrService.getMyActiveNdrs();
      setMyNdrs(ndrs);
    } catch (err) {
      console.error("Erreur lors du chargement des NDRs:", err);
    } finally {
      setIsLoadingNdrs(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...rdvs];

    // Filtre par statut
    if (statusFilter !== "all") {
      filtered = filtered.filter((rdv) => rdv.status === statusFilter);
    }

    // Filtre par élèves sélectionnés
    if (selectedStudents.length > 0) {
      filtered = filtered.filter(
        (rdv) => rdv.studentId && selectedStudents.includes(rdv.studentId)
      );
    }

    setFilteredRdvs(filtered);
  };

  const handleOpenRdvModal = (rdv?: RendezVous) => {
    setSelectedRdv(rdv || null);
    setIsRdvModalOpen(true);
  };

  const handleCloseRdvModal = () => {
    setSelectedRdv(null);
    setIsRdvModalOpen(false);
  };

  const handleRdvSuccess = () => {
    loadRdvs();
    handleCloseRdvModal();
  };

  const handleDeleteRdv = async (rdvId: string) => {
    if (
      !window.confirm("Êtes-vous sûr de vouloir supprimer ce rendez-vous ?")
    ) {
      return;
    }

    try {
      await rdvService.deleteRdv(rdvId);
      loadRdvs();
    } catch (err) {
      console.error("Erreur lors de la suppression du RDV:", err);
      alert("Impossible de supprimer le rendez-vous");
    }
  };

  const handleOpenDemandeModal = () => {
    setDemandeData({
      date: "",
      time: "",
      type: "physique",
      notes: "",
    });
    setIsDemandeModalOpen(true);
  };

  const handleCloseDemandeModal = () => {
    setIsDemandeModalOpen(false);
  };

  const handleSubmitDemande = async () => {
    if (!demandeData.date || !demandeData.time || !demandeData.notes.trim()) {
      alert("Veuillez remplir tous les champs obligatoires");
      return;
    }

    try {
      await rdvService.createRdv({
        professorId: professorId,
        entityType: "admin-professor",
        date: demandeData.date,
        time: demandeData.time,
        type: demandeData.type,
        notes: demandeData.notes,
      });

      alert("Votre demande de rendez-vous a été envoyée à l'administrateur");
      handleCloseDemandeModal();
      loadRdvs();
    } catch (err) {
      console.error("Erreur lors de la demande de RDV:", err);
      alert("Impossible d'envoyer la demande de rendez-vous");
    }
  };

  const canEditRdv = (rdv: RendezVous): boolean => {
    // Le prof peut éditer uniquement les RDV prof-élève
    return rdv.entityType === "professor-student";
  };

  const getRdvTypeLabel = (rdv: RendezVous): string => {
    switch (rdv.entityType) {
      case "admin-professor":
        return "Admin ↔ Prof";
      case "professor-student":
        return "Prof ↔ Élève";
      default:
        return "Autre";
    }
  };

  const getRdvPartnerName = (rdv: RendezVous): string => {
    if (rdv.entityType === "admin-professor") {
      return "Admin ABC";
    } else if (rdv.entityType === "professor-student") {
      return `Élève ${rdv.studentId || ""}`;
    }
    return "-";
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      planifie: "bg-blue-100 text-blue-800",
      realise: "bg-green-100 text-green-800",
      annule: "bg-red-100 text-red-800",
      demande: "bg-yellow-100 text-yellow-800",
    };

    const labels = {
      planifie: "Planifié",
      realise: "Réalisé",
      annule: "Annulé",
      demande: "En attente",
    };

    return (
      <span
        className={`px-2 py-1 text-xs rounded-full ${
          styles[status as keyof typeof styles] || ""
        }`}
      >
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  };

  // Construire la liste des élèves depuis les NDRs
  const studentsList = myNdrs.flatMap((ndr) =>
    ndr.beneficiaries.students.map((student) => student.id)
  );
  const uniqueStudents = Array.from(new Set(studentsList));

  const toggleStudentFilter = (studentId: string) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  return (
    <>
      <PageHeader
        title="Mes rendez-vous"
        description="Gérez tous vos rendez-vous (admin et élèves)"
      />

      <div className="px-4 py-8 w-full space-y-8">
        {/* Section Actions */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex gap-3">
            <button
              onClick={() => handleOpenRdvModal()}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 flex items-center gap-2"
            >
              + Ajouter un RDV avec un élève
            </button>
            <button
              onClick={handleOpenDemandeModal}
              className="px-4 py-2 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700 flex items-center gap-2"
            >
              📩 Demander un RDV admin
            </button>
          </div>
        </div>

        {/* Section Filtres */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Filtres</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Filtre statut */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                Statut
              </Label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Tous</option>
                <option value="planifie">Planifié</option>
                <option value="realise">Réalisé</option>
                <option value="annule">Annulé</option>
                <option value="demande">En attente</option>
              </select>
            </div>

            {/* Filtre élèves */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                Élèves
              </Label>
              {isLoadingNdrs ? (
                <p className="text-sm text-gray-500">Chargement...</p>
              ) : uniqueStudents.length === 0 ? (
                <p className="text-sm text-gray-500">Aucun élève</p>
              ) : (
                <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-md p-3 space-y-2">
                  {uniqueStudents.map((studentId) => (
                    <div
                      key={studentId}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={`student-${studentId}`}
                        checked={selectedStudents.includes(studentId)}
                        onCheckedChange={() => toggleStudentFilter(studentId)}
                      />
                      <label
                        htmlFor={`student-${studentId}`}
                        className="text-sm cursor-pointer"
                      >
                        Élève {studentId}
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tableau des RDV */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Liste des rendez-vous
          </h3>

          {isLoading ? (
            <div className="text-center py-8 text-gray-500">
              Chargement des rendez-vous...
            </div>
          ) : filteredRdvs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Aucun rendez-vous à afficher
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Heure
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type RDV
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avec
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Notes
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRdvs.map((rdv) => (
                    <tr key={rdv._id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(rdv.date).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {rdv.time}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getRdvTypeLabel(rdv)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getRdvPartnerName(rdv)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {getStatusBadge(rdv.status)}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900 max-w-xs truncate">
                        {rdv.notes || "-"}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        <div className="flex gap-2">
                          {canEditRdv(rdv) ? (
                            <>
                              <button
                                onClick={() => handleOpenRdvModal(rdv)}
                                className="text-blue-600 hover:text-blue-900"
                                title="Modifier"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => handleDeleteRdv(rdv._id)}
                                className="text-red-600 hover:text-red-900"
                                title="Supprimer"
                              >
                                🗑️
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleOpenRdvModal(rdv)}
                              className="text-gray-600 hover:text-gray-900"
                              title="Consulter"
                            >
                              👁️
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal RDV élève */}
      {isRdvModalOpen && (
        <Modal
          isOpen={isRdvModalOpen}
          onClose={handleCloseRdvModal}
          type="rdv"
          data={{
            ...(selectedRdv || {}),
            rdvId: selectedRdv?._id,
            professorId: professorId,
          }}
          onSuccess={handleRdvSuccess}
          mode={selectedRdv && !canEditRdv(selectedRdv) ? "view" : "edit"}
        />
      )}

      {/* Modal demande RDV admin */}
      {isDemandeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Demander un rendez-vous avec l'administrateur
              </h3>

              <div className="space-y-4">
                <div>
                  <Label
                    htmlFor="demande-date"
                    className="text-sm font-medium text-gray-700 mb-2 block"
                  >
                    Date souhaitée *
                  </Label>
                  <input
                    type="date"
                    id="demande-date"
                    value={demandeData.date}
                    onChange={(e) =>
                      setDemandeData({ ...demandeData, date: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <Label
                    htmlFor="demande-time"
                    className="text-sm font-medium text-gray-700 mb-2 block"
                  >
                    Heure souhaitée *
                  </Label>
                  <select
                    id="demande-time"
                    value={demandeData.time}
                    onChange={(e) =>
                      setDemandeData({ ...demandeData, time: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Sélectionner...</option>
                    {Array.from({ length: 27 }, (_, i) => {
                      const hour = Math.floor(i / 2) + 8;
                      const minute = i % 2 === 0 ? "00" : "30";
                      const time = `${hour
                        .toString()
                        .padStart(2, "0")}:${minute}`;
                      return (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <Label
                    htmlFor="demande-type"
                    className="text-sm font-medium text-gray-700 mb-2 block"
                  >
                    Type de rendez-vous *
                  </Label>
                  <select
                    id="demande-type"
                    value={demandeData.type}
                    onChange={(e) =>
                      setDemandeData({
                        ...demandeData,
                        type: e.target.value as "physique" | "virtuel",
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="physique">Physique</option>
                    <option value="virtuel">Virtuel</option>
                  </select>
                </div>

                <div>
                  <Label
                    htmlFor="demande-notes"
                    className="text-sm font-medium text-gray-700 mb-2 block"
                  >
                    Motif de la demande *
                  </Label>
                  <Textarea
                    id="demande-notes"
                    value={demandeData.notes}
                    onChange={(e) =>
                      setDemandeData({ ...demandeData, notes: e.target.value })
                    }
                    placeholder="Expliquez la raison de votre demande..."
                    className="min-h-[100px]"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleSubmitDemande}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                >
                  Envoyer la demande
                </button>
                <button
                  onClick={handleCloseDemandeModal}
                  className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
