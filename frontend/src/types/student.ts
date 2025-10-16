export interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  grade?: string; // Niveau (5ème, Terminale, etc.)
  dateOfBirth?: string;
}

export interface StudentWithStats {
  _id: string;
  firstName: string;
  lastName: string;
  grade?: string;

  // Stats enrichies depuis les coupons
  totalSessions: number;
  lastSessionDate?: string;
  subjects: string[]; // Liste des matières enseignées à cet élève
  isActive: boolean; // Cours dans les 30 derniers jours

  // Infos famille (contact principal)
  family: {
    _id: string;
    primaryContact: {
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
    };
    address?: {
      street: string;
      city: string;
      postalCode: string;
      country?: string;
    };
  };

  // Historique des séances avec ce professeur
  sessions: StudentSession[];
}

export interface StudentSession {
  couponId: string;
  date: string; // sessionData.sessionDate
  subject: string; // subjectName
  location: "home" | "professor" | "online";
  duration: number; // sessionData.sessionDuration
  notes?: string; // sessionData.notes (saisi lors du coupon)
  professorComment?: string; // Commentaire pédagogique ajouté après
}

export interface AddSessionCommentData {
  couponId: string;
  comment: string;
}
