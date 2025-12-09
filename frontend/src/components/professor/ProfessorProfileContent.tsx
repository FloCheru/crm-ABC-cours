import React, { useState, useEffect } from 'react';
import type { ProfessorProfile } from '../../types/professor';
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
import { DepartmentCombobox } from './DepartmentCombobox';
import { CommuneCombobox } from './CommuneCombobox';
import { TransportModesCombobox } from './TransportModesCombobox';
import { subjectService } from '../../services/subjectService';
import { geoApiService, type Commune } from '../../services/geoApiService';
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
  teachingSubjects?: TeachingSubject[];
  onSaveSuccess?: () => Promise<void>;
}

export const ProfessorProfileContent: React.FC<ProfessorProfileContentProps> = ({
  professorId,
  defaultTab = 'informations',
  teachingSubjects: initialTeachingSubjects,
  onSaveSuccess,
}) => {

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
  const [customSubjectName, setCustomSubjectName] = useState('');
  const [isAddingCustomSubject, setIsAddingCustomSubject] = useState(false);
  const [isEditingSubjects, setIsEditingSubjects] = useState(false);

  // États pour Déplacements (Communes)
  const [communesByDept, setCommunesByDept] = useState<Record<string, Commune[]>>({});
  const [showDepartmentCombobox, setShowDepartmentCombobox] = useState(false);
  const [showCommuneCombobox, setShowCommuneCombobox] = useState<Record<string, boolean>>({});

  // États pour Modes de déplacement
  const [showTransportModesCombobox, setShowTransportModesCombobox] = useState(false);

  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  useEffect(() => {
    loadProfile();
    loadDocuments();
    loadChoixData();
    loadTeachingSubjectsFromProfile();
  }, [professorId]);

  // Effet pour auto-sélectionner les départements depuis les adresses
  useEffect(() => {
    const protectedDepts = getProtectedDepartments();
    const currentDepts = formData.availableDepartments || [];

    // Fusionner les départements protégés avec ceux existants
    const mergedDepts = Array.from(new Set([...currentDepts, ...protectedDepts]));

    // Mettre à jour seulement si différent pour éviter boucles infinies
    if (
      mergedDepts.length !== currentDepts.length ||
      !mergedDepts.every((d) => currentDepts.includes(d))
    ) {
      handleInputChange('availableDepartments', mergedDepts);
    }
  }, [formData.primaryAddress?.postalCode, formData.secondaryAddress?.postalCode]);

  const loadProfile = async () => {
    if (!professorId) return;

    try {
      console.log(`\n📥 loadProfile() - DÉBUT - professorId: ${professorId}`);
      setIsLoading(true);
      const professor = await professorService.getProfessorById(professorId);
      console.log(`✅ loadProfile() - Données reçues du serveur:`, professor);
      setFormData(professor);
      console.log(`✅ loadProfile() - setFormData() appelé, profil mis à jour`);
      return professor;
    } catch (err) {
      console.error('❌ Erreur lors du chargement du profil:', err);
      setError('Impossible de charger le profil du professeur');
      return null;
    } finally {
      setIsLoading(false);
      console.log(`✅ loadProfile() - FIN`);
    }
  };

  const loadDocuments = async () => {
    if (!professorId) return;

    try {
      setIsLoadingDocuments(true);
      setError(null);
      const docs = await professorService.getDocuments(professorId);
      setDocuments(docs);
    } catch (err) {
      console.error('Erreur lors du chargement des documents:', err);
      setError('Impossible de charger vos documents');
    } finally {
      setIsLoadingDocuments(false);
    }
  };

  const loadChoixData = async () => {
    try {
      const subjects = await subjectService.getActiveSubjects();

      console.log('Subjects loaded:', subjects);
      console.log('Teaching subjects from props:', initialTeachingSubjects);

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

      // Utiliser les teachingSubjects passés en props
      setTeachingSubjects(initialTeachingSubjects || []);
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
      setTeachingSubjects(initialTeachingSubjects || []);
    }
  };

  // Charger et fusionner les matières depuis le profil complet
  const loadTeachingSubjectsFromProfile = async () => {
    try {
      console.log(`\n📥 loadTeachingSubjectsFromProfile() - DÉBUT`);
      const professor = await professorService.getProfessorById(professorId) as ProfessorProfile;
      console.log(`✅ loadTeachingSubjectsFromProfile() - Profil reçu:`, professor);

      // Fusionner teachingSubjects (standard) et customSubjects
      const mergedSubjects: TeachingSubject[] = [
        ...(professor.teachingSubjects || []),
        ...(professor.customSubjects || []).map((cs: any, index: number) => ({
          subjectId: `custom-${Date.now()}-${index}`,
          subjectName: cs.subjectName,
          grades: cs.grades,
          levels: cs.levels,
          isCustom: true,
        })),
      ];

      console.log(`📊 loadTeachingSubjectsFromProfile() - Matières fusionnées:`, mergedSubjects);
      setTeachingSubjects(mergedSubjects);
      console.log(`✅ loadTeachingSubjectsFromProfile() - setTeachingSubjects() appelé`);
      console.log(`✅ loadTeachingSubjectsFromProfile() - FIN`);
    } catch (error) {
      console.error('❌ Erreur lors du chargement des matières du profil:', error);
    }
  };

  const handleSave = async (section: string) => {
    try {
      setIsSaving(true);

      const timestamp = new Date().toLocaleTimeString('fr-FR');
      console.log(`\n📤 [${section.toUpperCase()}] Début de sauvegarde - ${timestamp}`);
      console.log(`📊 [${section.toUpperCase()}] État formData complet:`, formData);

      // Préparer les données à envoyer selon la section
      let dataToSend = {};

      if (section === 'informations') {
        // Pour la section informations, envoyer tous les champs sauf teachingSubjects
        dataToSend = {
          gender: formData.gender,
          firstName: formData.firstName,
          lastName: formData.lastName,
          birthName: formData.birthName,
          birthDate: formData.birthDate,
          socialSecurityNumber: formData.socialSecurityNumber,
          birthCountry: formData.birthCountry,
          nativeLanguage: formData.nativeLanguage,
          email: formData.email,
          phone: formData.phone,
          secondaryPhone: formData.secondaryPhone,
          primaryAddress: formData.primaryAddress,
          secondaryAddress: formData.secondaryAddress,
          transportModes: formData.transportModes || [],
          courseLocation: formData.courseLocation,
          employmentStatus: formData.employmentStatus,
          currentSituation: formData.currentSituation,
          iban: formData.iban,
          bic: formData.bic,
          siret: formData.siret,
          diplomes: formData.diplomes,
          certifications: formData.certifications,
          experiences: formData.experiences,
          divers: formData.divers,
        };
        console.log(`✍️  [${section.toUpperCase()}] Données à envoyer (objet préparé):`, dataToSend);
        console.log(`🔍 [${section.toUpperCase()}] primaryAddress détails:`, {
          street: formData.primaryAddress?.street,
          postalCode: formData.primaryAddress?.postalCode,
          city: formData.primaryAddress?.city,
          full: formData.primaryAddress
        });
      } else if (section === 'deplacements') {
        dataToSend = {
          availableDepartments: formData.availableDepartments,
          availableCities: formData.availableCities,
        };
        console.log(`✍️  [${section.toUpperCase()}] Données à envoyer:`, dataToSend);
      }

      console.log(`🌐 [${section.toUpperCase()}] Envoi de la requête à l'API...`);
      console.log(`🌐 [${section.toUpperCase()}] URL: /api/professors/${professorId}`);
      console.log(`🌐 [${section.toUpperCase()}] Payload final:`, JSON.stringify(dataToSend, null, 2));

      const response = await professorService.updateMyProfile(professorId, dataToSend);

      console.log(`✅ [${section.toUpperCase()}] Réponse du serveur reçue:`, {
        status: 'succès',
        timestamp: new Date().toLocaleTimeString('fr-FR'),
        professorId: (response as any)?._id,
        dataReturned: response
      });

      // Rafraîchissement silencieux après sauvegarde réussie
      console.log(`\n🔄 [${section.toUpperCase()}] DÉBUT du rafraîchissement silencieux...`);
      console.log(`📍 État formData AVANT loadProfile():`, formData);

      const updatedProfile = await loadProfile();

      console.log(`📍 État formData APRÈS loadProfile():`, formData);
      console.log(`📍 updatedProfile retourné:`, updatedProfile);
      console.log(`✅ [${section.toUpperCase()}] Le profil local (formData) a été mis à jour`);

      console.log(`\n✅ [${section.toUpperCase()}] FIN du rafraîchissement silencieux`);
      alert('Modifications enregistrées avec succès !');

      // Notifier la page parent pour qu'elle rafraîchisse les données (badges, etc)
      if (onSaveSuccess) {
        console.log(`📡 [${section.toUpperCase()}] Appel du callback onSaveSuccess()`);
        await onSaveSuccess();
        console.log(`✅ [${section.toUpperCase()}] Page parent rafraîchie`);
      }
    } catch (err) {
      console.error(`\n❌ [${section.toUpperCase()}] Erreur lors de la sauvegarde:`, err);
      alert('Erreur lors de la sauvegarde: ' + (err instanceof Error ? err.message : 'Erreur inconnue'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSubjects = async () => {
    if (!hasValidSelection()) return;

    try {
      setIsSaving(true);

      const timestamp = new Date().toLocaleTimeString('fr-FR');
      console.log(`\n📤 [CHOIX] Début de sauvegarde - ${timestamp}`);
      console.log(`✍️  [CHOIX] Matières sélectionnées (${teachingSubjects.length}):`,
        teachingSubjects.map(ts => ({
          name: ts.subjectName,
          grades: ts.grades,
          levels: ts.levels,
          isCustom: ts.isCustom
        }))
      );

      console.log(`🌐 [CHOIX] Envoi de la requête à l'API...`);

      const response = await professorService.updateMySubjects(professorId, teachingSubjects);

      console.log(`✅ [CHOIX] Réponse du serveur reçue:`, {
        status: 'succès',
        timestamp: new Date().toLocaleTimeString('fr-FR'),
        subjectsReturned: response.length,
        subjects: response
      });

      // Rafraîchissement silencieux après sauvegarde réussie
      console.log(`\n🔄 [CHOIX] DÉBUT du rafraîchissement silencieux...`);
      console.log(`📍 État teachingSubjects AVANT loadTeachingSubjectsFromProfile():`, teachingSubjects);

      await loadTeachingSubjectsFromProfile();

      console.log(`📍 État teachingSubjects APRÈS loadTeachingSubjectsFromProfile():`, teachingSubjects);
      console.log(`\n✅ [CHOIX] FIN du rafraîchissement silencieux`);

      alert('Vos choix ont été enregistrés avec succès !');
      setIsEditingSubjects(false);

      // Notifier la page parent pour qu'elle rafraîchisse les données (badges, etc)
      if (onSaveSuccess) {
        console.log(`📡 [CHOIX] Appel du callback onSaveSuccess()`);
        await onSaveSuccess();
        console.log(`✅ [CHOIX] Page parent rafraîchie`);
      }
    } catch (error) {
      console.error(`\n❌ [CHOIX] Erreur de sauvegarde:`, error);
      alert('Erreur lors de la sauvegarde. Veuillez réessayer.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: keyof ProfessorProfile, value: any) => {
    setFormData((prev: Partial<ProfessorProfile>) => ({ ...prev, [field]: value }));
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

  // Handlers pour les matières personnalisées
  const handleAddCustomSubject = () => {
    if (!customSubjectName.trim()) {
      alert('Veuillez entrer un nom de matière');
      return;
    }

    const tempId = `custom-${Date.now()}`;
    setTeachingSubjects((prev) => [
      ...prev,
      {
        subjectId: tempId,
        subjectName: customSubjectName.trim(),
        grades: [],
        levels: [],
        isCustom: true,
      },
    ]);
    setCustomSubjectName('');
    setIsAddingCustomSubject(false);
  };

  const handleDeleteCustomSubject = (subjectId: string) => {
    setTeachingSubjects((prev) =>
      prev.filter((ts) => ts.subjectId !== subjectId)
    );
  };

  // Fonction helper pour extraire le département du code postal
  const getDepartmentFromPostalCode = (postalCode: string): string | null => {
    if (!postalCode || postalCode.length < 2) return null;
    const deptCode = postalCode.substring(0, 2);
    // Vérifier si c'est un code département valide
    if (FRENCH_DEPARTMENTS.some((d) => d.code === deptCode)) {
      return deptCode;
    }
    return null;
  };

  // Fonction pour obtenir les départements protégés (auto-sélectionnés depuis adresses)
  const getProtectedDepartments = (): string[] => {
    const protectedDepts: string[] = [];

    // Département de l'adresse principale
    if (formData.primaryAddress?.postalCode) {
      const dept = getDepartmentFromPostalCode(formData.primaryAddress.postalCode);
      if (dept === '20') {
        // Cas Corse: postal codes 20xxx deviennent 2A et 2B
        protectedDepts.push('2A', '2B');
      } else if (dept) {
        protectedDepts.push(dept);
      }
    }

    // Département de l'adresse secondaire
    if (formData.secondaryAddress?.postalCode) {
      const dept = getDepartmentFromPostalCode(formData.secondaryAddress.postalCode);
      if (dept === '20') {
        // Cas Corse
        if (!protectedDepts.includes('2A')) protectedDepts.push('2A');
        if (!protectedDepts.includes('2B')) protectedDepts.push('2B');
      } else if (dept && !protectedDepts.includes(dept)) {
        protectedDepts.push(dept);
      }
    }

    return protectedDepts;
  };

  // Handler pour charger les communes d'un département
  const loadCommunesForDepartment = async (deptCode: string) => {
    if (communesByDept[deptCode]) return; // Déjà chargées

    try {
      const communes = await geoApiService.getCommunesByDepartment(deptCode);
      setCommunesByDept((prev) => ({ ...prev, [deptCode]: communes }));
    } catch (error) {
      console.error(`Erreur lors du chargement des communes du département ${deptCode}:`, error);
    }
  };

  // Handler pour ajouter/supprimer une commune
  const toggleCity = (cityCode: string) => {
    const current = formData.availableCities || [];
    const updated = current.includes(cityCode)
      ? current.filter((c) => c !== cityCode)
      : [...current, cityCode];
    handleInputChange('availableCities', updated);
  };

  // Handler pour ajouter/supprimer un mode de transport
  const toggleTransportMode = (modeValue: string) => {
    const current = formData.transportModes || [];
    const updated = current.includes(modeValue as any)
      ? current.filter((m) => m !== modeValue)
      : [...current, modeValue as any];
    handleInputChange('transportModes', updated);
  };

  // Handler pour supprimer un département (avec vérification de protection)
  const handleRemoveDepartment = (deptCode: string) => {
    const protectedDepts = getProtectedDepartments();

    // Vérifier si c'est un département protégé
    if (protectedDepts.includes(deptCode)) {
      alert('Vous ne pouvez pas supprimer un département correspondant à votre adresse');
      return;
    }

    // Supprimer le département
    const currentDepts = formData.availableDepartments || [];
    const updatedDepts = currentDepts.filter((d) => d !== deptCode);
    handleInputChange('availableDepartments', updatedDepts);

    // Supprimer aussi les communes associées à ce département
    const communes = communesByDept[deptCode] || [];
    const communeCodes = communes.map((c) => c.code);
    const currentCities = formData.availableCities || [];
    const updatedCities = currentCities.filter((c) => !communeCodes.includes(c));
    handleInputChange('availableCities', updatedCities);

    // Fermer le combobox des communes pour ce département
    setShowCommuneCombobox((prev) => ({
      ...prev,
      [deptCode]: false,
    }));
  };

  // Handler pour obtenir les communes d'un département spécifique
  const getCommunesForDepartment = (deptCode: string): Commune[] => {
    return communesByDept[deptCode] || [];
  };

  // Handlers pour les documents
  const handleFileUpload = async (file: File, category: string) => {
    try {
      setError(null);

      const timestamp = new Date().toLocaleTimeString('fr-FR');
      console.log(`\n📤 [DOCUMENTS] Début de l'upload - ${timestamp}`);
      console.log(`✍️  [DOCUMENTS] Détails du fichier:`, {
        name: file.name,
        size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
        type: file.type,
        category: category
      });

      console.log(`🌐 [DOCUMENTS] Envoi du fichier au serveur...`);
      await professorService.uploadDocument(professorId, file, category);

      console.log(`✅ [DOCUMENTS] Upload du fichier réussi`);
      console.log(`📋 [DOCUMENTS] Actualisation de la liste des documents...`);
      await loadDocuments();

      console.log(`✅ [DOCUMENTS] Liste des documents actualisée`);
      alert('Document uploadé avec succès !');
    } catch (err) {
      console.error(`\n❌ [DOCUMENTS] Erreur lors de l'upload:`, err);
      setError('Erreur lors de l\'upload du document');
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

    // Formater la date correctement pour input type="date" (format: yyyy-MM-dd)
    const getDisplayValue = () => {
      if (!fieldValue) return '';

      if (type === 'date' && fieldValue) {
        const date = new Date(String(fieldValue));
        if (!isNaN(date.getTime())) {
          // Format: YYYY-MM-DD
          return date.toISOString().split('T')[0];
        }
      }

      return String(fieldValue);
    };

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
            value={getDisplayValue()}
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
      </TabsList>

      {/* Tab 1: Informations (fusion Identité + Coordonnées) */}
      <TabsContent value="informations" className="mt-6">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Informations personnelles</h3>
           
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
                onCheckedChange={(checked: boolean | string) =>
                  handleInputChange('nativeLanguage', checked === true ? 'yes' : '')
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
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Code postal *</label>
              <input
                type="text"
                value={formData.primaryAddress?.postalCode || ''}
                onChange={(e) => handleInputChange('primaryAddress', { ...formData.primaryAddress, postalCode: e.target.value })}
                className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
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
            <div>
              <label className="text-xs text-gray-500 mb-2 block">Modes de déplacement</label>

              {/* Badges affichant les modes sélectionnés */}
              {(formData.transportModes || []).length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {(formData.transportModes || []).map((mode) => {
                    const modeLabel = TRANSPORT_MODES.find(m => m.value === mode)?.label || mode;
                    return (
                      <Badge
                        key={mode}
                        variant="secondary"
                        className="cursor-pointer hover:bg-gray-300"
                        onClick={() => toggleTransportMode(mode)}
                      >
                        {modeLabel} ✕
                      </Badge>
                    );
                  })}
                </div>
              )}

              {/* Bouton pour ouvrir le combobox */}
              {!showTransportModesCombobox && (
                <div>
                  <button
                    onClick={() => setShowTransportModesCombobox(true)}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Sélectionner les modes
                  </button>
                </div>
              )}

              {/* Combobox pour sélectionner les modes */}
              {showTransportModesCombobox && (
                <div className="space-y-2">
                  <TransportModesCombobox
                    onSelect={toggleTransportMode}
                    selectedValues={formData.transportModes || []}
                    placeholder="Sélectionner les modes de déplacement..."
                    open={showTransportModesCombobox}
                    onOpenChange={setShowTransportModesCombobox}
                  />
                  <button
                    onClick={() => setShowTransportModesCombobox(false)}
                    className="text-xs text-gray-600 hover:text-gray-700"
                  >
                    Fermer
                  </button>
                </div>
              )}
            </div>
            <div className="col-span-2">
              <label className="text-xs text-gray-500 mb-1 block">Cours</label>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="courseLocation-domicile"
                    checked={(formData.courseLocation || []).includes('domicile')}
                    onCheckedChange={(checked: boolean | string) => {
                      const current = formData.courseLocation || [];
                      const updated = checked === true
                        ? [...current, 'domicile']
                        : current.filter(loc => loc !== 'domicile');
                      handleInputChange('courseLocation', updated);
                    }}
                  />
                  <Label
                    htmlFor="courseLocation-domicile"
                    className="text-sm font-normal cursor-pointer"
                  >
                    À domicile
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="courseLocation-visio"
                    checked={(formData.courseLocation || []).includes('visio')}
                    onCheckedChange={(checked: boolean | string) => {
                      const current = formData.courseLocation || [];
                      const updated = checked === true
                        ? [...current, 'visio']
                        : current.filter(loc => loc !== 'visio');
                      handleInputChange('courseLocation', updated);
                    }}
                  />
                  <Label
                    htmlFor="courseLocation-visio"
                    className="text-sm font-normal cursor-pointer"
                  >
                    En visio
                  </Label>
                </div>
              </div>
            </div>
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-2">
                <label className="text-xs text-gray-500">Adresse secondaire</label>
                <Badge variant="outline" className="text-xs">
                  Optionnel
                </Badge>
              </div>
              <p className="text-xs text-gray-600 mb-2">
                Remplir uniquement si vous souhaitez donner des cours dans un autre département
              </p>
              <input
                type="text"
                value={formData.secondaryAddress?.street || ''}
                onChange={(e) => handleInputChange('secondaryAddress', { ...formData.secondaryAddress, street: e.target.value })}
                className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-gray-500 mb-1 block">Complément d'adresse</label>
              <input
                type="text"
                value={formData.secondaryAddress?.addressComplement || ''}
                onChange={(e) => handleInputChange('secondaryAddress', { ...formData.secondaryAddress, addressComplement: e.target.value })}
                className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Code postal</label>
              <input
                type="text"
                value={formData.secondaryAddress?.postalCode || ''}
                onChange={(e) => handleInputChange('secondaryAddress', { ...formData.secondaryAddress, postalCode: e.target.value })}
                className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Commune</label>
              <input
                type="text"
                value={formData.secondaryAddress?.city || ''}
                onChange={(e) => handleInputChange('secondaryAddress', { ...formData.secondaryAddress, city: e.target.value })}
                className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            <div className="col-span-2 my-4">
              <Separator />
            </div>

            {/* Section Statut d'emploi */}
            <div className="col-span-2">
              <h4 className="text-sm font-semibold text-gray-900 mb-4">Statut d'emploi</h4>

              <div className="space-y-4">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">
                    Statut professionnel *
                  </label>
                  <select
                    value={formData.employmentStatus || ''}
                    onChange={(e) =>
                      handleInputChange('employmentStatus', e.target.value)
                    }
                    className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  >
                    <option value="">Sélectionner...</option>
                    <option value="salarie">Salarié</option>
                    <option value="auto-entrepreneur">Auto-entrepreneur</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-gray-500 mb-1 block">
                    IBAN
                  </label>
                  <input
                    type="text"
                    value={formData.iban || ''}
                    onChange={(e) => handleInputChange('iban', e.target.value.toUpperCase())}
                    pattern="[A-Z]{2}[0-9]{2}[A-Z0-9]{1,30}"
                    title="Format IBAN invalide (ex: FR7612345678901234567890123)"
                    maxLength={34}
                    className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              
                  />
                
                </div>

                <div>
                  <label className="text-xs text-gray-500 mb-1 block">
                    BIC / SWIFT
                  </label>
                  <input
                    type="text"
                    value={formData.bic || ''}
                    onChange={(e) => handleInputChange('bic', e.target.value.toUpperCase())}
                    pattern="[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?"
                    title="Format BIC/SWIFT invalide (8 ou 11 caractères, ex: BNPAFRPP)"
                    minLength={8}
                    maxLength={11}
                    className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                 
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
            </div>

            <div className="col-span-2 my-4">
              <Separator />
            </div>

            {/* Section Situation actuelle */}
            <div className="col-span-2">
              <h4 className="text-sm font-semibold text-gray-900 mb-4">Situation actuelle</h4>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">
                  Votre situation professionnelle actuelle
                </label>
                <select
                  value={formData.currentSituation || ''}
                  onChange={(e) => handleInputChange('currentSituation', e.target.value)}
                  className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="">Non renseigné</option>
                  <option value="enseignant_education_nationale">
                    Enseignant en Éducation Nationale
                  </option>
                  <option value="enseignant_vacataire_contractuel">
                    Enseignant Vacataire/Contractuel
                  </option>
                  <option value="etudiant_master_professorat">
                    Étudiant Master Professorat
                  </option>
                  <option value="enseignant_avec_activite_domicile">
                    Enseignant avec Activité à Domicile
                  </option>
                  <option value="enseignant_activite_professionnelle">
                    Enseignant avec Autre Activité
                  </option>
                  <option value="enseignant_formation_professionnelle">
                    En Formation Professionnelle
                  </option>
                  <option value="etudiant">Étudiant</option>
                </select>
              </div>
            </div>

            <div className="col-span-2 my-4">
              <Separator />
            </div>

            {/* Section CV - Diplômes et Certifications */}
            <div className="col-span-2">
              <h4 className="text-sm font-semibold text-gray-900 mb-4">Diplômes</h4>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">
                  Listez vos diplômes
                </label>
                <textarea
                  value={formData.diplomes || ''}
                  onChange={(e) => handleInputChange('diplomes', e.target.value)}
                  placeholder="Ex: Master en Mathématiques - Université Paris-Saclay (2020)&#10;Licence de Mathématiques - Sorbonne Université (2018)"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                  rows={4}
                  maxLength={2000}
                />
                <p className="text-xs text-gray-400 mt-1">
                  Maximum 2000 caractères
                </p>
              </div>
            </div>

            <div className="col-span-2">
              <h4 className="text-sm font-semibold text-gray-900 mb-4">Certifications</h4>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">
                  Listez vos certifications
                </label>
                <textarea
                  value={formData.certifications || ''}
                  onChange={(e) => handleInputChange('certifications', e.target.value)}
                  placeholder="Ex: Certification FLE - Alliance Française (2021)&#10;TOEFL 110/120 (2019)"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                  rows={4}
                  maxLength={2000}
                />
                <p className="text-xs text-gray-400 mt-1">
                  Maximum 2000 caractères
                </p>
              </div>
            </div>

            {/* Section CV - Expériences professionnelles */}
            <div className="col-span-2">
              <h4 className="text-sm font-semibold text-gray-900 mb-4">Expériences professionnelles</h4>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">
                  Listez vos expériences professionnelles
                </label>
                <textarea
                  value={formData.experiences || ''}
                  onChange={(e) => handleInputChange('experiences', e.target.value)}
                  placeholder="Ex: Professeur de mathématiques - Lycée Jean Moulin (2018-2022)&#10;Formateur en entreprise - ABC Formation (2015-2018)"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                  rows={4}
                  maxLength={2000}
                />
                <p className="text-xs text-gray-400 mt-1">
                  Maximum 2000 caractères
                </p>
              </div>
            </div>

            {/* Section Divers */}
            <div className="col-span-2">
              <h4 className="text-sm font-semibold text-gray-900 mb-4">Divers</h4>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">
                  Informations complémentaires
                </label>
                <textarea
                  value={formData.divers || ''}
                  onChange={(e) => handleInputChange('divers', e.target.value)}
                  placeholder="Ex: Disponible pour des cours particuliers le soir et le week-end..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                  rows={4}
                  maxLength={1000}
                />
                <p className="text-xs text-gray-400 mt-1">
                  Maximum 1000 caractères
                </p>
              </div>
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
              {isEditingSubjects ? 'Sélectionner les matières enseignées et les niveaux correspondants' : 'Matières enseignées et niveaux associés'}
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* VUE LECTURE - Affichage des matières sauvegardées */}
            {!isEditingSubjects && teachingSubjects.length > 0 && (
              <>
                <div className="space-y-4">
                  {/* Matières standard */}
                  {teachingSubjects.filter(ts => !ts.isCustom).map(subject => (
                    <div key={subject.subjectId} className="border rounded-lg p-4 bg-white hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900">{subject.subjectName}</h4>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {subject.grades.map(grade => (
                              <Badge key={grade} variant="secondary" className="text-xs">
                                {grade}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Matières personnalisées */}
                  {teachingSubjects.filter(ts => ts.isCustom).length > 0 && (
                    <>
                      <Separator className="my-4" />
                      <h4 className="text-sm font-semibold text-gray-900">Matières personnalisées</h4>
                      {teachingSubjects.filter(ts => ts.isCustom).map(subject => (
                        <div key={subject.subjectId} className="border border-orange-200 rounded-lg p-4 bg-orange-50">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="text-sm font-semibold text-gray-900">{subject.subjectName}</h4>
                                <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300 text-xs">
                                  Personnalisée
                                </Badge>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {subject.grades.map(grade => (
                                  <Badge key={grade} variant="secondary" className="text-xs">
                                    {grade}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>

                <Separator />
                <div className="flex gap-2 justify-end">
                  <Button
                    onClick={() => setIsEditingSubjects(true)}
                    variant="outline"
                  >
                    Modifier
                  </Button>
                </div>
              </>
            )}

            {/* VUE LECTURE - Aucune matière */}
            {!isEditingSubjects && teachingSubjects.length === 0 && (
              <>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Aucune matière sélectionnée. Cliquez sur "Ajouter des matières" pour commencer.
                  </AlertDescription>
                </Alert>
                <div className="flex gap-2 justify-end">
                  <Button onClick={() => setIsEditingSubjects(true)}>
                    Ajouter des matières
                  </Button>
                </div>
              </>
            )}

            {/* VUE ÉDITION - Formulaire de sélection */}
            {isEditingSubjects && (
              <>
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

            {/* Section Matières personnalisées */}
            {teachingSubjects.filter((ts) => ts.isCustom).length > 0 && (
              <>
                <Separator className="my-6" />
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">Matières personnalisées</h3>
                  <div className="space-y-3 mb-4">
                    {teachingSubjects
                      .filter((ts) => ts.isCustom)
                      .map((subject) => {
                        const selectedGrades = subject.grades || [];
                        return (
                          <div
                            key={subject.subjectId}
                            className="border border-orange-200 rounded-lg p-4 bg-orange-50"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <span className="text-base font-medium text-gray-900">
                                  {subject.subjectName}
                                </span>
                                <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300">
                                  Matière personnalisée
                                </Badge>
                                {selectedGrades.length > 0 && (
                                  <Badge variant="secondary">{selectedGrades.length} niveau(x)</Badge>
                                )}
                              </div>
                              <button
                                onClick={() => handleDeleteCustomSubject(subject.subjectId)}
                                className="text-red-600 hover:text-red-700 text-sm font-medium"
                              >
                                Supprimer
                              </button>
                            </div>
                            {/* Sélecteur de niveaux pour matière personnalisée */}
                            <SubjectLevelsSelector
                              selectedGrades={selectedGrades}
                              onChange={(grades) =>
                                handleGradesChange(subject.subjectId, grades)
                              }
                            />
                          </div>
                        );
                      })}
                  </div>
                </div>
              </>
            )}

            {/* Bouton pour ajouter une matière personnalisée */}
            {!isAddingCustomSubject ? (
              <div className="flex justify-center pt-4 pb-4">
                <Button
                  variant="outline"
                  onClick={() => setIsAddingCustomSubject(true)}
                  className="border-orange-300 text-orange-600 hover:bg-orange-50"
                >
                  Autre
                </Button>
              </div>
            ) : (
              <div className="border border-orange-300 rounded-lg p-4 bg-orange-50">
                <label className="text-sm font-medium text-gray-900 mb-2 block">
                  Ajouter une matière personnalisée
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ex: Latin, Grec ancien, Poterie..."
                    value={customSubjectName}
                    onChange={(e) => setCustomSubjectName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddCustomSubject();
                      if (e.key === 'Escape') {
                        setIsAddingCustomSubject(false);
                        setCustomSubjectName('');
                      }
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-sm"
                    autoFocus
                  />
                  <button
                    onClick={handleAddCustomSubject}
                    className="px-4 py-2 bg-orange-600 text-white text-sm rounded-md hover:bg-orange-700"
                  >
                    Ajouter
                  </button>
                  <button
                    onClick={() => {
                      setIsAddingCustomSubject(false);
                      setCustomSubjectName('');
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            )}

            <Separator />

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setIsEditingSubjects(false)}
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
            </>
            )}
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

          <div className="space-y-6">
            {/* Départements auto-sélectionnés depuis les adresses */}
            {getProtectedDepartments().length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Départements liés à vos adresses</h4>
                <div className="space-y-3">
                    {getProtectedDepartments().map((deptCode) => {
                      const dept = FRENCH_DEPARTMENTS.find((d) => d.code === deptCode);
                      const communes = getCommunesForDepartment(deptCode);
                      const selectedCityCodes = (formData.availableCities || []).filter((cityCode) =>
                        communes.some((c) => c.code === cityCode)
                      );

                      return (
                        <div key={deptCode} className="border border-gray-200 rounded-lg p-4">
                          {/* En-tête du département (sans bouton de suppression) */}
                          <h5 className="text-sm font-medium text-gray-900 mb-3">
                            {deptCode} - {dept?.name || 'Département inconnu'}
                          </h5>

                          {/* Communes sélectionnées en badges */}
                          {selectedCityCodes.length > 0 && (
                            <div className="mb-3 flex flex-wrap gap-2">
                              {communes
                                .filter((c) => selectedCityCodes.includes(c.code))
                                .map((commune) => (
                                  <Badge
                                    key={commune.code}
                                    variant="secondary"
                                    className="cursor-pointer hover:bg-gray-300"
                                    onClick={() => toggleCity(commune.code)}
                                  >
                                    {commune.nom} ✕
                                  </Badge>
                                ))}
                            </div>
                          )}

                          {/* Bouton pour sélectionner des communes */}
                          {!showCommuneCombobox[deptCode] && (
                            <div className="mt-3">
                              <button
                                onClick={async () => {
                                  await loadCommunesForDepartment(deptCode);
                                  setShowCommuneCombobox((prev) => ({
                                    ...prev,
                                    [deptCode]: true,
                                  }));
                                }}
                                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                              >
                                Sélectionner les communes
                              </button>
                            </div>
                          )}

                          {/* Combobox pour sélectionner des communes */}
                          {showCommuneCombobox[deptCode] && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <CommuneCombobox
                                departmentCode={deptCode}
                                onSelect={toggleCity}
                                selectedCodes={formData.availableCities || []}
                                placeholder="Sélectionner des communes..."
                                open={showCommuneCombobox[deptCode]}
                                onOpenChange={(open) => {
                                  setShowCommuneCombobox((prev) => ({
                                    ...prev,
                                    [deptCode]: open,
                                  }));
                                }}
                              />
                              <button
                                onClick={() => {
                                  setShowCommuneCombobox((prev) => ({
                                    ...prev,
                                    [deptCode]: false,
                                  }));
                                }}
                                className="mt-2 text-xs text-gray-600 hover:text-gray-700"
                              >
                                Fermer
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Section pour ajouter d'autres départements */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Ajouter d'autres départements</h4>
              <div className="space-y-3">
                {/* Afficher les départements ajoutés manuellement */}
                {(formData.availableDepartments || [])
                  .filter((code) => !getProtectedDepartments().includes(code))
                  .map((deptCode) => {
                    const dept = FRENCH_DEPARTMENTS.find((d) => d.code === deptCode);
                    const communes = getCommunesForDepartment(deptCode);
                    const selectedCityCodes = (formData.availableCities || []).filter((cityCode) =>
                      communes.some((c) => c.code === cityCode)
                    );

                    return (
                      <div key={deptCode} className="border border-gray-200 rounded-lg p-4">
                        {/* En-tête du département avec bouton de suppression */}
                        <div className="flex items-center justify-between mb-4">
                          <h5 className="text-sm font-medium text-gray-900">
                            {deptCode} - {dept?.name || 'Département inconnu'}
                          </h5>
                          <button
                            onClick={() => handleRemoveDepartment(deptCode)}
                            className="text-red-600 hover:text-red-700 text-sm font-medium"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Communes sélectionnées en badges */}
                        {selectedCityCodes.length > 0 && (
                          <div className="mb-3 flex flex-wrap gap-2">
                            {communes
                              .filter((c) => selectedCityCodes.includes(c.code))
                              .map((commune) => (
                                <Badge
                                  key={commune.code}
                                  variant="secondary"
                                  className="cursor-pointer hover:bg-gray-300"
                                  onClick={() => toggleCity(commune.code)}
                                >
                                  {commune.nom} ✕
                                </Badge>
                              ))}
                          </div>
                        )}

                        {/* Bouton pour sélectionner des communes */}
                        {!showCommuneCombobox[deptCode] && (
                          <div className="mt-3">
                            <button
                              onClick={async () => {
                                await loadCommunesForDepartment(deptCode);
                                setShowCommuneCombobox((prev) => ({
                                  ...prev,
                                  [deptCode]: true,
                                }));
                              }}
                              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                            >
                              Sélectionner les communes
                            </button>
                          </div>
                        )}

                        {/* Combobox pour sélectionner des communes */}
                        {showCommuneCombobox[deptCode] && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <CommuneCombobox
                              departmentCode={deptCode}
                              onSelect={toggleCity}
                              selectedCodes={formData.availableCities || []}
                              placeholder="Sélectionner des communes..."
                              open={showCommuneCombobox[deptCode]}
                              onOpenChange={(open) => {
                                setShowCommuneCombobox((prev) => ({
                                  ...prev,
                                  [deptCode]: open,
                                }));
                              }}
                            />
                            <button
                              onClick={() => {
                                setShowCommuneCombobox((prev) => ({
                                  ...prev,
                                  [deptCode]: false,
                                }));
                              }}
                              className="mt-2 text-xs text-gray-600 hover:text-gray-700"
                            >
                              Fermer
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}

                {/* Bouton pour ouvrir le combobox de sélection de départements */}
                {!showDepartmentCombobox && (
                  <div className="flex justify-center pt-2">
                    <button
                      onClick={() => setShowDepartmentCombobox(true)}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      + Ajouter un département
                    </button>
                  </div>
                )}

                {/* Combobox pour sélectionner des départements */}
                {showDepartmentCombobox && (
                  <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                    <p className="text-sm font-medium text-gray-900 mb-3">
                      Sélectionner un ou plusieurs départements
                    </p>
                    <DepartmentCombobox
                      onSelect={(deptCode) => {
                        const current = formData.availableDepartments || [];
                        if (!current.includes(deptCode)) {
                          handleInputChange('availableDepartments', [...current, deptCode]);
                        }
                      }}
                      selectedCodes={formData.availableDepartments || []}
                      placeholder="Rechercher un département..."
                      open={showDepartmentCombobox}
                      onOpenChange={setShowDepartmentCombobox}
                    />
                    <button
                      onClick={() => setShowDepartmentCombobox(false)}
                      className="mt-3 text-xs text-gray-600 hover:text-gray-700"
                    >
                      Fermer
                    </button>
                  </div>
                )}
              </div>
            </div>
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

    </Tabs>
  );
};
