import { apiClient } from "../utils/apiClient";
import type { ProfessorDocument, DocumentType } from "../types/professor-document";

// Interface pour typer les réponses API
interface ApiResponse<T> {
  data: T;
  success?: boolean;
  message?: string;
}

export const professorDocumentService = {
  /**
   * Récupère tous les documents du professeur connecté
   * Inclut les documents actifs et archivés
   */
  async getMyDocuments(): Promise<ProfessorDocument[]> {
    const response = await apiClient.get("/api/professors/me/documents") as ApiResponse<ProfessorDocument[]>;
    return response.data;
  },

  /**
   * Upload un nouveau document ou remplace un document existant
   * Si un document actif du même type existe, il sera automatiquement archivé
   */
  async uploadDocument(
    type: DocumentType,
    file: File
  ): Promise<ProfessorDocument> {
    const formData = new FormData();
    formData.append("type", type);
    formData.append("file", file);

    // Note: FormData ne peut pas être passé directement via apiClient.post car il stringify
    // On utilise fetch directement pour les uploads de fichiers
    const token = localStorage.getItem("token");
    const baseURL = import.meta.env.VITE_API_URL || "http://localhost:3000";

    const response = await fetch(`${baseURL}/api/professors/me/documents/upload`, {
      method: "POST",
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const data = await response.json() as ApiResponse<{ document: ProfessorDocument }>;
    return data.data.document;
  },

  /**
   * Télécharge un document spécifique
   * Retourne le blob du fichier pour téléchargement
   */
  async downloadDocument(documentId: string): Promise<Blob> {
    // Pour le téléchargement de blob, on utilise fetch directement
    const token = localStorage.getItem("token");
    const baseURL = import.meta.env.VITE_API_URL || "http://localhost:3000";

    const response = await fetch(`${baseURL}/api/professors/me/documents/${documentId}/download`, {
      method: "GET",
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      throw new Error(`Download failed: ${response.statusText}`);
    }

    return await response.blob();
  },

  /**
   * Archive manuellement un document
   * Utile si le professeur veut archiver sans uploader de nouvelle version
   */
  async archiveDocument(documentId: string): Promise<void> {
    await apiClient.patch(`/api/professors/me/documents/${documentId}/archive`);
  },

  /**
   * Supprime définitivement un document
   * Attention : opération irréversible
   */
  async deleteDocument(documentId: string): Promise<void> {
    await apiClient.delete(`/api/professors/me/documents/${documentId}`);
  },

  /**
   * Récupère le document actif d'un type spécifique
   */
  async getActiveDocumentByType(
    type: DocumentType
  ): Promise<ProfessorDocument | null> {
    const documents = await this.getMyDocuments();
    return (
      documents.find((doc) => doc.type === type && doc.status === "active") ||
      null
    );
  },

  /**
   * Récupère l'historique des versions archivées d'un type de document
   */
  async getArchivedVersions(type: DocumentType): Promise<ProfessorDocument[]> {
    const documents = await this.getMyDocuments();
    return documents
      .filter((doc) => doc.type === type && doc.status === "archived")
      .sort((a, b) => b.version - a.version); // Tri par version décroissante
  },
};
