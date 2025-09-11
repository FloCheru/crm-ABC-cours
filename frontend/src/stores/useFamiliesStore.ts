import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { familyService } from '../services/familyService';
import { settlementService } from '../services/settlementService';
import type { Family } from '../types/family';
import type { FamilyStats } from '../services/familyService';

// Interface pour les données unifiées
interface UnifiedFamiliesData {
  families: Family[];
  stats: FamilyStats;
  prospects: Family[];
  clients: Family[];
  clientsWithNDR: Family[];
  firstNDRDates: { [familyId: string]: string };
}

interface FamiliesState {
  // État
  data: UnifiedFamiliesData | null;
  isLoading: boolean;
  lastFetch: number;
  error: string | null;
  
  // Actions
  loadFamilies: () => Promise<void>;
  clearCache: () => void;
  isExpired: () => boolean;
  addProspectOptimistic: (newProspect: Family) => void;
  removeProspectOptimistic: (prospectId: string) => void;
  updateProspectOptimistic: (prospectId: string, updates: Partial<Family>) => void;
  replaceProspectId: (tempId: string, realId: string) => void;
  replaceStudentId: (familyId: string, tempStudentId: string, realStudentId: string) => void;
  
  // Sélecteurs mémorisés
  getProspects: () => Family[];
  getClients: () => Family[];
  getClientsWithNDR: () => Family[];
  getStats: () => FamilyStats | null;
  getFirstNDRDate: (familyId: string) => string;
}

// TTL d'1 heure (60 * 60 * 1000 ms)
const TTL = 60 * 60 * 1000;

