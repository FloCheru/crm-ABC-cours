import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ProfessorProfile, EmploymentStatus, Gender } from '../../types/professor';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../ui/tabs';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { FRENCH_DEPARTMENTS } from '../../constants/departments';
import { TRANSPORT_MODES } from '../../constants/transportModes';
import { professorService } from '../../services/professorService';
import { DocumentUpload } from '../documents/DocumentUpload';
import { Download, Trash2, FileIcon, Eye } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { AlertCircle, Save, X } from 'lucide-react';
import { SubjectLevelsSelector } from './SubjectLevelsSelector';
import { subjectService } from '../../services/subjectService';
import type { Subject } from '../../types/subject';
import type { TeachingSubject } from '../../types/professor';
import type { SchoolCategory } from '../../constants/schoolLevels';

interface Document {
  _id: string;
  filename: string;
  category: string;
  uploadDate: string;
  size: number;
  contentType: string;
}

interface ProfessorProfileContentProps {
  professorId: string;
  defaultTab?: string;
}

export const ProfessorProfileContent: React.FC<ProfessorProfileContentProps> = ({
  professorId,
  defaultTab = 'informations',
}) => {
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState<Partial<ProfessorProfile>>({});
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [isSaving, setIsSaving] = useState(false);

  // États pour Documents
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // États pour Choix (Matières)
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [teachingSubjects, setTeachingSubjects] = useState<TeachingSubject[]>([]);

  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  useEffect(() => {
    loadProfile();
    loadDocuments();
    loadChoixData();
  }, [professorId]);

  const loadProfile = async () => {
    try {
      setIsLoading(true);

      // Charger le profil du professeur par son ID
      // TODO: Remplacer par un vrai appel API via professorService.getProfessorById(professorId)
      // Pour l'instant, données mockées
      const mockProfile: Partial<ProfessorProfile> = {
        _id: professorId,
        gender: 'Mme' as Gender,
        firstName: 'Marie',
        lastName: 'Dupont',
        birthName: '',
        birthDate: '1990-05-15',
        socialSecurityNumber: '',
        birthCountry: 'France',
        email: 'marie.dupont@example.com',
        phone: '0123456789',
        secondaryPhone: '',
        postalCode: '75001',
        primaryAddress: {
          street: '123 Rue Exemple',
          addressComplement: '',
          postalCode: '75001',
          city: 'Paris',
        },
        secondaryAddress: {
          street: '',
        },
        transportMode: 'voiture',
        courseLocation: 'domicile',
        // Status fields
        employmentStatus: undefined,
        siret: '',
        // Déplacements
        availableDepartments: [],
        // Disponibilités
        weeklyAvailability: {},
      };
      setFormData(mockProfile);
    } catch (err) {
      console.error('Erreur lors du chargement du profil:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDocuments = async () => {
    try {
      setIsLoadingDocuments(true);
      setError(null);

      // TODO: Remplacer par l'appel API réel
      // const docs = await professorService.getDocuments(professorId);

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
      setIsLoadingDocuments(false);
    }
  };

  const loadChoixData = async () => {
    try {
      const [subjects, mySubjects] = await Promise.all([
        subjectService.getActiveSubjects(),
        professorService.getMySubjects(),
      ]);

      console.log('Subjects loaded:', subjects);
      console.log('My subjects loaded:', mySubjects);

      // Si aucune matière n'est retournée, utiliser des données de test
      if (!subjects || subjects.length === 0) {
        console.warn('⚠️ Aucune matière trouvée - Utilisation de données de test');
        const mockSubjects: Subject[] = [
          { _id: '1', name: 'Mathématiques', category: 'Sciences' },
          { _id: '2', name: 'Français', category: 'Langues' },
          { _id: '3', name: 'Anglais', category: 'Langues' },
          { _id: '4', name: 'Histoire-Géographie', category: 'Sciences humaines' },
          { _id: '5', name: 'Physique-Chimie', category: 'Sciences' },
          { _id: '6', name: 'SVT', category: 'Sciences' },
          { _id: '7', name: 'Philosophie', category: 'Lettres' },
          { _id: '8', name: 'Espagnol', category: 'Langues' },
        ];
        setAllSubjects(mockSubjects);
      } else {
        setAllSubjects(subjects);
      }

      setTeachingSubjects(mySubjects || []);
    } catch (error) {
      console.error('❌ Erreur de chargement des matières:', error);
      // En cas d'erreur, utiliser des données de test
      const mockSubjects: Subject[] = [
        { _id: '1', name: 'Mathématiques', category: 'Sciences' },
        { _id: '2', name: 'Français', category: 'Langues' },
        { _id: '3', name: 'Anglais', category: 'Langues' },
        { _id: '4', name: 'Histoire-Géographie', category: 'Sciences humaines' },
        { _id: '5', name: 'Physique-Chimie', category: 'Sciences' },
        { _id: '6', name: 'SVT', category: 'Sciences' },
        { _id: '7', name: 'Philosophie', category: 'Lettres' },
        { _id: '8', name: 'Espagnol', category: 'Langues' },
      ];
      setAllSubjects(mockSubjects);
      setTeachingSubjects([]);
    }
  };

  const handleSave = async (section: string) => {
    try {
      setIsSaving(true);
      console.log('Sauvegarde des données:', section, formData);
      // TODO: Appeler professorService.updateProfessor(professorId, formData)
      await new Promise((resolve) => setTimeout(resolve, 500)); // Simuler API call
      alert('Modifications enregistrées avec succès !');
    } catch (err) {
      console.error('Erreur lors de la sauvegarde:', err);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSubjects = async () => {
    if (!hasValidSelection()) return;

    try {
      setIsSaving(true);
      await professorService.updateMySubjects(teachingSubjects);
      alert('Vos choix ont été enregistrés avec succès !');
    } catch (error) {
      console.error('Erreur de sauvegarde:', error);
      alert('Erreur lors de la sauvegarde. Veuillez réessayer.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: keyof ProfessorProfile, value: any) => {
    setFormData((prev: Partial<ProfessorProfile>) => ({ ...prev, [field]: value }));
  };

  const toggleDepartment = (code: string) => {
    const current = formData.availableDepartments || [];
    const updated = current.includes(code)
      ? current.filter((c) => c !== code)
      : [...current, code];
    handleInputChange('availableDepartments', updated);
  };

  // Handlers pour les matières (Choix)
  const isSubjectSelected = (subjectId: string): boolean => {
    return teachingSubjects.some(ts => ts.subjectId === subjectId);
  };

  const getGradesForSubject = (subjectId: string): string[] => {
    return teachingSubjects.find(ts => ts.subjectId === subjectId)?.grades || [];
  };

  const handleToggleSubject = (subject: Subject) => {
    if (isSubjectSelected(subject._id)) {
      setTeachingSubjects(prev => prev.filter(ts => ts.subjectId !== subject._id));
    } else {
      setTeachingSubjects(prev => [
        ...prev,
        {
          subjectId: subject._id,
          subjectName: subject.name,
          grades: [],
          levels: [],
        },
      ]);
    }
  };

  const handleGradesChange = (subjectId: string, grades: string[]) => {
    setTeachingSubjects(prev =>
      prev.map(ts =>
        ts.subjectId === subjectId
          ? { ...ts, grades, levels: deriveLevelsFromGrades(grades) }
          : ts
      )
    );
  };

  const deriveLevelsFromGrades = (grades: string[]): SchoolCategory[] => {
    const levels = new Set<SchoolCategory>();
    grades.forEach(grade => {
      if (['CP', 'CE1', 'CE2', 'CM1', 'CM2'].includes(grade)) {
        levels.add('primaire');
      }
      if (['6ème', '5ème', '4ème', '3ème'].includes(grade)) {
        levels.add('college');
      }
      if (['Seconde', 'Première', 'Terminale'].includes(grade)) {
        levels.add('lycee');
      }
      if (['L1', 'L2', 'L3', 'M1', 'M2', 'Doctorat', 'Autre'].includes(grade)) {
        levels.add('superieur');
      }
    });
    return Array.from(levels);
  };

  const hasValidSelection = (): boolean => {
    return teachingSubjects.length > 0 && teachingSubjects.every(ts => ts.grades.length > 0);
  };

  // Handlers pour les documents
  const handleFileUpload = async (file: File, category: string) => {
    try {
      setError(null);
      console.log('Upload fichier:', file.name, 'Catégorie:', category);
      await new Promise(resolve => setTimeout(resolve, 1000));
      await loadDocuments();
      alert('Document uploadé avec succès !');
    } catch (err) {
      console.error('Erreur lors de l\'upload:', err);
      throw new Error('Erreur lors de l\'upload du document');
    }
  };

  const handleDownload = async (documentId: string, filename: string) => {
    console.log('Téléchargement du document:', documentId, filename);
    alert('Fonctionnalité de téléchargement à implémenter avec le backend');
  };

  const handleView = async (documentId: string) => {
    console.log('Visualisation du document:', documentId);
    alert('Fonctionnalité de visualisation à implémenter avec le backend');
  };

  const handleDelete = async (documentId: string, filename: string) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer "${filename}" ?`)) {
      return;
    }
    console.log('Suppression du document:', documentId);
    await loadDocuments();
    alert('Document supprimé avec succès !');
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

  const renderField = (
    label: string,
    field: keyof ProfessorProfile,
    type: 'text' | 'email' | 'tel' | 'date' | 'select' = 'text',
    options?: { value: string; label: string }[],
    isFullWidth = false
  ) => {
    const fieldValue = formData[field];
    return (
      <div className={isFullWidth ? 'col-span-2' : ''}>
        <label className="text-xs text-gray-500 mb-1 block">{label}</label>
        {type === 'select' ? (
          <select
            value={String(fieldValue || '')}
            onChange={(e) => handleInputChange(field, e.target.value)}
            className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            {options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            type={type}
            value={String(fieldValue || '')}
            onChange={(e) => handleInputChange(field, e.target.value)}
            className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        )}
      </div>
    );
  };

  const selectedCount = teachingSubjects.filter(ts => ts.grades.length > 0).length;
  const invalidCount = teachingSubjects.filter(ts => ts.grades.length === 0).length;

  if (isLoading) {
    return (
      <div className="text-center text-gray-500 py-8">
        Chargement du profil...
      </div>
    );
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="bg-transparent border-b border-gray-200 rounded-none p-0 h-auto w-full justify-start">
        <TabsTrigger
          value="informations"
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-3"
        >
          Informations
        </TabsTrigger>
        <TabsTrigger
          value="documents"
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-3"
        >
          Documents
        </TabsTrigger>
        <TabsTrigger
          value="choix"
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-3"
        >
          Choix
        </TabsTrigger>
        <TabsTrigger
          value="deplacement"
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-3"
        >
          Déplacement
        </TabsTrigger>
        <TabsTrigger
          value="status"
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-3"
        >
          Status
        </TabsTrigger>
      </TabsList>

      {/* Tab 1: Informations (fusion Identité + Coordonnées) */}
      <TabsContent value="informations" className="mt-6">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Informations personnelles</h3>
            <p className="text-sm text-gray-500">
              Informations d'identité et coordonnées
            </p>
          </div>

          <div className="grid grid-cols-2 gap-x-8 gap-y-6">
            {/* Identité */}
            {renderField('Genre *', 'gender', 'select', [
              { value: 'M.', label: 'M.' },
              { value: 'Mme', label: 'Mme' },
            ])}
            {renderField('Prénom *', 'firstName')}
            {renderField('Nom *', 'lastName')}
            {renderField('Nom de naissance (si différent)', 'birthName')}
            {renderField('Date de naissance *', 'birthDate', 'date')}
            {renderField('N° de sécurité sociale', 'socialSecurityNumber')}
            {renderField('Pays de naissance', 'birthCountry', 'text', undefined, true)}
            <div className="flex items-end gap-2">
              <Checkbox
                id="nativeLanguage"
                checked={formData.nativeLanguage || false}
                onCheckedChange={(checked) =>
                  handleInputChange('nativeLanguage', checked)
                }
              />
              <Label
                htmlFor="nativeLanguage"
                className="text-sm font-normal cursor-pointer"
              >
                Langue maternelle
              </Label>
            </div>

            <div className="col-span-2 my-4">
              <Separator />
            </div>

            {/* Coordonnées */}
            {renderField('Email *', 'email', 'email')}
            {renderField('Tél principal *', 'phone', 'tel')}
            {renderField('Tél secondaire', 'secondaryPhone', 'tel')}
            {renderField('Code postal *', 'postalCode')}
            <div className="col-span-2">
              <label className="text-xs text-gray-500 mb-1 block">Adresse</label>
              <input
                type="text"
                value={formData.primaryAddress?.street || ''}
                onChange={(e) => handleInputChange('primaryAddress', { ...formData.primaryAddress, street: e.target.value })}
                className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-gray-500 mb-1 block">Complément d'adresse</label>
              <input
                type="text"
                value={formData.primaryAddress?.addressComplement || ''}
                onChange={(e) => handleInputChange('primaryAddress', { ...formData.primaryAddress, addressComplement: e.target.value })}
                className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Commune</label>
              <input
                type="text"
                value={formData.primaryAddress?.city || ''}
                onChange={(e) => handleInputChange('primaryAddress', { ...formData.primaryAddress, city: e.target.value })}
                className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            {renderField('Déplacement', 'transportMode', 'select', [
              { value: '', label: 'Sélectionner...' },
              ...TRANSPORT_MODES
            ])}
            {renderField('Cours', 'courseLocation', 'select', [
              { value: '', label: 'Sélectionner...' },
              { value: 'domicile', label: 'À domicile' },
              { value: 'visio', label: 'En visio' },
            ])}
            <div className="col-span-2">
              <label className="text-xs text-gray-500 mb-1 block">Adresse secondaire</label>
              <input
                type="text"
                value={formData.secondaryAddress?.street || ''}
                onChange={(e) => handleInputChange('secondaryAddress', { ...formData.secondaryAddress, street: e.target.value })}
                className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="mt-6">
            <Button
              onClick={() => handleSave('informations')}
              disabled={isSaving}
            >
              {isSaving ? 'Enregistrement...' : 'Sauvegarder les modifications'}
            </Button>
          </div>
        </div>
      </TabsContent>

      {/* Tab 2: Documents */}
      <TabsContent value="documents" className="mt-6">
        <div className="space-y-6">
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
                Documents ({documents.length})
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Gérer les documents du professeur
              </p>
            </div>

            {isLoadingDocuments ? (
              <div className="p-8 text-center text-gray-500">
                Chargement des documents...
              </div>
            ) : documents.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                Aucun document disponible.
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
              💡 <strong>Astuce :</strong> Gardez les documents à jour pour faciliter les démarches administratives.
            </p>
          </div>
        </div>
      </TabsContent>

      {/* Tab 3: Choix (Matières enseignées) */}
      <TabsContent value="choix" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Matières enseignées</CardTitle>
            <p className="text-sm text-muted-foreground">
              Sélectionner les matières enseignées et les niveaux correspondants
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Alert si aucune matière ou matières invalides */}
            {teachingSubjects.length === 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Sélectionner au moins une matière avec ses niveaux
                </AlertDescription>
              </Alert>
            )}

            {invalidCount > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {invalidCount} matière(s) sélectionnée(s) sans niveaux. Veuillez sélectionner au moins un niveau par matière.
                </AlertDescription>
              </Alert>
            )}

            {/* Résumé */}
            {selectedCount > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="default" className="text-sm">
                  {selectedCount} matière(s) configurée(s)
                </Badge>
              </div>
            )}

            <Separator />

            {/* Message si aucune matière disponible */}
            {allSubjects.length === 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Aucune matière disponible pour le moment. Veuillez contacter l'administrateur.
                </AlertDescription>
              </Alert>
            )}

            {/* Liste des matières */}
            <div className="space-y-4">
              {allSubjects.map(subject => {
                const isSelected = isSubjectSelected(subject._id);
                const selectedGrades = getGradesForSubject(subject._id);

                return (
                  <div
                    key={subject._id}
                    className={`border rounded-lg p-4 transition-colors ${
                      isSelected ? 'border-primary bg-accent/50' : 'border-border'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <Checkbox
                        id={`subject-${subject._id}`}
                        checked={isSelected}
                        onCheckedChange={() => handleToggleSubject(subject)}
                      />
                      <Label
                        htmlFor={`subject-${subject._id}`}
                        className="text-base font-medium cursor-pointer flex-1"
                      >
                        {subject.name}
                      </Label>
                      {isSelected && selectedGrades.length > 0 && (
                        <Badge variant="secondary">{selectedGrades.length} niveau(x)</Badge>
                      )}
                    </div>

                    {/* Sélecteur de niveaux (visible si matière cochée) */}
                    {isSelected && (
                      <SubjectLevelsSelector
                        selectedGrades={selectedGrades}
                        onChange={grades => handleGradesChange(subject._id, grades)}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            <Separator />

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={loadChoixData}
                disabled={isSaving}
              >
                <X className="w-4 h-4 mr-2" />
                Annuler
              </Button>
              <Button
                onClick={handleSaveSubjects}
                disabled={!hasValidSelection() || isSaving}
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Enregistrement...' : 'Enregistrer les choix'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Tab 4: Déplacements */}
      <TabsContent value="deplacement" className="mt-6">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Déplacements</h3>
            <p className="text-sm text-gray-500">
              Départements où le professeur peut se déplacer pour donner des cours
            </p>
          </div>

          <div className="grid grid-flow-col grid-rows-[repeat(101,minmax(0,1fr))] sm:grid-rows-[repeat(51,minmax(0,1fr))] lg:grid-rows-[repeat(34,minmax(0,1fr))] gap-3 auto-cols-fr">
            {FRENCH_DEPARTMENTS.map((dept) => (
              <div key={dept.code} className="flex items-center space-x-2">
                <Checkbox
                  id={`dept-${dept.code}`}
                  checked={formData.availableDepartments?.includes(dept.code) || false}
                  onCheckedChange={() => toggleDepartment(dept.code)}
                />
                <Label
                  htmlFor={`dept-${dept.code}`}
                  className="text-sm cursor-pointer"
                >
                  {dept.code} - {dept.name}
                </Label>
              </div>
            ))}
          </div>

          <div className="mt-6">
            <Button
              onClick={() => handleSave('deplacements')}
              disabled={isSaving}
            >
              {isSaving ? 'Enregistrement...' : 'Sauvegarder les modifications'}
            </Button>
          </div>
        </div>
      </TabsContent>

      {/* Tab 5: Status */}
      <TabsContent value="status" className="mt-6">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Statut d'emploi</h3>
            <p className="text-sm text-gray-500">
              Statut professionnel du professeur
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">
                Statut professionnel *
              </label>
              <select
                value={formData.employmentStatus || ''}
                onChange={(e) =>
                  handleInputChange('employmentStatus', e.target.value as EmploymentStatus)
                }
                className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="">Sélectionner...</option>
                <option value="salarie">Salarié</option>
                <option value="auto-entrepreneur">Auto-entrepreneur</option>
              </select>
            </div>

            {formData.employmentStatus === 'auto-entrepreneur' && (
              <div>
                <label className="text-xs text-gray-500 mb-1 block">
                  SIRET * (14 chiffres)
                </label>
                <input
                  type="text"
                  value={formData.siret || ''}
                  onChange={(e) => handleInputChange('siret', e.target.value)}
                  pattern="[0-9]{14}"
                  title="14 chiffres requis"
                  maxLength={14}
                  className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="12345678901234"
                />
              </div>
            )}
          </div>

          <div className="mt-6">
            <Button
              onClick={() => handleSave('status')}
              disabled={isSaving}
            >
              {isSaving ? 'Enregistrement...' : 'Sauvegarder les modifications'}
            </Button>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
};
