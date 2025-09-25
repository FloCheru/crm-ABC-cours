import { familyService } from "../services/familyService";
import type { ProspectStatus } from "../components/StatusDot";

/**
 * Met à jour le statut d'un prospect
 */
export const updateProspectStatus = (familyId: string, status: ProspectStatus | null) => {
  return familyService.updateFamily(familyId, { prospectStatus: status });
};

/**
 * Met à jour la prochaine action d'un prospect
 */
export const updateNextAction = (familyId: string, action: string) => {
  return familyService.updateFamily(familyId, { nextAction: action });
};

/**
 * Met à jour la date de la prochaine action d'un prospect
 */
export const updateNextActionDate = (familyId: string, date: Date | null) => {
  return familyService.updateFamily(familyId, { nextActionDate: date });
};

/**
 * Met à jour les notes d'un prospect
 */
export const updateNotes = (familyId: string, notes: string) => {
  return familyService.updateFamily(familyId, { notes });
};