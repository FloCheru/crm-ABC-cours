import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Save, X } from 'lucide-react';
import { SubjectLevelsSelector } from '@/components/professor/SubjectLevelsSelector';
import { subjectService } from '@/services/subjectService';
import { professorService } from '@/services/professorService';
import type { Subject } from '@/types/subject';
import type { TeachingSubject } from '@/types/teacher';
import type { SchoolCategory } from '@/constants/schoolLevels';

export default function MesChoix() {
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [teachingSubjects, setTeachingSubjects] = useState<TeachingSubject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
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
      console.error('❌ Erreur de chargement:', error);
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
    } finally {
      setIsLoading(false);
    }
  };

  const isSubjectSelected = (subjectId: string): boolean => {
    return teachingSubjects.some(ts => ts.subjectId === subjectId);
  };

  const getGradesForSubject = (subjectId: string): string[] => {
    return teachingSubjects.find(ts => ts.subjectId === subjectId)?.grades || [];
  };

  const handleToggleSubject = (subject: Subject) => {
    if (isSubjectSelected(subject._id)) {
      // Retirer la matière
      setTeachingSubjects(prev => prev.filter(ts => ts.subjectId !== subject._id));
    } else {
      // Ajouter la matière avec niveaux vides
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

  /**
   * Dérive les catégories (primaire, collège, lycée, supérieur) à partir des classes sélectionnées
   */
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

  /**
   * Vérifie que toutes les matières sélectionnées ont au moins un niveau
   */
  const hasValidSelection = (): boolean => {
    return teachingSubjects.length > 0 && teachingSubjects.every(ts => ts.grades.length > 0);
  };

  const handleSave = async () => {
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

  const selectedCount = teachingSubjects.filter(ts => ts.grades.length > 0).length;
  const invalidCount = teachingSubjects.filter(ts => ts.grades.length === 0).length;

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 max-w-4xl py-8">
        <p className="text-center text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 max-w-4xl py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Mes matières enseignées</CardTitle>
          <p className="text-sm text-muted-foreground">
            Sélectionnez les matières que vous enseignez et les niveaux correspondants
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Alert si aucune matière ou matières invalides */}
          {teachingSubjects.length === 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Sélectionnez au moins une matière avec ses niveaux
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
                  <div className="flex items-center space-x-3">
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
              onClick={loadData}
              disabled={isSaving}
            >
              <X className="w-4 h-4 mr-2" />
              Annuler
            </Button>
            <Button
              onClick={handleSave}
              disabled={!hasValidSelection() || isSaving}
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Enregistrement...' : 'Enregistrer mes choix'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
