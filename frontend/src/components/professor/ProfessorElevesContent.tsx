import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../ui/tabs";
import { Modal } from "../index";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader } from "../ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Textarea } from "../ui/textarea";
import { Separator } from "../ui/separator";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";
import studentService from "../../services/studentService";
import type { StudentWithStats } from "../../types/student";
import type { RendezVous } from "../../types/rdv";
import type { NDR } from "../../services/ndrService";
import rdvService from "../../services/rdvService";
import { ndrService } from "../../services/ndrService";

interface ProfessorElevesContentProps {
  professorId: string;
  defaultTab?: string;
}

export const ProfessorElevesContent: React.FC<ProfessorElevesContentProps> = ({
  professorId,
  defaultTab = 'liste'
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(defaultTab);

  // États pour l'onglet "Élèves"
  const [students, setStudents] = useState<StudentWithStats[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(true);
  const [selectedStudent, setSelectedStudent] =
    useState<StudentWithStats | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingComments, setEditingComments] = useState<
    Record<string, string>
  >({});
  const [savingComments, setSavingComments] = useState<Record<string, boolean>>(
    {}
  );

  // États pour l'onglet "RDV"
  const [rdvs, setRdvs] = useState<RendezVous[]>([]);
  const [filteredRdvs, setFilteredRdvs] = useState<RendezVous[]>([]);
  const [myNdrs, setMyNdrs] = useState<NDR[]>([]);
  const [isLoadingRdvs, setIsLoadingRdvs] = useState(true);
  const [isLoadingNdrs, setIsLoadingNdrs] = useState(true);

  // États filtres RDV
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedStudentsFilter, setSelectedStudentsFilter] = useState<
    string[]
  >([]);

  // États modals RDV
  const [isRdvModalOpen, setIsRdvModalOpen] = useState(false);
  const [isDemandeModalOpen, setIsDemandeModalOpen] = useState(false);
  const [selectedRdv, setSelectedRdv] = useState<RendezVous | null>(null);

  // Demande RDV admin
  const [demandeData, setDemandeData] = useState({
    date: "",
    time: "",
    type: "physique" as "physique" | "visio",
    notes: "",
  });

  // Synchroniser l'onglet actif avec defaultTab
  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  // Charger les données au montage
  useEffect(() => {
    loadStudents();
    loadRdvs();
    loadMyNdrs();
  }, [professorId]);

  // Appliquer les filtres RDV quand rdvs ou filtres changent
  useEffect(() => {
    applyFilters();
  }, [rdvs, statusFilter, selectedStudentsFilter]);

  // Charger la liste des élèves
  const loadStudents = async () => {
    try {
      setIsLoadingStudents(true);
      const data = await studentService.getMyStudents();
      setStudents(data);
    } catch (error) {
      console.error("Erreur lors du chargement des élèves:", error);
    } finally {
      setIsLoadingStudents(false);
    }
  };

  // Ouvrir le dialog avec les détails de l'élève
  const handleViewDetails = async (student: StudentWithStats) => {
    setSelectedStudent(student);
    setIsDialogOpen(true);

    // Initialiser les commentaires pour l'édition
    const comments: Record<string, string> = {};
    student.sessions.forEach((session) => {
      comments[session.couponId] = session.professorComment || "";
    });
    setEditingComments(comments);
  };

  // Formater la date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Formater le lieu du cours
  const formatLocation = (
    location: "home" | "professor" | "online"
  ): string => {
    const locations = {
      home: "À domicile",
      professor: "Chez le professeur",
      online: "En ligne",
    };
    return locations[location];
  };

  // Gérer la modification d'un commentaire
  const handleCommentChange = (couponId: string, value: string) => {
    setEditingComments((prev) => ({
      ...prev,
      [couponId]: value,
    }));
  };

  // Enregistrer un commentaire
  const handleSaveComment = async (couponId: string) => {
    try {
      setSavingComments((prev) => ({ ...prev, [couponId]: true }));
      const comment = editingComments[couponId];

      if (comment.trim()) {
        await studentService.addSessionComment(couponId, comment);
      } else {
        await studentService.deleteSessionComment(couponId);
      }

      // Mettre à jour l'élève sélectionné
      if (selectedStudent) {
        const updatedSessions = selectedStudent.sessions.map((session) =>
          session.couponId === couponId
            ? { ...session, professorComment: comment }
            : session
        );
        setSelectedStudent({
          ...selectedStudent,
          sessions: updatedSessions,
        });

        // Mettre à jour aussi dans la liste
        setStudents((prev) =>
          prev.map((s) =>
            s._id === selectedStudent._id
              ? { ...s, sessions: updatedSessions }
              : s
          )
        );
      }
    } catch (error) {
      console.error("Erreur lors de l'enregistrement du commentaire:", error);
    } finally {
      setSavingComments((prev) => ({ ...prev, [couponId]: false }));
    }
  };

  // --- Fonctions pour RDV ---
  const loadRdvs = async () => {
    if (!professorId) return;

    try {
      setIsLoadingRdvs(true);
      const allRdvs = await rdvService.getRdvsByProfessor(professorId);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const futureRdvs = allRdvs.filter((rdv) => {
        const rdvDate = new Date(rdv.date);
        rdvDate.setHours(0, 0, 0, 0);
        return rdvDate >= today && rdv.status !== "annule";
      });

      futureRdvs.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      setRdvs(futureRdvs);
    } catch (err) {
      console.error("Erreur lors du chargement des RDV:", err);
    } finally {
      setIsLoadingRdvs(false);
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

    if (statusFilter !== "all") {
      filtered = filtered.filter((rdv) => rdv.status === statusFilter);
    }

    if (selectedStudentsFilter.length > 0) {
      filtered = filtered.filter(
        (rdv) => rdv.studentId && selectedStudentsFilter.includes(rdv.studentId)
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

  const studentsList = myNdrs.flatMap((ndr) =>
    ndr.beneficiaries.students.map((student) => student.id)
  );
  const uniqueStudents = Array.from(new Set(studentsList));

  const toggleStudentFilter = (studentId: string) => {
    setSelectedStudentsFilter((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  return (
    <>
      <Tabs
        value={activeTab}
        onValueChange={(tab: string) => {
          setActiveTab(tab);
          navigate(`?tab=${tab}`, { replace: true });
        }}
        className="w-full"
      >
        <TabsList className="bg-transparent border-b border-gray-200 rounded-none p-0 h-auto w-full justify-start">
          <TabsTrigger
            value="liste"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-3"
          >
            Élèves
          </TabsTrigger>
          <TabsTrigger
            value="bilan"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-3"
          >
            Bilan
          </TabsTrigger>
          <TabsTrigger
            value="rdv"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-3"
          >
            RDV
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Liste des élèves */}
        <TabsContent value="liste" className="mt-6 space-y-8">
          {/* Statistiques */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Nombre d'élèves
                  </p>
                  <p className="text-2xl font-bold">{students.length}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Élèves actifs
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {students.filter((s) => s.isActive).length}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Total de cours
                  </p>
                  <p className="text-2xl font-bold">
                    {students.reduce((sum, s) => sum + s.totalSessions, 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tableau des élèves */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Liste de mes élèves</h3>
            </CardHeader>
            <CardContent>
              {isLoadingStudents ? (
                <p className="text-center text-muted-foreground py-8">
                  Chargement des élèves...
                </p>
              ) : students.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Aucun élève pour le moment.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nom</TableHead>
                        <TableHead>Prénom</TableHead>
                        <TableHead>Niveau</TableHead>
                        <TableHead>Matière(s)</TableHead>
                        <TableHead className="text-center">
                          Nb cours
                        </TableHead>
                        <TableHead>Dernier cours</TableHead>
                        <TableHead className="text-center">Statut</TableHead>
                        <TableHead className="text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.map((student) => (
                        <TableRow key={student._id}>
                          <TableCell className="font-medium">
                            {student.lastName}
                          </TableCell>
                          <TableCell>{student.firstName}</TableCell>
                          <TableCell>
                            {student.grade ? (
                              <Badge variant="outline">{student.grade}</Badge>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {student.subjects.map((subject, idx) => (
                                <Badge key={idx} variant="secondary">
                                  {subject}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            {student.totalSessions}
                          </TableCell>
                          <TableCell>
                            {student.lastSessionDate
                              ? formatDate(student.lastSessionDate)
                              : "-"}
                          </TableCell>
                          <TableCell className="text-center">
                            {student.isActive ? (
                              <Badge
                                variant="default"
                                className="bg-green-600"
                              >
                                Actif
                              </Badge>
                            ) : (
                              <Badge variant="secondary">Inactif</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewDetails(student)}
                            >
                              Voir détails
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Bilan */}
        <TabsContent value="bilan" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12 text-gray-500">
                <p className="text-lg font-semibold mb-2">
                  Fonctionnalité en développement
                </p>
                <p className="text-sm">
                  Cette section permettra de consulter le bilan pédagogique de
                  vos élèves.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: RDV */}
        <TabsContent value="rdv" className="mt-6 space-y-8">
          {/* Section Actions */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <div className="flex gap-3">
              <button
                onClick={() => handleOpenRdvModal()}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 flex items-center gap-2"
              >
                + Ajouter un RDV avec un élève
              </button>
            </div>
          </div>

          {/* Section Filtres */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Filtres
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                          checked={selectedStudentsFilter.includes(studentId)}
                          onCheckedChange={() =>
                            toggleStudentFilter(studentId)
                          }
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

            {isLoadingRdvs ? (
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
        </TabsContent>
      </Tabs>

      {/* Dialog détails élève */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Détails - {selectedStudent?.firstName} {selectedStudent?.lastName}
            </DialogTitle>
          </DialogHeader>

          {selectedStudent && (
            <div className="space-y-6">
              {/* Section Coordonnées */}
              <Card>
                <CardHeader>
                  <h4 className="font-semibold">Coordonnées</h4>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Élève</p>
                      <p className="font-medium">
                        {selectedStudent.firstName} {selectedStudent.lastName}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Niveau</p>
                      <p className="font-medium">
                        {selectedStudent.grade || "-"}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Contact famille
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Nom</p>
                        <p>
                          {selectedStudent.family.primaryContact.firstName}{" "}
                          {selectedStudent.family.primaryContact.lastName}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Email</p>
                        <p>{selectedStudent.family.primaryContact.email}</p>
                      </div>
                      {selectedStudent.family.primaryContact.phone && (
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Téléphone
                          </p>
                          <p>{selectedStudent.family.primaryContact.phone}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedStudent.family.address && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">
                          Adresse
                        </p>
                        <p>
                          {selectedStudent.family.address.street}
                          <br />
                          {selectedStudent.family.address.postalCode}{" "}
                          {selectedStudent.family.address.city}
                        </p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Section Historique des cours */}
              <Card>
                <CardHeader>
                  <h4 className="font-semibold">
                    Historique des cours ({selectedStudent.sessions.length})
                  </h4>
                </CardHeader>
                <CardContent>
                  {selectedStudent.sessions.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">
                      Aucun cours enregistré.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Matière</TableHead>
                            <TableHead>Lieu</TableHead>
                            <TableHead className="text-center">Durée</TableHead>
                            <TableHead>Notes séance</TableHead>
                            <TableHead>Mon commentaire</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedStudent.sessions.map((session) => (
                            <TableRow key={session.couponId}>
                              <TableCell>{formatDate(session.date)}</TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {session.subject}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {formatLocation(session.location)}
                              </TableCell>
                              <TableCell className="text-center">
                                {session.duration}h
                              </TableCell>
                              <TableCell>
                                <div className="max-w-xs text-sm text-muted-foreground">
                                  {session.notes || "-"}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="space-y-2 min-w-[250px]">
                                  <Textarea
                                    value={
                                      editingComments[session.couponId] || ""
                                    }
                                    onChange={(e) =>
                                      handleCommentChange(
                                        session.couponId,
                                        e.target.value
                                      )
                                    }
                                    placeholder="Ajouter un commentaire pédagogique..."
                                    rows={2}
                                    className="resize-none"
                                  />
                                  <Button
                                    size="sm"
                                    onClick={() =>
                                      handleSaveComment(session.couponId)
                                    }
                                    disabled={
                                      savingComments[session.couponId] ||
                                      editingComments[session.couponId] ===
                                        session.professorComment
                                    }
                                  >
                                    {savingComments[session.couponId]
                                      ? "Enregistrement..."
                                      : "Enregistrer"}
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
                        type: e.target.value as "physique" | "visio",
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="physique">Physique</option>
                    <option value="visio">Visio</option>
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
