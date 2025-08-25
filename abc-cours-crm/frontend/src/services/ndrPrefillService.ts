import type { Subject } from '../types/subject';

export interface PrefillRates {
  hourlyRate: number;
  professorSalary: number;
  quantity: number;
  charges: number;
  paymentMethod: string;
  paymentType: string;
}

interface SubjectRateConfig {
  hourlyRate: number;
  professorSalary: number;
}

interface DepartmentChargesConfig {
  [key: string]: number;
}

class NDRPrefillService {
  // Configuration des tarifs par défaut par type de matière
  private readonly DEFAULT_RATES: { [key: string]: SubjectRateConfig } = {
    // Matières scientifiques - tarifs plus élevés
    mathematics: { hourlyRate: 28, professorSalary: 20 },
    physics: { hourlyRate: 30, professorSalary: 22 },
    chemistry: { hourlyRate: 30, professorSalary: 22 },
    biology: { hourlyRate: 27, professorSalary: 19 },
    
    // Langues - tarifs standard
    french: { hourlyRate: 25, professorSalary: 18 },
    english: { hourlyRate: 26, professorSalary: 19 },
    spanish: { hourlyRate: 25, professorSalary: 18 },
    german: { hourlyRate: 26, professorSalary: 19 },
    
    // Autres matières - tarifs standard
    history: { hourlyRate: 24, professorSalary: 17 },
    geography: { hourlyRate: 24, professorSalary: 17 },
    philosophy: { hourlyRate: 26, professorSalary: 19 },
    
    // Tarif par défaut pour matières non reconnues
    default: { hourlyRate: 25, professorSalary: 18 }
  };

  // Configuration des charges par département
  private readonly DEPARTMENT_CHARGES: DepartmentChargesConfig = {
    // Île-de-France - charges plus élevées
    '75': 3.0, // Paris
    '92': 2.8, // Hauts-de-Seine  
    '93': 2.7, // Seine-Saint-Denis
    '94': 2.7, // Val-de-Marne
    '95': 2.6, // Val-d'Oise
    '91': 2.6, // Essonne
    '77': 2.5, // Seine-et-Marne
    '78': 2.6, // Yvelines
    
    // Grandes métropoles
    '13': 2.4, // Bouches-du-Rhône (Marseille)
    '69': 2.4, // Rhône (Lyon)
    '31': 2.3, // Haute-Garonne (Toulouse)
    '59': 2.2, // Nord (Lille)
    '33': 2.3, // Gironde (Bordeaux)
    
    // Autres départements - charges standard
    default: 2.0
  };

  // Quantité par défaut par matière
  private readonly DEFAULT_QUANTITY_PER_SUBJECT = 8;

  /**
   * Détermine le type de matière en analysant son nom
   */
  private getSubjectType(subjectName: string): string {
    const name = subjectName.toLowerCase().trim();
    
    // Matières scientifiques
    if (name.includes('mathématiques') || name.includes('math') || name.includes('algèbre') || 
        name.includes('géométrie') || name.includes('analyse')) {
      return 'mathematics';
    }
    if (name.includes('physique') || name.includes('mécanique') || name.includes('thermodynamique')) {
      return 'physics';
    }
    if (name.includes('chimie') || name.includes('organique') || name.includes('minérale')) {
      return 'chemistry';
    }
    if (name.includes('biologie') || name.includes('svt') || name.includes('sciences de la vie')) {
      return 'biology';
    }
    
    // Langues
    if (name.includes('français') || name.includes('littérature') || name.includes('grammaire')) {
      return 'french';
    }
    if (name.includes('anglais') || name.includes('english')) {
      return 'english';
    }
    if (name.includes('espagnol') || name.includes('spanish')) {
      return 'spanish';
    }
    if (name.includes('allemand') || name.includes('german')) {
      return 'german';
    }
    
    // Autres matières
    if (name.includes('histoire')) {
      return 'history';
    }
    if (name.includes('géographie')) {
      return 'geography';
    }
    if (name.includes('philosophie')) {
      return 'philosophy';
    }
    
    return 'default';
  }

