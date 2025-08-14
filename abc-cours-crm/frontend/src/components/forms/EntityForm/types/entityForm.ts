// types/entityForm.ts

export type EntityType = "family" | "student" | "professor" | "subject";

// Types pour les données de formulaire
export interface FamilyFormData {
  [key: string]: unknown;
  name: string;
  "primaryContact.firstName": string;
  "primaryContact.lastName": string;
  "primaryContact.email": string;
  "primaryContact.primaryPhone": string;
  "primaryContact.secondaryPhone"?: string;
  "address.street": string;
  "address.city": string;
  "address.postalCode": string;
  "secondaryContact.firstName"?: string;
  "secondaryContact.lastName"?: string;
  "secondaryContact.email"?: string;
  "secondaryContact.phone"?: string;
  "secondaryContact.relationship"?: string;
  "financialInfo.paymentMethod": "card" | "check" | "transfer" | "cash";
  notes?: string;
}

export interface StudentFormData {
  [key: string]: unknown;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  "school.name": string;
  "school.level": "primaire" | "collège" | "lycée" | "supérieur";
  "school.grade": string;
  "contact.email"?: string;
  "contact.phone"?: string;
  notes?: string;
  familyId?: string;
}

export interface ProfessorFormData {
  [key: string]: unknown;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: "employee" | "freelance";
  hourlyRate: string;
  notes?: string;
}

export interface SubjectFormData {
  [key: string]: unknown;
  name: string;
  description?: string;
  level: "débutant" | "intermédiaire" | "avancé";
}

// Union type pour tous les types de formulaires
export type EntityFormData =
  | FamilyFormData
  | StudentFormData
  | ProfessorFormData
  | SubjectFormData;

// Configuration des champs
export interface FieldConfig {
  key: string;
  label: string;
  type: "text" | "email" | "tel" | "date" | "select" | "textarea" | "checkbox";
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  validation?: (value: string | number | boolean) => string | undefined;
  group?: string;
}

export interface EntityConfig {
  title: string;
  fields: FieldConfig[];
  submitButtonText: string;
}
