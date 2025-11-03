/**
 * Hook simple pour le préremplissage des formulaires avec des données de test fixes
 */

export interface StudentTestData {
  firstName: string;
  lastName: string;
  birthDate: string;
  sameAsFamily: boolean;
  studentStreet: string;
  studentPostalCode: string;
  studentCity: string;
  grade: string;
  schoolName: string;
  schoolAddress: string;
  courseLocation: string;
  email: string;
  phone: string;
  notes: string;
}

export interface RdvTestData {
  date: string;
  time: string;
  type: string;
  assignedAdminId: string;
  notes: string;
}

export interface TeacherTestData {
  firstName: string;
  lastName: string;
  birthDate: string;
  phone: string;
  email: string;
  postalCode: string;
  identifier: string;
  notifyEmail: string;
}

/**
 * Hook qui fournit des données de test fixes pour préremplir rapidement les formulaires
 */
export const usePrefillTest = () => {
  // Données de test fixes pour élève
  const studentTestData: StudentTestData = {
    firstName: "Jean",
    lastName: "Dupont",
    birthDate: "2010-05-15",
    sameAsFamily: true,
    studentStreet: "123 Rue de la Paix",
    studentPostalCode: "75001",
    studentCity: "Paris",
    grade: "5ème",
    schoolName: "Collège Victor Hugo",
    schoolAddress: "45 Avenue des Écoles, 75001 Paris",
    courseLocation: "domicile",
    email: "jean.dupont@example.com",
    phone: "06 12 34 56 78",
    notes: "Élève motivé, besoin d'aide en mathématiques",
  };

  // Calcul automatique de la prochaine date (demain)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  // Données de test fixes pour RDV
  const rdvTestData: RdvTestData = {
    date: tomorrowStr,
    time: "14:00",
    type: "physique",
    assignedAdminId: "admin", // ID par défaut, à adapter selon les admins disponibles
    notes: "Rendez-vous de suivi pédagogique",
  };

  // Données de test fixes pour professeur
  const teacherTestData: TeacherTestData = {
    firstName: "Marie",
    lastName: "Leclerc",
    birthDate: "1985-03-22",
    phone: "06 98 76 54 32",
    email: "marie.leclerc@example.com",
    postalCode: "75002",
    identifier: "PROF001",
    notifyEmail: "marie.leclerc@example.com",
  };

  return {
    studentTestData,
    rdvTestData,
    teacherTestData,
  };
};
