// Types pour EntityForm - Centralisés ici pour éviter la duplication

export interface FamilyFormData {
  primaryContact: {
    firstName: string;
    lastName: string;
    primaryPhone: string;
    email: string;
    secondaryPhone?: string;
  };
  address: {
    street: string;
    city: string;
    postalCode: string;
  };
  secondaryContact?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    email?: string;
    relationship?: string;
  };
  notes?: string;
}

export interface StudentFormData {
  firstName: string;
  lastName: string;
  birthDate: string;
  school: {
    name: string;
    level: string;
    grade: string;
  };
  contact?: {
    email?: string;
    phone?: string;
  };
  notes?: string;
}
