export interface Family {
  _id: string;
  address: {
    street: string;
    city: string;
    postalCode: string;
  };
  primaryContact: {
    firstName: string;
    lastName: string;
    primaryPhone: string;
    secondaryPhone?: string;
    email: string;
  };
  secondaryContact?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    email?: string;
    relationship?: string;
  };
  settlementNotes: string[]; // ObjectId refs
  status: 'prospect' | 'client';
  notes?: string;
  createdBy: string; // ObjectId ref
  students:
    | string[]
    | Array<{
        _id: string;
        firstName: string;
        lastName: string;
        level: string;
      }>; // IDs des élèves ou objets populés
  createdAt: Date;
  updatedAt: Date;
}

export interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  level: string;
  school: {
    name: string;
    address: string;
  };
  contact: {
    email: string;
    phone: string;
  };
  subjects: {
    [key: string]: {
      level: string;
      notes?: string;
    };
  };
  family: {
    _id: string;
    name: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateFamilyData {
  address: {
    street: string;
    city: string;
    postalCode: string;
  };
  primaryContact: {
    firstName: string;
    lastName: string;
    primaryPhone: string;
    secondaryPhone?: string;
    email: string;
  };
  secondaryContact?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    email?: string;
    relationship?: string;
  };
  status?: 'prospect' | 'client';
  notes?: string;
}

export interface CreateStudentData {
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  level: string;
  school: {
    name: string;
    address: string;
  };
  contact: {
    email: string;
    phone: string;
  };
  subjects: {
    [key: string]: {
      level: string;
      notes?: string;
    };
  };
  familyId: string;
}
