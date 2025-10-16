export interface ProfessorDocument {
  _id: string;
  professorId: string;
  type: "attestation_france_travail" | "certificat_travail";
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
  version: number;
  status: "active" | "archived";
  fileSize?: number; // Taille en octets
  mimeType?: string; // Type MIME du fichier
}

export interface UploadDocumentData {
  type: "attestation_france_travail" | "certificat_travail";
  file: File;
}

export type DocumentType = "attestation_france_travail" | "certificat_travail";

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  attestation_france_travail: "Attestation France Travail",
  certificat_travail: "Certificat de travail",
};
