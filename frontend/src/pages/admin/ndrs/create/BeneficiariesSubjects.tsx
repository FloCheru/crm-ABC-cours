import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { Navbar, PageHeader, Container, Button } from "../../../../components";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../../../components/ui/card";
import { Badge } from "../../../../components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../../../../components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../../../components/ui/popover";
import { cn } from "../../../../lib/utils";
import { subjectService } from "../../../../services/subjectService";
import type { Family } from "../../../../types/family";
import type { Subject } from "../../../../types/subject";

export const BeneficiariesSubjects: React.FC = () => {
  const navigate = useNavigate();
  const [family, setfamily] = useState<Family | null>(null);
  const [selectedBeneficiaries, setSelectedBeneficiaries] = useState<string[]>(
    []
  );
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [ndrData, setNdrData] = useState({
    familyId: "",
    beneficiaries: {
      students: [] as Array<{ id: string }>,
      adult: false,
    },
    subjects: [] as Array<{id: string}>,
    professor: null,
  });

  //Pour set l'id family dans ndr data
  useEffect(() => {
    const familyData = localStorage.getItem("selectedFamily");
    const from = localStorage.getItem("from");

    if (familyData) {
      const family = JSON.parse(familyData);
      console.log("selectedFamily dans BeneficiariesSubjects:", family);
      console.log("from dans BeneficiariesSubjects", from);
      setfamily(family);
      setNdrData((prev) => ({ ...prev, familyId: family._id }));
    } else {
      navigate("/family-selection");
    }
  }, [navigate]);

  //récupérer les matières au chargement
  useEffect(() => {
    const loadSubjects = async () => {
      try {
        const subjectsData = await subjectService.getSubjects();
        setSubjects(subjectsData);
      } catch (error) {
        console.error("Erreur lors du chargement des matières:", error);
      }
    };
    loadSubjects();
  }, []);

  const toggleBeneficiary = (id: string, type: "adult" | "student") => {
    if (type === "adult") {
      const isSelected = selectedBeneficiaries.includes("adult");
      if (isSelected) {
        setSelectedBeneficiaries((prev) => prev.filter((b) => b !== "adult"));
        setNdrData((prev) => ({
          ...prev,
          beneficiaries: { ...prev.beneficiaries, adult: false },
        }));
      } else {
        setSelectedBeneficiaries((prev) => [...prev, "adult"]);
        setNdrData((prev) => ({
          ...prev,
          beneficiaries: { ...prev.beneficiaries, adult: true },
        }));
      }
    } else {
      const isSelected = selectedBeneficiaries.includes(id);
      if (isSelected) {
        setSelectedBeneficiaries((prev) => prev.filter((b) => b !== id));
        setNdrData((prev) => ({
          ...prev,
          beneficiaries: {
            ...prev.beneficiaries,
            students: prev.beneficiaries.students.filter((s) => s.id !== id),
          },
        }));
      } else {
        setSelectedBeneficiaries((prev) => [...prev, id]);
        setNdrData((prev) => ({
          ...prev,
          beneficiaries: {
            ...prev.beneficiaries,
            students: [...prev.beneficiaries.students, { id }],
          },
        }));
      }
    }
  };

  const toggleSubject = (subjectId: string) => {
    const isSelected = selectedSubjects.includes(subjectId);
    if (isSelected) {
      setSelectedSubjects((prev) => prev.filter((s) => s !== subjectId));
      setNdrData((prev) => ({
        ...prev,
        subjects: prev.subjects.filter((s) => s.id !== subjectId),
      }));
    } else {
      setSelectedSubjects((prev) => [...prev, subjectId]);
      setNdrData((prev) => ({
        ...prev,
        subjects: [...prev.subjects, {id: subjectId}],
      }));
    }
  };

  const removeSubject = (subjectId: string) => {
    setSelectedSubjects((prev) => prev.filter((s) => s !== subjectId));
    setNdrData((prev) => ({
      ...prev,
      subjects: prev.subjects.filter((s) => s.id !== subjectId),
    }));
  };

  const handleNext = () => {
    if (selectedBeneficiaries.length > 0 && selectedSubjects.length > 0) {
      localStorage.setItem("ndrData", JSON.stringify(ndrData));
      navigate("/pricing-payment");
    }
  };

  const handleBack = () => {
    const from = localStorage.getItem("from") || "ndr";
    if (from === "prospects") {
      navigate("/prospects");
    } else {
      navigate("/family-selection");
    }
  };

  if (!family) {
    return (
      <div>
        <Navbar activePath="/beneficiaries-subjects" />
        <PageHeader title="Bénéficiaires et matières" />
        <Container layout="flex-col">
          <div className="text-center py-8">
            <p>Chargement...</p>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div>
      <Navbar activePath="/beneficiaries-subjects" />
      <PageHeader title="Bénéficiaires et matières" />
      <Container layout="flex-col">
        <div className="mb-6">
          <h2>Étape 2 : Sélection des bénéficiaires et matières</h2>
          <p>
            Sélectionnez les bénéficiaires et les matières pour la note de
            règlement de la famille {family.primaryContact.firstName}{" "}
            {family.primaryContact.lastName}.
          </p>
        </div>

        {/* Section Bénéficiaires */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Bénéficiaires</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            {/* Primary Contact */}
            <Card
              className={`cursor-pointer hover:bg-accent transition-colors ${
                selectedBeneficiaries.includes("adult")
                  ? "ring-2 ring-primary"
                  : ""
              }`}
              onClick={() => toggleBeneficiary("adult", "adult")}
            >
              <CardHeader>
                <CardTitle>
                  {family.primaryContact.firstName}{" "}
                  {family.primaryContact.lastName}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge>Adulte</Badge>
              </CardContent>
            </Card>

            {/* Students */}
            {family.students?.map((student, index) => (
              <Card
                key={student.id}
                className={`cursor-pointer hover:bg-accent transition-colors ${
                  selectedBeneficiaries.includes(student.id)
                    ? "ring-2 ring-primary"
                    : ""
                }`}
                onClick={() => toggleBeneficiary(student.id, "student")}
              >
                <CardHeader>
                  <CardTitle>
                    {student.firstName} {student.lastName}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant="secondary">Étudiant</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Section Matières */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Matières</h3>

          {/* Combobox pour sélectionner les matières */}
          <div className="mb-4">
            <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={comboboxOpen}
                  className="w-full justify-between"
                >
                  Sélectionner des matières...
                  <ChevronsUpDown className="opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput
                    placeholder="Rechercher une matière..."
                    className="h-9"
                  />
                  <CommandList>
                    <CommandEmpty>Aucune matière trouvée.</CommandEmpty>
                    <CommandGroup>
                      {subjects.map((subject) => (
                        <CommandItem
                          key={subject._id}
                          value={subject.name}
                          onSelect={() => {
                            toggleSubject(subject._id);
                            setComboboxOpen(false);
                          }}
                        >
                          {subject.name}
                          <Check
                            className={cn(
                              "ml-auto",
                              selectedSubjects.includes(subject._id)
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Liste des matières sélectionnées */}
          {selectedSubjects.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Matières sélectionnées :</p>
              <div className="flex flex-wrap gap-2">
                {selectedSubjects.map((subjectId) => {
                  const subject = subjects.find((s) => s._id === subjectId);
                  return (
                    <Badge
                      key={subjectId}
                      variant="secondary"
                      className="flex items-center gap-1 cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => removeSubject(subjectId)}
                    >
                      {subject?.name}
                      <X className="w-3 h-3" />
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-4 justify-between">
          <Button variant="outline" onClick={handleBack}>
            Retour
          </Button>
          <Button
            variant="primary"
            onClick={handleNext}
            disabled={
              selectedBeneficiaries.length === 0 ||
              selectedSubjects.length === 0
            }
          >
            Suivant
          </Button>
        </div>
      </Container>
    </div>
  );
};
