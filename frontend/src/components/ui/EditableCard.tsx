import React, { useState, createContext, useContext } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EditableCardContextType {
  isEditing: boolean;
  formData: Record<string, any>;
  updateField: (name: string, value: any) => void;
}

const EditableCardContext = createContext<EditableCardContextType | null>(null);

const useEditableCard = () => {
  const context = useContext(EditableCardContext);
  if (!context) {
    throw new Error("EditableField must be used within EditableCard");
  }
  return context;
};

interface EditableCardProps {
  title: string;
  children: React.ReactNode;
  onSave?: (data: Record<string, any>) => Promise<void>;
}

export const EditableCard: React.FC<EditableCardProps> = ({
  title,
  children,
  onSave,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isSaving, setIsSaving] = useState(false);

  const updateField = (name: string, value: any) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEdit = () => {
    setIsEditing(true);
    setFormData({});
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({});
  };

  const handleSave = async () => {
    if (!onSave) return;

    setIsSaving(true);
    try {
      await onSave(formData);
      setIsEditing(false);
      setFormData({});
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <EditableCardContext.Provider value={{ isEditing, formData, updateField }}>
      <Card className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
        <CardHeader className="px-6 pt-6 pb-0 border-b-2 border-blue-500 mb-6">
          <div className="flex justify-between items-center pb-4">
            <CardTitle className="text-xl font-semibold text-gray-800">{title}</CardTitle>
            {onSave && (
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancel}
                      disabled={isSaving}
                    >
                      Annuler
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={isSaving}
                    >
                      {isSaving ? "Sauvegarde..." : "Sauvegarder"}
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleEdit}
                    title="Modifier"
                  >
                    ✏️
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-6">
            {children}
          </div>
        </CardContent>
      </Card>
    </EditableCardContext.Provider>
  );
};

interface EditableFieldProps {
  label: string;
  name?: string;
  value: any;
  displayValue?: string;
  type?: "text" | "number" | "email" | "tel" | "date" | "textarea" | "select";
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  readOnly?: boolean;
  customRender?: () => React.ReactNode;
}

export const EditableField: React.FC<EditableFieldProps> = ({
  label,
  name,
  value,
  displayValue,
  type = "text",
  placeholder,
  options,
  readOnly = false,
  customRender,
}) => {
  const { isEditing, formData, updateField } = useEditableCard();

  const currentValue = name && isEditing ? (formData[name] ?? value) : value;
  const displayText = displayValue || currentValue || "Non renseigné";

  // Custom render (toujours en lecture seule)
  if (customRender) {
    return (
      <div className="flex flex-col gap-2">
        <Label className="text-sm font-medium text-gray-700">{label}</Label>
        {customRender()}
      </div>
    );
  }

  // Mode lecture ou champ readOnly
  if (!isEditing || readOnly) {
    return (
      <div className="flex flex-col gap-2">
        <Label className="text-sm font-medium text-gray-700">{label}</Label>
        <p className="text-sm text-gray-900 py-3 border-b border-gray-200 min-h-[1.5em]">{displayText}</p>
      </div>
    );
  }

  // Mode édition
  if (!name) {
    return (
      <div className="flex flex-col gap-2">
        <Label className="text-sm font-medium text-gray-700">{label}</Label>
        <p className="text-sm text-gray-900">{displayText}</p>
      </div>
    );
  }

  // Textarea
  if (type === "textarea") {
    return (
      <div className="flex flex-col gap-2 col-span-full">
        <Label htmlFor={name} className="text-sm font-medium text-gray-700">{label}</Label>
        <Textarea
          id={name}
          value={currentValue || ""}
          onChange={(e) => updateField(name, e.target.value)}
          placeholder={placeholder}
          rows={4}
          className="min-h-[100px]"
        />
      </div>
    );
  }

  // Select
  if (type === "select" && options) {
    return (
      <div className="flex flex-col gap-2">
        <Label htmlFor={name} className="text-sm font-medium text-gray-700">{label}</Label>
        <Select
          value={currentValue || ""}
          onValueChange={(val: string) => updateField(name, val)}
        >
          <SelectTrigger id={name}>
            <SelectValue placeholder={placeholder || "Sélectionner..."} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  // Input standard
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={name} className="text-sm font-medium text-gray-700">{label}</Label>
      <Input
        id={name}
        type={type}
        value={currentValue || ""}
        onChange={(e) => updateField(name, e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
};
