export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  familyId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Family {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  createdAt?: string;
  updatedAt?: string;
  students?: Student[];
}
