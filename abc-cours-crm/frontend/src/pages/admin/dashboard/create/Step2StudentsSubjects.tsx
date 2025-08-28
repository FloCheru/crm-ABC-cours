import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Input, FormCard } from "../../../../components";
import { useNDRWizard } from "../../../../contexts/NDRWizardContext";
import { familyService } from "../../../../services/familyService";
import { subjectService } from "../../../../services/subjectService";
import type { Subject } from "../../../../types/subject";
import "./Step2StudentsSubjects.css";

interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  level?: string;
  dateOfBirth?: string;
  // École
  schoolName?: string;
  schoolAddress?: string;
  // Contact personnel
  email?: string;
  phone?: string;
  // Notes
  notes?: string;
  courseLocation?: {
    type?: "domicile" | "professeur" | "autre";
    address?: {
      street?: string;
      city?: string;
      postalCode?: string;
    };
    otherDetails?: string;
  };
  availability?: string;
}

export const Step2StudentsSubjects: React.FC = () => {
  const { state, updateStep2, validateStep2, nextStep, previousStep, errors } =
    useNDRWizard();
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSubjectSelection, setShowSubjectSelection] = useState(false);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  // Retiré car non utilisé dans la nouvelle implémentation
  // const [tempStudents, setTempStudents] = useState<Student[]>([]);

  // Charger les élèves de la famille et les matières disponibles
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);

        // Charger les élèves de la famille sélectionnée
        if (state.step1.familyId) {
          const family = await familyService.getFamily(state.step1.familyId);
          if (
            family.students &&
            Array.isArray(family.students) &&
            family.students.length > 0
          ) {
            setStudents(family.students as Student[]);
          } else {
            setStudents([]);
            // Ouvrir automatiquement la modal si on vient depuis les prospects
            if (state.returnContext === "prospects") {
              setShowAddStudentModal(true);
            }
          }
        }

        // Charger toutes les matières disponibles
        const subjectsData = await subjectService.getSubjects();
        setSubjects(subjectsData);

        // Initialiser les matières sélectionnées si elles existent déjà
        if (state.step2.selectedSubjectIds.length > 0) {
          setSelectedSubjectIds(state.step2.selectedSubjectIds);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [state.step1.familyId, state.step2.selectedSubjectIds]);

  // Gestion sélection famille
  const handleFamilySelection = (checked: boolean) => {
    updateStep2({
      familySelected: checked,
      // Réinitialiser les détails famille si désélectionnée
      ...(checked ? {} : { familyDetails: undefined }),
    });
  };

  const handleStudentSelection = (studentId: string, checked: boolean) => {
    const newStudentIds = checked
      ? [...state.step2.studentIds, studentId]
      : state.step2.studentIds.filter((id) => id !== studentId);

    updateStep2({ studentIds: newStudentIds });
  };

  const handleStudentDetailChange = (
    studentId: string,
    field: string,
    value: any
  ) => {
    const updatedStudents = students.map((student) => {
      if (student._id === studentId) {
        const fieldParts = field.split(".");
        const updatedStudent = { ...student };

        if (fieldParts.length === 1) {
          // Champ simple
          (updatedStudent as any)[fieldParts[0]] = value;
        } else if (fieldParts.length === 2) {
          // Champ imbriqué niveau 1
          (updatedStudent as any)[fieldParts[0]] = {
            ...(updatedStudent as any)[fieldParts[0]],
            [fieldParts[1]]: value,
          };
        } else if (fieldParts.length === 3) {
          // Champ imbriqué niveau 2
          (updatedStudent as any)[fieldParts[0]] = {
            ...(updatedStudent as any)[fieldParts[0]],
            [fieldParts[1]]: {
              ...(updatedStudent as any)[fieldParts[0]]?.[fieldParts[1]],
              [fieldParts[2]]: value,
            },
          };
        }

        return updatedStudent;
      }
      return student;
    });

    setStudents(updatedStudents);

    // Mettre à jour dans le state du wizard
    const studentsDetails = updatedStudents
      .filter((s) => state.step2.studentIds.includes(s._id))
      .map((s) => ({
        studentId: s._id,
        firstName: s.firstName,
        lastName: s.lastName,
        courseLocation: {
          type: s.courseLocation?.type || ("domicile" as const),
          address: s.courseLocation?.address
            ? {
                street: s.courseLocation.address.street || "",
                city: s.courseLocation.address.city || "",
                postalCode: s.courseLocation.address.postalCode || "",
                phone: "", // Champ requis par Step2Data mais non présent dans Student
              }
            : undefined,
          otherDetails: s.courseLocation?.otherDetails,
        },
        availability: s.availability || "",
      }));

    updateStep2({ studentsDetails });
  };

  const openSubjectSelection = () => {
    setSelectedSubjectIds([...state.step2.selectedSubjectIds]);
    setShowSubjectSelection(true);
  };

  const handleSubjectSelection = (subjectId: string, checked: boolean) => {
    setSelectedSubjectIds((prev) =>
      checked ? [...prev, subjectId] : prev.filter((id) => id !== subjectId)
    );
  };

  const confirmSubjectSelection = () => {
    updateStep2({ selectedSubjectIds });
    setShowSubjectSelection(false);
  };

  const handleAddStudent = () => {
    navigate(`/families/${state.step1.familyId}/add-student?returnTo=wizard`);
  };


  const removeTempStudent = (tempId: string) => {
    // Retirer de la liste des élèves
    setStudents((prev) => prev.filter((s) => s._id !== tempId));
    // setTempStudents(prev => prev.filter(s => s._id !== tempId)); // Non utilisé

    // Retirer de la sélection
    const newStudentIds = state.step2.studentIds.filter((id) => id !== tempId);
    updateStep2({ studentIds: newStudentIds });
  };

  // Gestion détails famille
  const handleFamilyDetailChange = (field: string, value: any) => {
    const fieldParts = field.split(".");
    let updatedFamilyDetails = state.step2.familyDetails || {
      courseLocation: { type: "domicile" as const },
      availability: "",
    };

    // Initialiser familyDetails s'il n'existe pas
    if (!updatedFamilyDetails.courseLocation) {
      updatedFamilyDetails.courseLocation = { type: "domicile" as const };
    }

    if (fieldParts.length === 1) {
      // Champ simple
      (updatedFamilyDetails as any)[fieldParts[0]] = value;
    } else if (fieldParts.length === 2) {
      // Champ imbriqué niveau 1
      (updatedFamilyDetails as any)[fieldParts[0]] = {
        ...(updatedFamilyDetails as any)[fieldParts[0]],
        [fieldParts[1]]: value,
      };
    } else if (fieldParts.length === 3) {
      // Champ imbriqué niveau 2
      (updatedFamilyDetails as any)[fieldParts[0]] = {
        ...(updatedFamilyDetails as any)[fieldParts[0]],
        [fieldParts[1]]: {
          ...(updatedFamilyDetails as any)[fieldParts[0]]?.[fieldParts[1]],
          [fieldParts[2]]: value,
        },
      };
    }

    updateStep2({ familyDetails: updatedFamilyDetails });
  };

  const isTemporaryStudent = (studentId: string): boolean => {
    return studentId.startsWith("temp-");
  };

  const handleNext = () => {
    if (validateStep2()) {
      nextStep();
    }
  };

  const handleBack = () => {
    previousStep();
  };

  if (isLoading) {
    return (
      <div className="step2__loading">
        <div className="step2__loading-text">Chargement des données...</div>
      </div>
    );
  }

  const handleFillPageExample = () => {
    // Vérifier si des données existent déjà
    const hasSelectedBeneficiaries =
      state.step2.familySelected || state.step2.studentIds.length > 0;
    const hasSelectedSubjects = state.step2.selectedSubjectIds.length > 0;

    if (hasSelectedBeneficiaries || hasSelectedSubjects) {
      const confirmOverwrite = window.confirm(
        "Des sélections existent déjà. Voulez-vous les remplacer par l'exemple ?"
      );
      if (!confirmOverwrite) {
        return;
      }
    }

    // Pré-sélectionner la famille
    updateStep2({
      familySelected: true,
      familyDetails: {
        courseLocation: {
          type: "domicile" as const,
          address: {
            street: "123 Rue de l'Exemple",
            city: "Paris",
            postalCode: "75001",
          },
        },
        availability: "Lundi à vendredi 16h-19h, Samedi matin 9h-12h",
      },
    });

    // Pré-sélectionner des matières (si disponibles)
    if (subjects.length > 0) {
      const exampleSubjectIds = subjects.slice(0, 2).map((s) => s._id); // Prendre les 2 premières matières
      updateStep2({ selectedSubjectIds: exampleSubjectIds });
    }
  };

  return (
    <div className="step2-students-subjects">
      {/* En-tête avec bouton exemple */}
      <div className="step2__page-header">
        <h2 className="step2__page-title">
          Étape 2 : Bénéficiaires et Matières
        </h2>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleFillPageExample}
          className="step2__example-button"
          title="Préremplir l'étape avec des données d'exemple"
        >
          📝 Exemple
        </Button>
      </div>

      {/* Sélection des bénéficiaires */}
      <FormCard
        title="Sélection des bénéficiaires"
        className="step2__student-selection"
      >
        {errors.step2?.students && (
          <div className="step2__error">{errors.step2.students}</div>
        )}

        <div className="step2__add-student-section">
          <Button
            type="button"
            variant="outline"
            onClick={handleAddStudent}
            className="step2__add-student-button"
          >
            + Ajouter un nouveau bénéficiaire
          </Button>
        </div>

        <div className="step2__beneficiaries-grid">
          {/* Carte Famille - toujours affichée en premier */}
          <div
            className={`step2__beneficiary-card step2__family-card ${
              state.step2.familySelected
                ? "step2__beneficiary-card--selected"
                : ""
            }`}
          >
            <div className="step2__beneficiary-header">
              <input
                type="checkbox"
                id="family-beneficiary"
                checked={state.step2.familySelected}
                onChange={(e) => handleFamilySelection(e.target.checked)}
                className="step2__beneficiary-checkbox"
              />
              <label
                htmlFor="family-beneficiary"
                className="step2__beneficiary-name"
              >
                {state.step1.primaryContact.firstName}{" "}
                {state.step1.primaryContact.lastName}
              </label>
              <span className="step2__beneficiary-badge step2__beneficiary-badge--family">
                Famille
              </span>
            </div>
            <div className="step2__beneficiary-details">
              <div className="step2__beneficiary-contact">
                {state.step1.primaryContact.email && (
                  <div className="step2__contact-info">
                    📧 {state.step1.primaryContact.email}
                  </div>
                )}
                {state.step1.primaryContact.phone && (
                  <div className="step2__contact-info">
                    📞 {state.step1.primaryContact.phone}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Élèves existants */}
          {students.length === 0 ? (
            <div className="step2__no-students">
              <p>Aucun élève trouvé pour cette famille.</p>
              <p className="step2__help-text">
                Cliquez sur "Ajouter un nouveau bénéficiaire" ci-dessus pour
                créer un élève.
              </p>
            </div>
          ) : (
            students.map((student) => (
              <div
                key={student._id}
                className={`step2__beneficiary-card step2__student-card ${
                  state.step2.studentIds.includes(student._id)
                    ? "step2__beneficiary-card--selected"
                    : ""
                } ${
                  isTemporaryStudent(student._id)
                    ? "step2__student-card--temp"
                    : ""
                }`}
              >
                {/* Croix de suppression - Positionnée en absolu sur la carte */}
                {isTemporaryStudent(student._id) && (
                  <button
                    type="button"
                    onClick={() => removeTempStudent(student._id)}
                    className="step2__student-remove"
                    title="Supprimer cet élève"
                  >
                    ×
                  </button>
                )}

                <div className="step2__beneficiary-header">
                  <input
                    type="checkbox"
                    id={`student-${student._id}`}
                    checked={state.step2.studentIds.includes(student._id)}
                    onChange={(e) =>
                      handleStudentSelection(student._id, e.target.checked)
                    }
                    className="step2__beneficiary-checkbox"
                  />
                  <label
                    htmlFor={`student-${student._id}`}
                    className="step2__beneficiary-name"
                  >
                    {student.firstName} {student.lastName}
                  </label>
                  {isTemporaryStudent(student._id) && (
                    <span className="step2__beneficiary-badge step2__beneficiary-badge--new">
                      Nouveau
                    </span>
                  )}
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

      {/* Détails de la famille sélectionnée */}
      {state.step2.familySelected && (
        <div className="step2__selected-family">
          <h3 className="step2__section-title">
            Informations complémentaires de la famille
          </h3>

          <FormCard
            title={`${state.step1.primaryContact.firstName} ${state.step1.primaryContact.lastName} (Famille)`}
            className="step2__family-details"
          >
            <div className="step2__form-grid">
              {/* Lieu des cours */}
              <div className="step2__form-field">
                <label
                  htmlFor="family-courseLocation"
                  className="step2__form-label"
                >
                  Lieu des cours *
                </label>
                <select
                  id="family-courseLocation"
                  value={state.step2.familyDetails?.courseLocation?.type || ""}
                  onChange={(e) =>
                    handleFamilyDetailChange(
                      "courseLocation.type",
                      e.target.value
                    )
                  }
                  className="step2__form-select"
                >
                  <option value="">Sélectionner un lieu</option>
                  <option value="domicile">À domicile</option>
                  <option value="professeur">Chez le professeur</option>
                  <option value="autre">Autre</option>
                </select>
              </div>

              {/* Adresse des cours */}
              <div className="step2__form-field step2__form-field--full">
                <label htmlFor="family-street" className="step2__form-label">
                  Adresse des cours *
                </label>
                <Input
                  id="family-street"
                  value={
                    state.step2.familyDetails?.courseLocation?.address
                      ?.street || ""
                  }
                  onChange={(e) =>
                    handleFamilyDetailChange(
                      "courseLocation.address.street",
                      e.target.value
                    )
                  }
                  placeholder="Rue"
                  required
                />
              </div>

              <div className="step2__form-field">
                <label htmlFor="family-city" className="step2__form-label">
                  Ville *
                </label>
                <Input
                  id="family-city"
                  value={
                    state.step2.familyDetails?.courseLocation?.address?.city ||
                    ""
                  }
                  onChange={(e) =>
                    handleFamilyDetailChange(
                      "courseLocation.address.city",
                      e.target.value
                    )
                  }
                  placeholder="Ville"
                  required
                />
              </div>

              <div className="step2__form-field">
                <label htmlFor="family-postal" className="step2__form-label">
                  Code postal *
                </label>
                <Input
                  id="family-postal"
                  value={
                    state.step2.familyDetails?.courseLocation?.address
                      ?.postalCode || ""
                  }
                  onChange={(e) =>
                    handleFamilyDetailChange(
                      "courseLocation.address.postalCode",
                      e.target.value
                    )
                  }
                  placeholder="Code postal"
                  required
                />
              </div>

              {/* Précisions pour "autre" */}
              {state.step2.familyDetails?.courseLocation?.type === "autre" && (
                <div className="step2__form-field step2__form-field--full">
                  <label htmlFor="family-other" className="step2__form-label">
                    Précisions lieu (autre)
                  </label>
                  <textarea
                    id="family-other"
                    value={
                      state.step2.familyDetails?.courseLocation?.otherDetails ||
                      ""
                    }
                    onChange={(e) =>
                      handleFamilyDetailChange(
                        "courseLocation.otherDetails",
                        e.target.value
                      )
                    }
                    placeholder="Précisions sur le lieu de cours"
                    className="step2__form-textarea"
                    rows={3}
                  />
                </div>
              )}

              {/* Disponibilités */}
              <div className="step2__form-field step2__form-field--full">
                <label
                  htmlFor="family-availability"
                  className="step2__form-label"
                >
                  Disponibilités
                </label>
                <textarea
                  id="family-availability"
                  value={state.step2.familyDetails?.availability || ""}
                  onChange={(e) =>
                    handleFamilyDetailChange("availability", e.target.value)
                  }
                  placeholder="Horaires de disponibilité de la famille"
                  className="step2__form-textarea"
                  rows={3}
                />
              </div>
            </div>

            {/* Messages d'erreur spécifiques famille */}
            {errors.step2?.studentLocation && (
              <div className="step2__field-error">
                {errors.step2.studentLocation}
              </div>
            )}
            {errors.step2?.studentAddress && (
              <div className="step2__field-error">
                {errors.step2.studentAddress}
              </div>
            )}
          </FormCard>
        </div>
      )}

      {/* Détails des élèves sélectionnés */}
      {state.step2.studentIds.length > 0 && (
        <div className="step2__selected-students">
          <h3 className="step2__section-title">
            Informations complémentaires des élèves
          </h3>

          {state.step2.studentIds.map((studentId) => {
            const student = students.find((s) => s._id === studentId);
            if (!student) return null;

            return (
              <FormCard
                key={studentId}
                title={`${student.firstName} ${student.lastName}`}
                className="step2__student-details"
              >
                <div className="step2__form-grid">
                  {/* Lieu des cours */}
                  <div className="step2__form-field">
                    <label
                      htmlFor={`courseLocation-${studentId}`}
                      className="step2__form-label"
                    >
                      Lieu des cours *
                    </label>
                    <select
                      id={`courseLocation-${studentId}`}
                      value={student.courseLocation?.type || ""}
                      onChange={(e) =>
                        handleStudentDetailChange(
                          studentId,
                          "courseLocation.type",
                          e.target.value
                        )
                      }
                      className="step2__form-select"
                    >
                      <option value="">Sélectionner un lieu</option>
                      <option value="domicile">À domicile</option>
                      <option value="professeur">Chez le professeur</option>
                      <option value="autre">Autre</option>
                    </select>
                  </div>

                  {/* Adresse des cours */}
                  <div className="step2__form-field step2__form-field--full">
                    <label
                      htmlFor={`street-${studentId}`}
                      className="step2__form-label"
                    >
                      Adresse des cours *
                    </label>
                    <Input
                      id={`street-${studentId}`}
                      value={student.courseLocation?.address?.street || ""}
                      onChange={(e) =>
                        handleStudentDetailChange(
                          studentId,
                          "courseLocation.address.street",
                          e.target.value
                        )
                      }
                      placeholder="Rue"
                      required
                    />
                  </div>

                  <div className="step2__form-field">
                    <label
                      htmlFor={`city-${studentId}`}
                      className="step2__form-label"
                    >
                      Ville *
                    </label>
                    <Input
                      id={`city-${studentId}`}
                      value={student.courseLocation?.address?.city || ""}
                      onChange={(e) =>
                        handleStudentDetailChange(
                          studentId,
                          "courseLocation.address.city",
                          e.target.value
                        )
                      }
                      placeholder="Ville"
                      required
                    />
                  </div>

                  <div className="step2__form-field">
                    <label
                      htmlFor={`postal-${studentId}`}
                      className="step2__form-label"
                    >
                      Code postal *
                    </label>
                    <Input
                      id={`postal-${studentId}`}
                      value={student.courseLocation?.address?.postalCode || ""}
                      onChange={(e) =>
                        handleStudentDetailChange(
                          studentId,
                          "courseLocation.address.postalCode",
                          e.target.value
                        )
                      }
                      placeholder="Code postal"
                      required
                    />
                  </div>

                  {/* Précisions pour "autre" */}
                  {student.courseLocation?.type === "autre" && (
                    <div className="step2__form-field step2__form-field--full">
                      <label
                        htmlFor={`other-${studentId}`}
                        className="step2__form-label"
                      >
                        Précisions lieu (autre)
                      </label>
                      <textarea
                        id={`other-${studentId}`}
                        value={student.courseLocation?.otherDetails || ""}
                        onChange={(e) =>
                          handleStudentDetailChange(
                            studentId,
                            "courseLocation.otherDetails",
                            e.target.value
                          )
                        }
                        placeholder="Précisions sur le lieu de cours"
                        className="step2__form-textarea"
                        rows={3}
                      />
                    </div>
                  )}

                  {/* Disponibilités */}
                  <div className="step2__form-field step2__form-field--full">
                    <label
                      htmlFor={`availability-${studentId}`}
                      className="step2__form-label"
                    >
                      Disponibilités
                    </label>
                    <textarea
                      id={`availability-${studentId}`}
                      value={student.availability || ""}
                      onChange={(e) =>
                        handleStudentDetailChange(
                          studentId,
                          "availability",
                          e.target.value
                        )
                      }
                      placeholder="Horaires de disponibilité de l'élève"
                      className="step2__form-textarea"
                      rows={3}
                    />
                  </div>
                </div>

                {/* Messages d'erreur spécifiques */}
                {errors.step2?.studentLocation && (
                  <div className="step2__field-error">
                    {errors.step2.studentLocation}
                  </div>
                )}
                {errors.step2?.studentAddress && (
                  <div className="step2__field-error">
                    {errors.step2.studentAddress}
                  </div>
                )}
              </FormCard>
            );
          })}
        </div>
      )}

      {/* Sélection des matières */}
      <FormCard
        title="Sélection des matières"
        className="step2__subjects-selection"
      >
        {errors.step2?.subjects && (
          <div className="step2__error">{errors.step2.subjects}</div>
        )}

        <div className="step2__subjects-header">
          <Button
            type="button"
            variant="secondary"
            onClick={openSubjectSelection}
            disabled={subjects.length === 0}
            className="step2__subjects-button"
          >
            {state.step2.selectedSubjectIds.length > 0
              ? `Modifier la sélection (${state.step2.selectedSubjectIds.length} matière(s))`
              : "Sélectionner des matières"}
          </Button>
        </div>

        {subjects.length === 0 && (
          <div className="step2__no-subjects">
            <p>Aucune matière disponible. Veuillez en créer une d'abord.</p>
          </div>
        )}

        {state.step2.selectedSubjectIds.length === 0 && subjects.length > 0 && (
          <div className="step2__no-selection">
            <p>Aucune matière sélectionnée</p>
            <p className="step2__help-text">
              Cliquez sur le bouton ci-dessus pour sélectionner des matières.
            </p>
          </div>
        )}

        {state.step2.selectedSubjectIds.length > 0 && (
          <div className="step2__selected-subjects">
            <h4 className="step2__subsection-title">
              {state.step2.selectedSubjectIds.length} matière(s)
              sélectionnée(s):
            </h4>
            <div className="step2__subjects-tags">
              {state.step2.selectedSubjectIds.map((subjectId) => {
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
              <h3 className="step2__modal-title">Sélectionner les matières</h3>
            </div>

            <div className="step2__modal-content">
              <div className="step2__subjects-list">
                {subjects.map((subject) => (
                  <label key={subject._id} className="step2__subject-option">
                    <input
                      type="checkbox"
                      checked={selectedSubjectIds.includes(subject._id)}
                      onChange={(e) =>
                        handleSubjectSelection(subject._id, e.target.checked)
                      }
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
                  Confirmer la sélection
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="ndr-wizard__navigation">
        <Button type="button" variant="outline" onClick={handleBack}>
          ← Retour : Client
        </Button>
        <Button
          type="button"
          variant="primary"
          onClick={handleNext}
          disabled={
            (!state.step2.familySelected &&
              state.step2.studentIds.length === 0) ||
            state.step2.selectedSubjectIds.length === 0
          }
        >
          Suivant : Tarifs →
        </Button>
      </div>
    </div>
  );
};
