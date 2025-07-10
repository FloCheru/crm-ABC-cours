export interface Family {
  _id: string;
  name: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  students: string[]; // IDs des élèves
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
  name: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
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
