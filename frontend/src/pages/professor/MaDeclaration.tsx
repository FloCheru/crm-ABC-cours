import React, { useState, useEffect } from "react";
import { PageHeader } from "../../components";
import { Alert, AlertDescription } from "../../components/ui/alert";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader } from "../../components/ui/card";
import { Label } from "../../components/ui/label";
import { Input } from "../../components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../../components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../components/ui/dialog";
import { professorService } from "../../services/professorService";
import { professorDocumentService } from "../../services/professorDocumentService";
import type { EmploymentStatus } from "../../types/teacher";
import type {
  ProfessorDocument,
  DocumentType,
  DOCUMENT_TYPE_LABELS,
} from "../../types/professor-document";
import { AlertCircle, Download, Upload, FileText, Archive } from "lucide-react";

const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  attestation_france_travail: "Attestation France Travail",
  certificat_travail: "Certificat de travail",
};

export const MaDeclaration: React.FC = () => {
  const [employmentStatus, setEmploymentStatus] = useState<EmploymentStatus | null>(null);
  const [documents, setDocuments] = useState<ProfessorDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedDocumentType, setSelectedDocumentType] = useState<DocumentType | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Charger le profil et les documents
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);

        // Charger le profil pour vérifier le statut d'emploi
        const profile = await professorService.getMyProfile();
        setEmploymentStatus(profile.employmentStatus || null);

        // Charger les documents
        const docs = await professorDocumentService.getMyDocuments();
        setDocuments(docs);
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Obtenir le document actif d'un type
  const getActiveDocument = (type: DocumentType): ProfessorDocument | null => {
    return documents.find((doc) => doc.type === type && doc.status === "active") || null;
  };

  // Obtenir les versions archivées d'un type
  const getArchivedVersions = (type: DocumentType): ProfessorDocument[] => {
    return documents
      .filter((doc) => doc.type === type && doc.status === "archived")
      .sort((a, b) => b.version - a.version);
  };

  // Ouvrir le dialog d'upload
  const handleOpenUpload = (type: DocumentType) => {
    setSelectedDocumentType(type);
    setSelectedFile(null);
    setUploadDialogOpen(true);
  };

  // Gérer la sélection de fichier
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // Upload le document
  const handleUpload = async () => {
    if (!selectedDocumentType || !selectedFile) return;

    try {
      setIsUploading(true);
      const newDocument = await professorDocumentService.uploadDocument(
        selectedDocumentType,
        selectedFile
      );

      // Mettre à jour la liste des documents
      setDocuments((prev) => {
        // Archiver l'ancien document actif s'il existe
        const updated = prev.map((doc) =>
          doc.type === selectedDocumentType && doc.status === "active"
            ? { ...doc, status: "archived" as const }
            : doc
        );
        // Ajouter le nouveau document
        return [...updated, newDocument];
      });

      setUploadDialogOpen(false);
      setSelectedFile(null);
    } catch (error) {
      console.error("Erreur lors de l'upload:", error);
      alert("Erreur lors de l'upload du document. Veuillez réessayer.");
    } finally {
      setIsUploading(false);
    }
  };

  // Télécharger un document
  const handleDownload = async (document: ProfessorDocument) => {
    try {
      const blob = await professorDocumentService.downloadDocument(document._id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = document.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Erreur lors du téléchargement:", error);
      alert("Erreur lors du téléchargement du document. Veuillez réessayer.");
    }
  };

  // Formater la date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Formater la taille du fichier
  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return "-";
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} Ko`;
    const mb = kb / 1024;
    return `${mb.toFixed(1)} Mo`;
  };

  // Composant pour une section de document
  const DocumentSection: React.FC<{
    type: DocumentType;
    visible: boolean;
  }> = ({ type, visible }) => {
    if (!visible) return null;

    const activeDoc = getActiveDocument(type);
    const archivedVersions = getArchivedVersions(type);

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              {DOCUMENT_TYPE_LABELS[type]}
            </h3>
            {activeDoc && (
              <Badge variant="default" className="bg-green-600">
                Version {activeDoc.version}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Document actif */}
          {activeDoc ? (
            <div className="space-y-3">
              <div className="flex items-start justify-between p-4 border rounded-lg">
                <div className="flex items-start gap-3 flex-1">
                  <FileText className="w-5 h-5 text-blue-600 mt-1" />
                  <div className="flex-1">
                    <p className="font-medium">{activeDoc.fileName}</p>
                    <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                      <span>Uploadé le {formatDate(activeDoc.uploadedAt)}</span>
                      <span>{formatFileSize(activeDoc.fileSize)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(activeDoc)}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Télécharger
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenUpload(type)}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Remplacer
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Aucun document disponible pour le moment.
                </AlertDescription>
              </Alert>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled
                  title="Disponible prochainement"
                >
                  Générer automatiquement
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleOpenUpload(type)}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Uploader un document
                </Button>
              </div>
            </div>
          )}

          {/* Historique des versions */}
          {archivedVersions.length > 0 && (
            <Accordion type="single" collapsible>
              <AccordionItem value="history">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <Archive className="w-4 h-4" />
                    <span>Historique des versions ({archivedVersions.length})</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 pt-2">
                    {archivedVersions.map((doc) => (
                      <div
                        key={doc._id}
                        className="flex items-center justify-between p-3 border rounded-lg bg-muted/50"
                      >
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary">V{doc.version}</Badge>
                          <div>
                            <p className="text-sm font-medium">{doc.fileName}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(doc.uploadedAt)}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(doc)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      <PageHeader title="Ma Déclaration" />
      <div className="px-4 w-full">
        {isLoading ? (
          <p className="text-center text-muted-foreground py-8">
            Chargement des documents...
          </p>
        ) : (
          <div className="space-y-6">
            {/* Alerte si statut non défini */}
            {!employmentStatus && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Votre statut professionnel n'est pas défini. Veuillez compléter
                  votre profil dans l'onglet "Mon RIB".
                </AlertDescription>
              </Alert>
            )}

            {/* Attestation France Travail (salarié uniquement) */}
            <DocumentSection
              type="attestation_france_travail"
              visible={employmentStatus === "salarie"}
            />

            {/* Certificat de travail (tous) */}
            <DocumentSection type="certificat_travail" visible={true} />
          </div>
        )}
      </div>

      {/* Dialog d'upload */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedDocumentType
                ? `Uploader - ${DOCUMENT_TYPE_LABELS[selectedDocumentType]}`
                : "Uploader un document"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {getActiveDocument(selectedDocumentType!) && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Un document existe déjà. L'uploader un nouveau fichier créera une
                  nouvelle version et archivera l'ancienne.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="file">Sélectionner un fichier</Label>
              <Input
                id="file"
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
              />
              <p className="text-xs text-muted-foreground">
                Formats acceptés : PDF, DOC, DOCX (max 10 Mo)
              </p>
            </div>

            {selectedFile && (
              <div className="p-3 border rounded-lg bg-muted">
                <p className="text-sm font-medium">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setUploadDialogOpen(false)}
              disabled={isUploading}
            >
              Annuler
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
            >
              {isUploading ? "Upload en cours..." : "Uploader"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