export const useFamiliesStore = create<FamiliesState>()(
  persist(
    (set, get) => ({
      data: null,
      isLoading: false,
      lastFetch: 0,
      error: null,

  // Vérifier si le cache a expiré
  isExpired: () => {
    const { lastFetch } = get();
    return Date.now() - lastFetch > TTL;
  },

  // Charger les données (une seule fois tant que non expiré)
  loadFamilies: async () => {
    const { data, isLoading, isExpired } = get();
    
    // Si données présentes et non expirées, ne rien faire
    if (data && !isExpired() && !isLoading) {
      console.log('🚀 [FAMILIES-STORE] Using valid cache');
      return;
    }
    
    // Si déjà en cours de chargement, attendre
    if (isLoading) {
      console.log('🚀 [FAMILIES-STORE] Loading already in progress');
      return;
    }
    
    console.log('🚀 [FAMILIES-STORE] Starting API fetch...');
    set({ isLoading: true, error: null });
    
    try {
      const [familiesData, statsData] = await Promise.all([
        familyService.getFamilies(),
        familyService.getFamilyStats(),
      ]);
      
      const families = Array.isArray(familiesData) ? familiesData : [];
      
      // Filtrage local des prospects et clients
      const prospects = families.filter((family) => family.status === 'prospect');
      const clients = families.filter((family) => family.status === 'client');
      
      // Chargement optimisé des NDR pour les clients avec rate limiting
      const clientsWithNDR: Family[] = [];
      const ndrDates: { [familyId: string]: string } = {};
      
      const batchSize = 3;
      const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
      
      for (let i = 0; i < clients.length; i += batchSize) {
        const batch = clients.slice(i, i + batchSize);
        
        await Promise.all(
          batch.map(async (client) => {
            try {
              const ndrList = await settlementService.getSettlementNotesByFamily(client._id);
              if (ndrList.length > 0) {
                clientsWithNDR.push(client);
                const sortedNDRs = ndrList.sort(
                  (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                );
                ndrDates[client._id] = new Date(sortedNDRs[0].createdAt).toLocaleDateString('fr-FR');
              }
            } catch (err) {
              console.error(`Erreur lors du chargement des NDR pour ${client._id}:`, err);
            }
          })
        );
        
        if (i + batchSize < clients.length) {
          await delay(200);
        }
      }
      
      const unifiedData: UnifiedFamiliesData = {
        families,
        stats: statsData,
        prospects,
        clients,
        clientsWithNDR,
        firstNDRDates: ndrDates,
      };
      
      console.log(`🚀 [FAMILIES-STORE] Data loaded: ${families.length} families, ${prospects.length} prospects, ${clientsWithNDR.length} clients with NDR`);
      
      set({ 
        data: unifiedData, 
        isLoading: false, 
        lastFetch: Date.now(),
        error: null 
      });
      
    } catch (error: any) {
      console.error('❌ [FAMILIES-STORE] Erreur lors du chargement:', error);
      set({ 
        isLoading: false, 
        error: error?.message || 'Erreur lors du chargement des données',
        lastFetch: 0
      });
    }
  },

  // Vider le cache
  clearCache: () => {
    set({ data: null, lastFetch: 0, error: null });
  },

  // Ajouter un prospect de manière optimiste (UX instantanée)
  addProspectOptimistic: (newProspect: Family) => {
    const { data } = get();
    if (!data) return;

    const updatedFamilies = [...data.families, newProspect];
    const updatedProspects = [...data.prospects, newProspect];
    
    // Recalculer les stats optimistes
    const updatedStats = {
      ...data.stats,
      totalFamilies: updatedFamilies.length,
      totalProspects: updatedProspects.length,
    };

    const optimisticData: UnifiedFamiliesData = {
      ...data,
      families: updatedFamilies,
      prospects: updatedProspects,
      stats: updatedStats,
    };

    set({ 
      data: optimisticData,
      lastFetch: Date.now() // Marquer comme fraîchement mis à jour
    });
    
    console.log('🚀 [FAMILIES-STORE] Prospect ajouté de manière optimiste');
  },

  // Supprimer un prospect de manière optimiste (UX instantanée)
  removeProspectOptimistic: (prospectId: string) => {
    const { data } = get();
    if (!data) return;

    const updatedFamilies = data.families.filter(f => f._id !== prospectId);
    const updatedProspects = data.prospects.filter(f => f._id !== prospectId);
    
    // Recalculer les stats optimistes
    const updatedStats = {
      ...data.stats,
      totalFamilies: updatedFamilies.length,
      totalProspects: updatedProspects.length,
    };

    const optimisticData: UnifiedFamiliesData = {
      ...data,
      families: updatedFamilies,
      prospects: updatedProspects,
      stats: updatedStats,
    };

    set({ 
      data: optimisticData,
      lastFetch: Date.now() // Marquer comme fraîchement mis à jour
    });
    
    console.log('🗑️ [FAMILIES-STORE] Prospect supprimé de manière optimiste');
  },

  // Mettre à jour un prospect de manière optimiste (UX instantanée)
  updateProspectOptimistic: (prospectId: string, updates: Partial<Family>) => {
    const { data } = get();
    if (!data) return;

    // Mettre à jour dans families
    const updatedFamilies = data.families.map(f => 
      f._id === prospectId ? { ...f, ...updates } : f
    );
    
    // Mettre à jour dans prospects
    const updatedProspects = data.prospects.map(f => 
      f._id === prospectId ? { ...f, ...updates } : f
    );

    const optimisticData: UnifiedFamiliesData = {
      ...data,
      families: updatedFamilies,
      prospects: updatedProspects,
    };

    set({ 
      data: optimisticData,
      lastFetch: Date.now() // Marquer comme fraîchement mis à jour
    });
    
    console.log('✏️ [FAMILIES-STORE] Prospect mis à jour de manière optimiste');
  },

  // Remplacer l'ID temporaire par le vrai ID après création
  replaceProspectId: (tempId: string, realId: string) => {
    const { data } = get();
    if (!data) return;

    // Remplacer l'ID dans families
    const updatedFamilies = data.families.map(f => 
      f._id === tempId ? { ...f, _id: realId } : f
    );
    
    // Remplacer l'ID dans prospects
    const updatedProspects = data.prospects.map(f => 
      f._id === tempId ? { ...f, _id: realId } : f
    );

    const optimisticData: UnifiedFamiliesData = {
      ...data,
      families: updatedFamilies,
      prospects: updatedProspects,
    };

    set({ 
      data: optimisticData,
      // Ne pas toucher au lastFetch pour éviter de déclencher un rechargement
    });
    
    console.log(`🔄 [FAMILIES-STORE] ID temporaire ${tempId} remplacé par ${realId}`);
  },

  // Remplacer l'ID temporaire d'un étudiant par le vrai ID après création
  replaceStudentId: (familyId: string, tempStudentId: string, realStudentId: string) => {
    const { data } = get();
    if (!data) return;

    // Fonction helper pour remplacer l'ID étudiant dans une famille
    const replaceStudentInFamily = (family: Family) => {
      if (family._id === familyId && family.students) {
        return {
          ...family,
          students: family.students.map(student => 
            student._id === tempStudentId 
              ? { ...student, _id: realStudentId }
              : student
          )
        };
      }
      return family;
    };

    // Remplacer l'ID dans toutes les listes
    const updatedFamilies = data.families.map(replaceStudentInFamily);
    const updatedProspects = data.prospects.map(replaceStudentInFamily);
    const updatedClients = data.clients.map(replaceStudentInFamily);
    const updatedClientsWithNDR = data.clientsWithNDR.map(replaceStudentInFamily);

    const optimisticData: UnifiedFamiliesData = {
      ...data,
      families: updatedFamilies,
      prospects: updatedProspects,
      clients: updatedClients,
      clientsWithNDR: updatedClientsWithNDR,
    };

    set({ 
      data: optimisticData,
      // Ne pas toucher au lastFetch pour éviter de déclencher un rechargement
    });
    
    console.log(`🔄 [FAMILIES-STORE] ID temporaire étudiant ${tempStudentId} remplacé par ${realStudentId} dans famille ${familyId}`);
    console.log("📊 [DEBUG] Familles après remplacement d'ID:", updatedFamilies.find(f => f._id === familyId)?.students?.map(s => ({id: s._id, firstName: s.firstName})));
  },

  // Méthode générique optimisticUpdate pour ActionCache
  optimisticUpdate: (action: any, actionData: any) => {
    const { data } = get();
    if (!data) return;

    switch (action) {
      case 'ADD_STUDENT': {
        const { familyId, studentData, tempStudentId } = actionData;
        
        // Créer l'étudiant optimiste avec l'ID temporaire
        const optimisticStudent = {
          ...studentData,
          _id: tempStudentId,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        // Ajouter l'élève à la famille correspondante
        const updatedFamilies = data.families.map(f => 
          f._id === familyId 
            ? { ...f, students: [...(f.students || []), optimisticStudent] }
            : f
        );
        const updatedProspects = data.prospects.map(f => 
          f._id === familyId 
            ? { ...f, students: [...(f.students || []), optimisticStudent] }
            : f
        );
        const updatedClients = data.clients.map(f => 
          f._id === familyId 
            ? { ...f, students: [...(f.students || []), optimisticStudent] }
            : f
        );
        const updatedClientsWithNDR = data.clientsWithNDR.map(f => 
          f._id === familyId 
            ? { ...f, students: [...(f.students || []), optimisticStudent] }
            : f
        );
        
        set({ 
          data: {
            ...data,
            families: updatedFamilies,
            prospects: updatedProspects,
            clients: updatedClients,
            clientsWithNDR: updatedClientsWithNDR
          },
          lastFetch: Date.now()
        });
        
        console.log(`👤 [FAMILIES-STORE] Étudiant ${optimisticStudent.firstName} ${optimisticStudent.lastName} ajouté optimistiquement avec ID temporaire ${tempStudentId}`);
        break;
      }
      
      case 'UPDATE_PROSPECT_STATUS': {
        const { prospectId, newStatus } = actionData;
        get().updateProspectOptimistic(prospectId, { prospectStatus: newStatus });
        break;
      }
      
      case 'UPDATE_FAMILY': {
        const { familyId, updates, studentId, action } = actionData;
        
        if (action === 'remove_student' && studentId) {
          // Suppression d'étudiant : retirer l'étudiant de tous les tableaux
          const updatedFamilies = data.families.map(f => 
            f._id === familyId 
              ? { ...f, students: (f.students || []).filter(s => s._id !== studentId) }
              : f
          );
          const updatedProspects = data.prospects.map(f => 
            f._id === familyId 
              ? { ...f, students: (f.students || []).filter(s => s._id !== studentId) }
              : f
          );
          const updatedClients = data.clients.map(f => 
            f._id === familyId 
              ? { ...f, students: (f.students || []).filter(s => s._id !== studentId) }
              : f
          );
          const updatedClientsWithNDR = data.clientsWithNDR.map(f => 
            f._id === familyId 
              ? { ...f, students: (f.students || []).filter(s => s._id !== studentId) }
              : f
          );
          
          set({ 
            data: {
              ...data,
              families: updatedFamilies,
              prospects: updatedProspects,
              clients: updatedClients,
              clientsWithNDR: updatedClientsWithNDR
            },
            lastFetch: Date.now()
          });
          
          console.log(`🗑️ [FAMILIES-STORE] Étudiant ${studentId} supprimé optimistiquement de la famille ${familyId}`);
          console.log("📊 [DEBUG] Familles après suppression:", updatedFamilies.find(f => f._id === familyId)?.students?.map(s => ({id: s._id, firstName: s.firstName})));
        } else {
          // Mise à jour normale de la famille
          console.log(`🔄 [FAMILIES-STORE] Mise à jour famille ${familyId}:`, updates);
          get().updateProspectOptimistic(familyId, updates);
        }
        break;
      }
      
      case 'UPDATE_STUDENT': {
        const { familyId, studentId, studentUpdates } = actionData;
        console.log(`✏️ [FAMILIES-STORE] Tentative de mise à jour étudiant ${studentId} dans famille ${familyId}`);
        console.log("📝 [DEBUG] Nouvelles données étudiant:", studentUpdates);
        
        // Fonction helper pour mettre à jour l'étudiant dans une famille
        const updateStudentInFamily = (family: Family) => {
          if (family._id === familyId && family.students) {
            const updatedStudents = family.students.map(student => 
              student._id === studentId 
                ? { ...student, ...studentUpdates }
                : student
            );
            return { ...family, students: updatedStudents };
          }
          return family;
        };

        // Mettre à jour l'étudiant dans toutes les listes
        const updatedFamilies = data.families.map(updateStudentInFamily);
        const updatedProspects = data.prospects.map(updateStudentInFamily);
        const updatedClients = data.clients.map(updateStudentInFamily);
        const updatedClientsWithNDR = data.clientsWithNDR.map(updateStudentInFamily);

        set({ 
          data: {
            ...data,
            families: updatedFamilies,
            prospects: updatedProspects,
            clients: updatedClients,
            clientsWithNDR: updatedClientsWithNDR
          },
          lastFetch: Date.now()
        });
        
        console.log(`✅ [FAMILIES-STORE] Étudiant ${studentId} mis à jour optimistiquement`);
        console.log("📊 [DEBUG] Étudiant après mise à jour:", updatedFamilies.find(f => f._id === familyId)?.students?.find(s => s._id === studentId));
        break;
      }
      
      case 'UPDATE_REMINDER': {
        const { familyId, reminderData } = actionData;
        get().updateProspectOptimistic(familyId, reminderData);
        break;
      }
      
      case 'UPDATE_RDV': {
        const { familyId, rdvId, rdvUpdates } = actionData;
        console.log(`✏️ [FAMILIES-STORE] Tentative de mise à jour RDV ${rdvId} dans famille ${familyId}`);
        console.log("📝 [DEBUG] Nouvelles données RDV:", rdvUpdates);
        
        // 🔍 LOGS DE DIAGNOSTIC
        console.log("🔍 [DEBUG] Familles disponibles:", data.families.map(f => f._id));
        console.log("🔍 [DEBUG] Prospects disponibles:", data.prospects.map(f => f._id));
        console.log("🔍 [DEBUG] Clients disponibles:", data.clients.map(f => f._id));
        console.log("🔍 [DEBUG] Clients NDR disponibles:", data.clientsWithNDR.map(f => f._id));
        console.log("🔍 [DEBUG] Recherche familyId:", familyId);
        
        // Fonction helper pour mettre à jour le RDV dans une famille
        const updateRdvInFamily = (family: Family) => {
          if (family._id === familyId && family.rdvs) {
            const updatedRdvs = family.rdvs.map(rdv => 
              rdv._id === rdvId 
                ? { ...rdv, ...rdvUpdates, _id: rdvId }
                : rdv
            );
            return { ...family, rdvs: updatedRdvs };
          }
          return family;
        };

        // Mettre à jour le RDV dans toutes les listes
        const updatedFamilies = data.families.map(updateRdvInFamily);
        const updatedProspects = data.prospects.map(updateRdvInFamily);
        const updatedClients = data.clients.map(updateRdvInFamily);
        const updatedClientsWithNDR = data.clientsWithNDR.map(updateRdvInFamily);
        
        // 🔍 LOGS APRÈS MISE À JOUR
        console.log("🔍 [DEBUG] Vérification après mise à jour...");
        const allUpdatedFamilies = [...updatedFamilies, ...updatedProspects, ...updatedClients, ...updatedClientsWithNDR];
        const targetFamily = allUpdatedFamilies.find(f => f._id === familyId);
        console.log("🔍 [DEBUG] Famille trouvée après update:", !!targetFamily);
        console.log("🔍 [DEBUG] RDVs IDs dans famille:", targetFamily?.rdvs?.map(r => r._id));
        console.log("🔍 [DEBUG] rdvId recherché:", rdvId);
        console.log("🔍 [DEBUG] Type rdvId recherché:", typeof rdvId);
        console.log("🔍 [DEBUG] Comparaison exacte:", targetFamily?.rdvs?.map(r => ({ rdvId: r._id, match: r._id === rdvId })));
        console.log("🔍 [DEBUG] RDV spécifique après update:", targetFamily?.rdvs?.find(r => r._id === rdvId));

        set({ 
          data: {
            ...data,
            families: updatedFamilies,
            prospects: updatedProspects,
            clients: updatedClients,
            clientsWithNDR: updatedClientsWithNDR
          },
          lastFetch: Date.now()
        });
        
        console.log(`✅ [FAMILIES-STORE] RDV ${rdvId} mis à jour optimistiquement`);
        break;
      }
      
      case 'CREATE_PROSPECT': {
        const { tempId, familyData } = actionData;
        // Créer le prospect optimiste avec l'ID temporaire
        const optimisticProspect: Family = {
          ...familyData,
          _id: tempId,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as Family;
        get().addProspectOptimistic(optimisticProspect);
        break;
      }
      
      case 'DELETE_PROSPECT':
      case 'DELETE_CLIENT': {
        const id = actionData.prospectId || actionData.clientId;
        get().removeProspectOptimistic(id);
        break;
      }

      case 'CREATE_RDV': {
        const { familyId, rdvData, tempRdvId, assignedAdminData } = actionData;
        
        // Créer le RDV optimiste avec l'ID temporaire
        const optimisticRdv = {
          ...rdvData,
          _id: tempRdvId,
          status: 'planifie', // Statut par défaut
          // Si on a les données d'admin, les utiliser, sinon garder l'ID
          assignedAdminId: assignedAdminData ? {
            _id: assignedAdminData.id,
            firstName: assignedAdminData.firstName,
            lastName: assignedAdminData.lastName
          } : rdvData.assignedAdminId,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        // Ajouter le RDV à la famille correspondante
        const updatedFamilies = data.families.map(f => 
          f._id === familyId 
            ? { ...f, rdvs: [...(f.rdvs || []), optimisticRdv] }
            : f
        );
        const updatedProspects = data.prospects.map(f => 
          f._id === familyId 
            ? { ...f, rdvs: [...(f.rdvs || []), optimisticRdv] }
            : f
        );
        const updatedClients = data.clients.map(f => 
          f._id === familyId 
            ? { ...f, rdvs: [...(f.rdvs || []), optimisticRdv] }
            : f
        );
        const updatedClientsWithNDR = data.clientsWithNDR.map(f => 
          f._id === familyId 
            ? { ...f, rdvs: [...(f.rdvs || []), optimisticRdv] }
            : f
        );
        
        set({ 
          data: {
            ...data,
            families: updatedFamilies,
            prospects: updatedProspects,
            clients: updatedClients,
            clientsWithNDR: updatedClientsWithNDR
          },
          lastFetch: Date.now()
        });
        
        console.log(`📅 [FAMILIES-STORE] RDV ajouté optimistiquement avec ID temporaire ${tempRdvId}`);
        break;
      }

      case 'DELETE_RDV': {
        const { familyId, rdvId } = actionData;
        
        // Supprimer le RDV de la famille correspondante
        const updatedFamilies = data.families.map(f => 
          f._id === familyId 
            ? { ...f, rdvs: (f.rdvs || []).filter(r => r._id !== rdvId) }
            : f
        );
        const updatedProspects = data.prospects.map(f => 
          f._id === familyId 
            ? { ...f, rdvs: (f.rdvs || []).filter(r => r._id !== rdvId) }
            : f
        );
        const updatedClients = data.clients.map(f => 
          f._id === familyId 
            ? { ...f, rdvs: (f.rdvs || []).filter(r => r._id !== rdvId) }
            : f
        );
        const updatedClientsWithNDR = data.clientsWithNDR.map(f => 
          f._id === familyId 
            ? { ...f, rdvs: (f.rdvs || []).filter(r => r._id !== rdvId) }
            : f
        );
        
        set({ 
          data: {
            ...data,
            families: updatedFamilies,
            prospects: updatedProspects,
            clients: updatedClients,
            clientsWithNDR: updatedClientsWithNDR
          },
          lastFetch: Date.now()
        });
        
        console.log(`📅 [FAMILIES-STORE] RDV ${rdvId} supprimé optimistiquement`);
        break;
      }

      case 'CREATE_NDR': {
        const { familyId, newStatus } = actionData;
        
        // Le familyId existe forcément puisqu'on crée une NDR
        const updatedFamilies = data.families.map(f => 
          f._id === familyId ? { ...f, status: newStatus } : f
        );
        
        // Déplacer de prospects vers clients
        const updatedProspects = data.prospects.filter(p => p._id !== familyId);
        const newClient = data.prospects.find(p => p._id === familyId);
        const updatedClients = [...data.clients, { ...newClient, status: newStatus }];
        const updatedClientsWithNDR = [...data.clientsWithNDR, { ...newClient, status: newStatus }];
        
        set({
          data: {
            ...data,
            families: updatedFamilies,
            prospects: updatedProspects, 
            clients: updatedClients,
            clientsWithNDR: updatedClientsWithNDR
          },
          lastFetch: Date.now()
        });
        
        console.log(`📋 [FAMILIES-STORE] NDR créée optimistiquement - Prospect ${familyId} → Client`);
        break;
      }

      case 'DELETE_NDR': {
        const { familyId, ndrId } = actionData;
        
        console.log(`🗑️ [FAMILIES-STORE] Processing DELETE_NDR for family ${familyId}, NDR ${ndrId}`);
        
        // Mettre à jour les familles (retirer la NDR si elle est stockée)
        const updatedFamilies = data.families.map(f => 
          f._id === familyId && f.settlementNotes
            ? { ...f, settlementNotes: f.settlementNotes.filter(ndr => ndr._id !== ndrId) }
            : f
        );
        
        // Vérifier si c'était la dernière NDR pour déterminer le nouveau statut
        const family = data.families.find(f => f._id === familyId);
        const remainingNDRs = family?.settlementNotes?.filter(ndr => ndr._id !== ndrId) || [];
        
        console.log(`🔍 [FAMILIES-STORE] Family found:`, family ? 'YES' : 'NO');
        console.log(`🔍 [FAMILIES-STORE] Family settlement notes:`, family?.settlementNotes?.length || 0);
        console.log(`🔍 [FAMILIES-STORE] Remaining NDRs after deletion:`, remainingNDRs.length);
        
        if (remainingNDRs.length === 0) {
          // Plus de NDR : client → prospect
          const updatedClients = data.clients.filter(c => c._id !== familyId);
          const updatedClientsWithNDR = data.clientsWithNDR.filter(c => c._id !== familyId);
          const familyToMove = data.clients.find(c => c._id === familyId);
          const updatedProspects = familyToMove 
            ? [...data.prospects, { ...familyToMove, status: 'prospect' }]
            : data.prospects;
          
          set({
            data: {
              ...data,
              families: updatedFamilies.map(f => 
                f._id === familyId ? { ...f, status: 'prospect' } : f
              ),
              prospects: updatedProspects,
              clients: updatedClients,
              clientsWithNDR: updatedClientsWithNDR
            },
            lastFetch: Date.now()
          });
          
          console.log(`📋 [FAMILIES-STORE] NDR supprimée - Client ${familyId} → Prospect (plus de NDR)`);
        } else {
          // Il reste des NDR : garde le statut client
          set({
            data: {
              ...data,
              families: updatedFamilies
            },
            lastFetch: Date.now()
          });
          
          console.log(`📋 [FAMILIES-STORE] NDR ${ndrId} supprimée de famille ${familyId}`);
        }
        break;
      }
      
      default:
        console.log(`[FAMILIES-STORE] Action optimiste non gérée: ${action}`);
    }
  },

  // Méthode générique rollback pour ActionCache
  rollback: (action: any, _actionData: any) => {
    // Pour CREATE_RDV, ne pas vider le cache pour préserver l'état d'erreur de la modal
    if (action === 'CREATE_RDV') {
      console.log(`[FAMILIES-STORE] Rollback CREATE_RDV - préservation de l'état pour affichage erreur`);
      // Ne pas appeler clearCache() pour éviter le "reload" de la modal
      return;
    }
    
    // Pour les autres actions, on vide le cache pour forcer un rechargement
    console.log(`[FAMILIES-STORE] Rollback de l'action ${action} - rechargement forcé`);
    get().clearCache();
  },

  // Sélecteurs optimisés (pas de recalcul si data n'a pas changé)
  getProspects: () => {
    const { data } = get();
    return data?.prospects || [];
  },

  getClients: () => {
    const { data } = get();
    return data?.clients || [];
  },

  getClientsWithNDR: () => {
    const { data } = get();
    return data?.clientsWithNDR || [];
  },

  getStats: () => {
    const { data } = get();
    return data?.stats || null;
  },

  getFirstNDRDate: (familyId: string) => {
    const { data } = get();
    return data?.firstNDRDates[familyId] || '';
  },

  // Méthode optimisticUpdate pour ActionCache (était manquante !)
  optimisticUpdate: (action: any, actionData: any) => {
    console.log(`🔍 [FAMILIES-STORE] optimisticUpdate called with action: ${action}`, actionData);
    
    const { data } = get();
    if (!data) {
      console.log(`❌ [FAMILIES-STORE] No data in store, aborting optimisticUpdate`);
      return;
    }

    console.log(`🔍 [FAMILIES-STORE] Current store data:`, {
      familiesCount: data.families?.length || 0,
      prospectsCount: data.prospects?.length || 0,
      clientsCount: data.clients?.length || 0,
      clientsWithNDRCount: data.clientsWithNDR?.length || 0
    });

    switch (action) {
      case 'CREATE_NDR': {
        const { familyId, newStatus } = actionData;
        
        // Déplacer prospect → client si c'est la première NDR
        const familyToMove = data.prospects.find(p => p._id === familyId);
        if (familyToMove && newStatus === 'client') {
          const updatedProspects = data.prospects.filter(p => p._id !== familyId);
          const updatedClients = [...data.clients, { ...familyToMove, status: 'client' }];
          const updatedClientsWithNDR = [...data.clientsWithNDR, { ...familyToMove, status: 'client' }];
          const updatedFamilies = data.families.map(f => 
            f._id === familyId ? { ...f, status: 'client' } : f
          );
          
          set({
            data: {
              ...data,
              families: updatedFamilies,
              prospects: updatedProspects,
              clients: updatedClients,
              clientsWithNDR: updatedClientsWithNDR
            },
            lastFetch: Date.now()
          });
          
          console.log(`📋 [FAMILIES-STORE] NDR créée optimistiquement - Prospect ${familyId} → Client`);
        }
        break;
      }
      
      case 'DELETE_NDR': {
        console.log(`🗑️ [FAMILIES-STORE] DELETE_NDR - Backend handles status change, invalidating cache`);
        set({ data: null, lastFetch: 0, error: null });
        console.log(`📋 [FAMILIES-STORE] Cache invalidated - will reload with backend status changes`);
        break;
      }
    }
  },
}),
{
  name: 'families-storage', // Nom unique pour le localStorage
  partialize: (state) => ({ 
    data: state.data,
    lastFetch: state.lastFetch
  }), // On ne persiste que les données et lastFetch, pas isLoading/error
}
)
);