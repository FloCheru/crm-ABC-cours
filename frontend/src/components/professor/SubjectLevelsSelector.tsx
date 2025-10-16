import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { SCHOOL_GRADES, CATEGORY_LABELS, type SchoolCategory } from "@/constants/schoolLevels";

interface SubjectLevelsSelectorProps {
  selectedGrades: string[];
  onChange: (grades: string[]) => void;
}

/**
 * Composant de sélection de niveaux scolaires par catégorie
 * Utilisé pour choisir les classes enseignées pour une matière donnée
 */
export const SubjectLevelsSelector = ({ selectedGrades, onChange }: SubjectLevelsSelectorProps) => {
  const handleGradeToggle = (grade: string) => {
    const newGrades = selectedGrades.includes(grade)
      ? selectedGrades.filter(g => g !== grade)
      : [...selectedGrades, grade];
    onChange(newGrades);
  };

  return (
    <div className="ml-8 mt-2 space-y-2">
      {/* Badges des niveaux sélectionnés */}
      {selectedGrades.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {selectedGrades.map(grade => (
            <Badge key={grade} variant="secondary">
              {grade}
            </Badge>
          ))}
        </div>
      )}

      {/* Accordion par catégorie */}
      <Accordion type="multiple" className="w-full">
        {(Object.keys(SCHOOL_GRADES) as SchoolCategory[]).map(category => (
          <AccordionItem key={category} value={category}>
            <AccordionTrigger>
              {CATEGORY_LABELS[category]}
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-2 gap-3 p-4">
                {SCHOOL_GRADES[category].map(grade => (
                  <div key={grade.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`${category}-${grade.value}`}
                      checked={selectedGrades.includes(grade.value)}
                      onCheckedChange={() => handleGradeToggle(grade.value)}
                    />
                    <Label
                      htmlFor={`${category}-${grade.value}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {grade.label}
                    </Label>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};
