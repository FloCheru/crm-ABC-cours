import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components';
import { DocumentUpload } from '../../components/documents/DocumentUpload';
import { Download, Trash2, FileIcon, Eye } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { useAuthStore } from '../../stores';

interface Document {
  _id: string;
  filename: string;
  category: string;
  uploadDate: string;
  size: number;
  contentType: string;
}

export const MesDocuments: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const professorId = user?._id;

  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (professorId) {
      loadDocuments();
    }
  }, [professorId]);

  const loadDocuments = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // TODO: Remplacer par l'appel API réel
      // const docs = await professorService.getDocuments(professorId!);

      // Données mockées pour le moment
      const mockDocuments: Document[] = [
        {
          _id: '1',
          filename: 'Mon_CV.pdf',
          category: 'CV',
          uploadDate: new Date('2024-01-15').toISOString(),
          size: 245000,
          contentType: 'application/pdf'
        },
        {
          _id: '2',
          filename: 'Diplome_Master_Mathematiques.pdf',
          category: 'Diplôme',
          uploadDate: new Date('2024-01-20').toISOString(),
          size: 1200000,
          contentType: 'application/pdf'
        },
        {
          _id: '3',
          filename: 'RIB_Banque_Postale.pdf',
          category: 'RIB',
          uploadDate: new Date('2024-02-01').toISOString(),
          size: 89000,
          contentType: 'application/pdf'
        }
      ];

      setDocuments(mockDocuments);
    } catch (err) {
      console.error('Erreur lors du chargement des documents:', err);
      setError('Impossible de charger vos documents');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (file: File, category: string) => {
    try {
      setError(null);

      // TODO: Remplacer par l'appel API réel
      // await professorService.uploadDocument(professorId!, file, category);

      console.log('Upload fichier:', file.name, 'Catégorie:', category);

      // Simuler un upload réussi
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Recharger les documents
      await loadDocuments();

      alert('Document uploadé avec succès !');
    } catch (err) {
      console.error('Erreur lors de l\'upload:', err);
      throw new Error('Erreur lors de l\'upload du document');
    }
  };

  const handleDownload = async (documentId: string, filename: string) => {
    try {
      // TODO: Remplacer par l'appel API réel
      // const blob = await professorService.downloadDocument(documentId);
      // const url = window.URL.createObjectURL(blob);
      // const a = document.createElement('a');
      // a.href = url;
      // a.download = filename;
      // document.body.appendChild(a);
      // a.click();
      // window.URL.revokeObjectURL(url);
      // document.body.removeChild(a);

      console.log('Téléchargement du document:', documentId, filename);
      alert('Fonctionnalité de téléchargement à implémenter avec le backend');
    } catch (err) {
      console.error('Erreur lors du téléchargement:', err);
      alert('Erreur lors du téléchargement du document');
    }
  };

  const handleView = async (documentId: string) => {
    try {
      // TODO: Remplacer par l'appel API réel
      // const blob = await professorService.downloadDocument(documentId);
      // const url = window.URL.createObjectURL(blob);
      // window.open(url, '_blank');
      // window.URL.revokeObjectURL(url);

      console.log('Visualisation du document:', documentId);
      alert('Fonctionnalité de visualisation à implémenter avec le backend');
    } catch (err) {
      console.error('Erreur lors de la visualisation:', err);
      alert('Erreur lors de la visualisation du document');
    }
  };

  const handleDelete = async (documentId: string, filename: string) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer "${filename}" ?`)) {
      return;
    }

    try {
      // TODO: Remplacer par l'appel API réel
      // await professorService.deleteDocument(documentId);

      console.log('Suppression du document:', documentId);

      // Recharger les documents
      await loadDocuments();

      alert('Document supprimé avec succès !');
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
      alert('Erreur lors de la suppression du document');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (contentType: string) => {
    if (contentType === 'application/pdf') {
      return <FileIcon className="w-5 h-5 text-red-600" />;
    }
    if (contentType.startsWith('image/')) {
      return <FileIcon className="w-5 h-5 text-blue-600" />;
    }
    return <FileIcon className="w-5 h-5 text-gray-600" />;
  };

  // Afficher un loader si l'utilisateur n'est pas encore chargé
  if (!user) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="text-gray-500">Chargement...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Mes documents"
        breadcrumb={[
          { label: 'Dashboard', href: '/professor/dashboard' },
          { label: 'Mes documents' }
        ]}
      />

      <div className="container mx-auto px-4 max-w-6xl space-y-10">
        {/* Section Upload */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Ajouter un nouveau document
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Formats acceptés : PDF, PNG, JPG, GIF, WEBP (max 10MB)
            </p>
          </div>

          <DocumentUpload onFileSelect={handleFileUpload} />
        </div>

        {/* Message d'erreur global */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Liste des documents */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Mes documents ({documents.length})
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Gérez vos documents personnels
            </p>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-gray-500">
              Chargement de vos documents...
            </div>
          ) : documents.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              Vous n'avez pas encore de document. Commencez par en uploader un ci-dessus.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Document
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Catégorie
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Taille
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date d'ajout
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {documents.map((doc) => (
                    <tr key={doc._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          {getFileIcon(doc.contentType)}
                          <span className="text-sm font-medium text-gray-900">
                            {doc.filename}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                          {doc.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatFileSize(doc.size)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(doc.uploadDate).toLocaleDateString('fr-FR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <div className="flex justify-end gap-2">
                          <Button
                            onClick={() => handleView(doc._id)}
                            variant="outline"
                            size="sm"
                            title="Visualiser"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() => handleDownload(doc._id, doc.filename)}
                            variant="outline"
                            size="sm"
                            title="Télécharger"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() => handleDelete(doc._id, doc.filename)}
                            variant="outline"
                            size="sm"
                            title="Supprimer"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Note d'information */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-700">
            💡 <strong>Astuce :</strong> Gardez vos documents à jour pour faciliter les démarches administratives.
            Vos documents sont sécurisés et accessibles uniquement par vous et les administrateurs.
          </p>
        </div>
      </div>
    </>
  );
};
