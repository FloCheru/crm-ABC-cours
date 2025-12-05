export interface RendezVous {
  _id: string;
  // Context: famille, professeur ou admin
  familyId?: string; // RDV avec une famille
  professorId?: string; // RDV avec un professeur
  studentId?: string; // RDV professeur avec un élève spécifique
  assignedAdminId?: string; // ID de l'admin qui gère le RDV (pour RDV admin-famille ou admin-professeur)

  // Type de RDV pour distinguer les contextes
  entityType: "admin-family" | "admin-professor" | "professor-student";

  date: Date;
  time: string; // Format "HH:MM" (08:00 à 21:00)
  type: "physique" | "visio";
  notes?: string;
  status: "planifie" | "realise" | "annule" | "demande";
  createdAt: Date;
  updatedAt: Date;
}

// Types helpers pour les selects
export const RDV_HOURS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
  "17:00", "17:30", "18:00", "18:30", "19:00", "19:30",
  "20:00", "20:30", "21:00"
];

export const RDV_TYPES = [
  { value: "physique", label: "Physique" },
  { value: "visio", label: "Visio" }
];