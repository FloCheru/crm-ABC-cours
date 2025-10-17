import React, { useState, useEffect } from "react";
import { PageHeader } from "../../components";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader } from "../../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Textarea } from "../../components/ui/textarea";
import { Separator } from "../../components/ui/separator";
import studentService from "../../services/studentService";
import type { StudentWithStats, StudentSession } from "../../types/student";

export const MesEleves: React.FC = () => {
  const [students, setStudents] = useState<StudentWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<StudentWithStats | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingComments, setEditingComments] = useState<Record<string, string>>({});
  const [savingComments, setSavingComments] = useState<Record<string, boolean>>({});

  // Charger la liste des élèves
  useEffect(() => {
    const loadStudents = async () => {
      try {
        setIsLoading(true);
        const data = await studentService.getMyStudents();
        setStudents(data);
      } catch (error) {
        console.error("Erreur lors du chargement des élèves:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStudents();
  }, []);

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
  const formatLocation = (location: "home" | "professor" | "online"): string => {
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

  return (
    <>
      <PageHeader title="Mes Élèves" />
      <div className="px-4 py-8 w-full space-y-8">
        {/* Statistiques */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-muted-foreground">Nombre d'élèves</p>
                <p className="text-2xl font-bold">{students.length}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Élèves actifs</p>
                <p className="text-2xl font-bold text-green-600">
                  {students.filter((s) => s.isActive).length}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de cours</p>
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
            {isLoading ? (
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
                      <TableHead className="text-center">Nb cours</TableHead>
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
                            <Badge variant="default" className="bg-green-600">
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
      </div>

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
                                    value={editingComments[session.couponId] || ""}
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
    </>
  );
};
