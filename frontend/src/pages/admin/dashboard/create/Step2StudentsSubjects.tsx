import React, { useState, useEffect } from "react";
import { Button, FormCard, Modal } from "../../../../components";
import { familyService } from "../../../../services/familyService";
import { subjectService } from "../../../../services/subjectService";
import type { Subject } from "../../../../types/subject";
import { useStudentModal, createTestStudent } from "../../../../utils/studentUtils";
import "./Step2StudentsSubjects.css";

interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  level?: string;
}

interface Props {
  ndrData: any;
  updateNdrData: (updates: any) => void;
  familyData: any;
  nextStep: () => void;
  previousStep: () => void;
  returnContext: string;
}

export const Step2StudentsSubjects: React.FC<Props> = ({
  ndrData,
  updateNdrData,
  familyData,
  nextStep,
  previousStep,
  returnContext
}) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSubjectSelection, setShowSubjectSelection] = useState(false);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [familySelected, setFamilySelected] = useState(false);

  // Hook pour l'ajout d'étudiant (même logique que Prospects)
  const { showAddStudentModal, selectedFamilyForStudent, handleAddStudent, handleStudentSuccess } = useStudentModal();

  // Charger les données au montage
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);

        console.log("🔍 Step2 - familyData:", familyData);

        // Utiliser directement familyData.students
        let familyStudents: Student[] = [];
        if (familyData && familyData.students && Array.isArray(familyData.students)) {
          familyStudents = familyData.students as Student[];
          setStudents(familyStudents);
          console.log("🔍 Step2 - familyStudents:", familyStudents);
        } else {
          console.log("🔍 Step2 - Pas de students dans familyData");
        }

        // Charger toutes les matières
        const subjectsData = await subjectService.getSubjects();
        setSubjects(subjectsData);

        // Restaurer les sélections précédentes
        if (ndrData.subjects) {
          setSelectedSubjectIds(ndrData.subjects);
        }
        if (ndrData.studentIds) {
          // Filtrer les valeurs null et vérifier que les IDs correspondent à des étudiants existants
          const validStudentIds = ndrData.studentIds
            .filter((id: string | null) => id !== null && id !== undefined)
            .filter((id: string) => familyStudents.some((student: Student) => student._id === id));

          console.log("🔍 studentIds avant filtrage:", ndrData.studentIds);
          console.log("🔍 studentIds après filtrage:", validStudentIds);

          setSelectedStudentIds(validStudentIds);
          // Mettre à jour ndrData avec les IDs valides
          if (validStudentIds.length !== ndrData.studentIds.length) {
            updateNdrData({ studentIds: validStudentIds });
          }
        }
        if (ndrData.adult) {
          setFamilySelected(ndrData.adult);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [familyData]);

  // Handlers simplifiés
  const handleFamilySelection = (checked: boolean) => {
    setFamilySelected(checked);
    updateNdrData({ adult: checked });
  };

  const handleStudentSelection = (studentId: string, checked: boolean) => {
    const newStudentIds = checked
      ? [...selectedStudentIds, studentId]
      : selectedStudentIds.filter(id => id !== studentId);

    setSelectedStudentIds(newStudentIds);
    updateNdrData({ studentIds: newStudentIds });
  };

  // Gestion des matières
  const handleSubjectSelection = (subjectId: string, checked: boolean) => {
    const newSubjectIds = checked
      ? [...selectedSubjectIds, subjectId]
      : selectedSubjectIds.filter(id => id !== subjectId);

    setSelectedSubjectIds(newSubjectIds);
  };

  const confirmSubjectSelection = () => {
    updateNdrData({ subjects: selectedSubjectIds });
    setShowSubjectSelection(false);
  };

  // Gestion ajout d'étudiant (même logique que Prospects)
  const handleAddStudentClick = () => {
    if (ndrData.familyId) {
      handleAddStudent(ndrData.familyId);
    }
  };

  const handleAddStudentTest = async (familyId: string) => {
    const refreshData = async () => {
      if (familyId) {
        const family = await familyService.getFamily(familyId);
        if (family.students && Array.isArray(family.students)) {
          setStudents(family.students as Student[]);
        }
      }
    };

    await createTestStudent(familyId, handleStudentSuccess, handleAddStudent, refreshData);
  };

  const handleStudentSuccessWithReload = async () => {
    // Recharger les élèves après ajout
    if (ndrData.familyId) {
      try {
        const family = await familyService.getFamily(ndrData.familyId);
        if (family.students && Array.isArray(family.students)) {
          setStudents(family.students as Student[]);
        }
      } catch (error) {
        console.error("Erreur lors du rechargement des élèves:", error);
      }
    }
    handleStudentSuccess();
  };

  // Navigation
  const handleNext = () => {
    const hasSelection = familySelected || selectedStudentIds.length > 0;
    const hasSubjects = selectedSubjectIds.length > 0;

    if (!hasSelection) {
      alert('Veuillez sélectionner au moins un bénéficiaire');
      return;
    }
    if (!hasSubjects) {
      alert('Veuillez sélectionner au moins une matière');
      return;
    }
    nextStep();
  };

  if (isLoading) {
    return (
      <div className="step2__loading">
        <div className="step2__loading-text">Chargement des données...</div>
      </div>
    );
  }

  return (
    <div className="step2-students-subjects">
      {/* Sélection des bénéficiaires */}
      <FormCard title="Sélection des bénéficiaires" className="step2__student-selection">
        <div className="step2__add-student-section">
          <Button
            type="button"
            variant="outline"
            onClick={handleAddStudentClick}
            className="step2__add-student-button"
          >
            + Ajouter un nouveau bénéficiaire
          </Button>
        </div>

        <div className="step2__beneficiaries-grid">
          {/* Carte Famille */}
          <div className={`step2__beneficiary-card step2__family-card ${familySelected ? 'step2__beneficiary-card--selected' : ''}`}>
            <div className="step2__beneficiary-header">
              <input
                type="checkbox"
                id="family-beneficiary"
                checked={familySelected}
                onChange={(e) => handleFamilySelection(e.target.checked)}
                className="step2__beneficiary-checkbox"
              />
              <label htmlFor="family-beneficiary" className="step2__beneficiary-name">
                Famille (Adulte)
              </label>
              <span className="step2__beneficiary-badge step2__beneficiary-badge--family">
                Famille
              </span>
            </div>
          </div>

          {/* Élèves */}
          {students.length === 0 ? (
            <div className="step2__no-students">
              <p>Aucun élève trouvé pour cette famille.</p>
            </div>
          ) : (
            students.map((student) => (
              <div
                key={student._id}
                className={`step2__beneficiary-card step2__student-card ${
                  selectedStudentIds.includes(student._id) ? 'step2__beneficiary-card--selected' : ''
                }`}
              >
                <div className="step2__beneficiary-header">
                  <input
                    type="checkbox"
                    id={`student-${student._id}`}
                    checked={selectedStudentIds.includes(student._id)}
                    onChange={(e) => handleStudentSelection(student._id, e.target.checked)}
                    className="step2__beneficiary-checkbox"
                  />
                  <label htmlFor={`student-${student._id}`} className="step2__beneficiary-name">
                    {student.firstName} {student.lastName}
                  </label>
                </div>
                {student.level && (
                  <div className="step2__student-level">
                    Niveau: {student.level}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </FormCard>

      {/* Sélection des matières */}
      <FormCard title="Sélection des matières" className="step2__subjects-selection">
        <div className="step2__subjects-header">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setShowSubjectSelection(true)}
            disabled={subjects.length === 0}
            className="step2__subjects-button"
          >
            {selectedSubjectIds.length > 0
              ? `Modifier la sélection (${selectedSubjectIds.length} matière(s))`
              : "Sélectionner des matières"}
          </Button>
        </div>

        {selectedSubjectIds.length === 0 && subjects.length > 0 && (
          <div className="step2__no-selection">
            <p>Aucune matière sélectionnée</p>
          </div>
        )}

        {selectedSubjectIds.length > 0 && (
          <div className="step2__selected-subjects">
            <h4>{selectedSubjectIds.length} matière(s) sélectionnée(s):</h4>
            <div className="step2__subjects-tags">
              {selectedSubjectIds.map((subjectId) => {
                const subject = subjects.find((s) => s._id === subjectId);
                return (
                  <span key={subjectId} className="step2__subject-tag">
                    {subject ? subject.name : "Matière inconnue"}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </FormCard>

      {/* Modal de sélection des matières */}
      {showSubjectSelection && (
        <div className="step2__modal-overlay">
          <div className="step2__modal">
            <div className="step2__modal-header">
              <h3>Sélectionner les matières</h3>
            </div>

            <div className="step2__modal-content">
              <div className="step2__subjects-list">
                {subjects.map((subject) => (
                  <label key={subject._id} className="step2__subject-option">
                    <input
                      type="checkbox"
                      checked={selectedSubjectIds.includes(subject._id)}
                      onChange={(e) => handleSubjectSelection(subject._id, e.target.checked)}
                      className="step2__subject-checkbox"
                    />
                    <span className="step2__subject-name">{subject.name}</span>
                    {subject.description && (
                      <span className="step2__subject-description">
                        {subject.description}
                      </span>
                    )}
                  </label>
                ))}
              </div>
            </div>

            <div className="step2__modal-footer">
              <div className="step2__modal-counter">
                {selectedSubjectIds.length} matière(s) sélectionnée(s)
              </div>
              <div className="step2__modal-actions">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowSubjectSelection(false)}
                >
                  Annuler
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  onClick={confirmSubjectSelection}
                  disabled={selectedSubjectIds.length === 0}
                >
                  Confirmer
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="ndr-wizard__navigation">
        <Button type="button" variant="outline" onClick={previousStep}>
          ← Retour
        </Button>
        <Button
          type="button"
          variant="primary"
          onClick={handleNext}
          disabled={(!familySelected && selectedStudentIds.length === 0) || selectedSubjectIds.length === 0}
        >
          Suivant : Tarifs →
        </Button>
      </div>

      {/* Modal d'ajout d'élève */}
      <Modal
        type="student"
        isOpen={showAddStudentModal}
        onClose={handleStudentSuccess}
        data={{ familyId: selectedFamilyForStudent }}
        onSuccess={handleStudentSuccessWithReload}
        onAddStudentTest={handleAddStudentTest}
      />
    </div>
  );
};