  /**
   * Calcule les charges selon le département
   */
  private calculateCharges(department: string): number {
    // Extraire le numéro de département (ex: "75 - Paris" -> "75")
    const deptNumber = department.split(' ')[0];
    return this.DEPARTMENT_CHARGES[deptNumber] || this.DEPARTMENT_CHARGES.default;
  }

  /**
   * Calcule un tarif moyen pondéré selon les matières sélectionnées
   */
  private calculateWeightedRates(subjects: Subject[]): SubjectRateConfig {
    if (subjects.length === 0) {
      return this.DEFAULT_RATES.default;
    }

    let totalHourlyRate = 0;
    let totalProfessorSalary = 0;

    // Calculer la moyenne pondérée des tarifs
    subjects.forEach(subject => {
      const subjectType = this.getSubjectType(subject.name);
      const rates = this.DEFAULT_RATES[subjectType] || this.DEFAULT_RATES.default;
      
      totalHourlyRate += rates.hourlyRate;
      totalProfessorSalary += rates.professorSalary;
    });

    return {
      hourlyRate: Math.round((totalHourlyRate / subjects.length) * 100) / 100,
      professorSalary: Math.round((totalProfessorSalary / subjects.length) * 100) / 100
    };
  }

  /**
   * Génère les valeurs de préremplissage intelligentes
   */
  generatePrefillData(
    subjects: Subject[],
    department: string,
    clientType: 'prospect' | 'client' = 'prospect'
  ): PrefillRates {
    console.log('📋 Génération préremplissage NDR:', { subjects: subjects.length, department, clientType });

    // Calcul des tarifs moyens selon les matières
    const weightedRates = this.calculateWeightedRates(subjects);
    
    // Calcul de la quantité totale (nombre de matières × quantité par matière)
    const totalQuantity = subjects.length * this.DEFAULT_QUANTITY_PER_SUBJECT;
    
    // Calcul des charges selon le département
    const charges = this.calculateCharges(department);
    
    // Mode de paiement préféré selon le type de client
    const paymentMethod = clientType === 'client' ? 'transfer' : 'check';
    const paymentType = 'tax_credit_n1'; // Crédit d'impôt plus courant

    const prefillData: PrefillRates = {
      hourlyRate: weightedRates.hourlyRate,
      professorSalary: weightedRates.professorSalary,
      quantity: totalQuantity,
      charges,
      paymentMethod,
      paymentType
    };

    console.log('📋 Données préremplissage générées:', prefillData);
    
    return prefillData;
  }

  /**
   * Calcule un aperçu financier rapide
   */
  calculateQuickPreview(prefillData: PrefillRates): {
    totalRevenue: number;
    totalSalary: number;
    totalCharges: number;
    margin: number;
    marginPercentage: number;
  } {
    const totalRevenue = prefillData.hourlyRate * prefillData.quantity;
    const totalSalary = prefillData.professorSalary * prefillData.quantity;
    const totalCharges = prefillData.charges * prefillData.quantity;
    const margin = totalRevenue - totalSalary - totalCharges;
    const marginPercentage = totalRevenue > 0 ? (margin / totalRevenue) * 100 : 0;

    return {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalSalary: Math.round(totalSalary * 100) / 100,
      totalCharges: Math.round(totalCharges * 100) / 100,
      margin: Math.round(margin * 100) / 100,
      marginPercentage: Math.round(marginPercentage * 10) / 10
    };
  }

  /**
   * Génère des suggestions de tarification selon la marge cible
   */
  suggestOptimalRates(
    subjects: Subject[],
    department: string,
    targetMarginPercentage: number = 25
  ): PrefillRates {
    const basePrefill = this.generatePrefillData(subjects, department);
    
    // Calcul inverse pour atteindre la marge cible
    const charges = basePrefill.charges;
    const professorSalary = basePrefill.professorSalary;
    
    // Formule : hourlyRate = (professorSalary + charges) / (1 - targetMargin/100)
    const optimalHourlyRate = (professorSalary + charges) / (1 - targetMarginPercentage / 100);
    
    return {
      ...basePrefill,
      hourlyRate: Math.round(optimalHourlyRate * 100) / 100
    };
  }
}

export const ndrPrefillService = new NDRPrefillService();
export type { SubjectRateConfig };