import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  SummaryCard,
  Button,
  Table,
  PageHeader,
} from "../../components";
import { familyService } from "../../services/familyService";
import rdvService from "../../services/rdvService";
import type { Family } from "../../types/family";
import type { RendezVous } from "../../types/rdv";
import { useAuthStore } from "../../stores";

// Type pour les données du tableau avec l'id requis
type TableRowData = Family & { id: string };
type RdvTableRowData = RendezVous & { id: string };

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);

  // États locaux
  const [prospects, setProspects] = useState<Family[]>([]);
  const [clients, setClients] = useState<Family[]>([]);
  const [weekRdvs, setWeekRdvs] = useState<RendezVous[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Calculer les métriques
  const urgentActions = prospects.filter((p) => {
    if (!p.nextActionDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const actionDate = new Date(p.nextActionDate);
    actionDate.setHours(0, 0, 0, 0);
    return actionDate <= today;
  });

  // Grouper les prospects par statut
  const statusGroups = [
    {
      status: "en_reflexion",
      label: "En réflexion",
      color: "bg-blue-500",
      icon: "🤔",
    },
    {
      status: "interesse_prof_a_trouver",
      label: "Prof à trouver",
      color: "bg-yellow-500",
      icon: "🔍",
    },
    {
      status: "ndr_editee",
      label: "NDR éditée",
      color: "bg-green-500",
      icon: "📄",
    },
    {
      status: "rdv_prospect",
      label: "RDV prévu",
      color: "bg-purple-500",
      icon: "📅",
    },
    {
      status: "injoignable",
      label: "Injoignable",
      color: "bg-red-500",
      icon: "📵",
    },
  ];

  // Charger les données
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Charger les familles
        const families = await familyService.getFamilies();
        const prospectsList = families.filter(
          (family) => !family.ndr || family.ndr.length === 0
        );
        const clientsList = families.filter(
          (family) => family.ndr && family.ndr.length > 0
        );

        setProspects(prospectsList);
        setClients(clientsList);

        // Charger les RDV de la semaine pour l'admin connecté
        if (currentUser?._id) {
          const today = new Date();
          const nextWeek = new Date();
          nextWeek.setDate(today.getDate() + 7);

          const rdvs = await rdvService.getRdvsByAdmin(
            currentUser._id,
            today.toISOString().split("T")[0],
            nextWeek.toISOString().split("T")[0]
          );

          setWeekRdvs(rdvs.filter((rdv) => rdv.status === "planifie"));
        }
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [currentUser]);

  // Helper: calculer les jours en retard
  const calculateDaysOverdue = (nextActionDate: Date | null): number => {
    if (!nextActionDate) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const actionDate = new Date(nextActionDate);
    actionDate.setHours(0, 0, 0, 0);
    const diffTime = today.getTime() - actionDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  // Handler: naviguer vers détails du prospect
  const handleProspectClick = (prospectId: string) => {
    navigate(`/admin/prospect-details/${prospectId}`);
  };

  // Handler: créer un RDV
  const handleCreateRdv = (familyId: string) => {
    // TODO: Ouvrir modal de création RDV
    console.log("Créer RDV pour famille:", familyId);
  };

  // Colonnes du tableau "Actions urgentes"
  const urgentActionsColumns = [
    {
      key: "fullName",
      label: "Prospect",
      render: (_: unknown, row: TableRowData) => (
        <div className="font-medium text-sm">
          {row.primaryContact.firstName} {row.primaryContact.lastName}
        </div>
      ),
    },
    {
      key: "phone",
      label: "Téléphone",
      render: (_: unknown, row: TableRowData) => (
        <a
          href={`tel:${row.primaryContact.primaryPhone}`}
          className="text-primary hover:underline text-sm"
          onClick={(e) => e.stopPropagation()}
        >
          {row.primaryContact.primaryPhone}
        </a>
      ),
    },
    {
      key: "nextAction",
      label: "Action à faire",
      render: (_: unknown, row: TableRowData) => (
        <div className="text-sm">{row.nextAction || "Actions à définir"}</div>
      ),
    },
    {
      key: "daysOverdue",
      label: "Retard",
      render: (_: unknown, row: TableRowData) => {
        const daysOverdue = calculateDaysOverdue(row.nextActionDate ?? null);
        return (
          <div
            className={`text-sm font-semibold ${
              daysOverdue > 3 ? "text-error" : "text-warning"
            }`}
          >
            {daysOverdue === 0
              ? "Aujourd'hui"
              : `${daysOverdue} jour${daysOverdue > 1 ? "s" : ""}`}
          </div>
        );
      },
    },
    {
      key: "actions",
      label: "Actions",
      render: (_: unknown, row: TableRowData) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              window.location.href = `tel:${row.primaryContact.primaryPhone}`;
            }}
          >
            📞 Appeler
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              handleCreateRdv(row._id);
            }}
          >
            📅 RDV
          </Button>
        </div>
      ),
    },
  ];

  // Colonnes du tableau "RDV de cette semaine"
  const weekRdvsColumns = [
    {
      key: "date",
      label: "Date",
      render: (_: unknown, row: RdvTableRowData) => (
        <div className="text-sm font-medium">
          {new Date(row.date).toLocaleDateString("fr-FR", {
            weekday: "short",
            day: "2-digit",
            month: "short",
          })}
        </div>
      ),
    },
    {
      key: "time",
      label: "Heure",
      render: (_: unknown, row: RdvTableRowData) => (
        <div className="text-sm font-medium">{row.time}</div>
      ),
    },
    {
      key: "family",
      label: "Famille",
      render: (_: unknown, row: RdvTableRowData) => {
        // Trouver la famille correspondante
        const family = [...prospects, ...clients].find(
          (f) => f._id === row.familyId
        );
        return (
          <div className="text-sm">
            {family
              ? `${family.primaryContact.firstName} ${family.primaryContact.lastName}`
              : "N/A"}
          </div>
        );
      },
    },
    {
      key: "type",
      label: "Type",
      render: (_: unknown, row: RdvTableRowData) => (
        <div
          className={`text-xs px-2 py-1 rounded inline-block ${
            row.type === "physique"
              ? "bg-blue-100 text-blue-800"
              : "bg-purple-100 text-purple-800"
          }`}
        >
          {row.type === "physique" ? "🏠 Physique" : "💻 Visio"}
        </div>
      ),
    },
    {
      key: "status",
      label: "Statut",
      render: (_: unknown, row: RdvTableRowData) => (
        <div
          className={`text-xs px-2 py-1 rounded inline-block ${
            row.status === "planifie"
              ? "bg-yellow-100 text-yellow-800"
              : "bg-green-100 text-green-800"
          }`}
        >
          {row.status === "planifie" ? "Prévu" : "Réalisé"}
        </div>
      ),
    },
  ];

  return (
    <main>
      <Container layout="flex-col">
        <PageHeader title="Tableau de bord Admin" />

        {/* Section 1: Statistiques clés */}
        <Container layout="grid" padding="none">
          <SummaryCard
            title="PROSPECTS"
            metrics={[
              {
                value: prospects.length,
                label: "Sans NDR",
                variant: "primary",
              },
            ]}
          />
          <SummaryCard
            title="CLIENTS"
            metrics={[
              {
                value: clients.length,
                label: "Avec NDR",
                variant: "success",
              },
            ]}
          />
          <SummaryCard
            title="RDV SEMAINE"
            metrics={[
              {
                value: weekRdvs.length,
                label: "À venir",
                variant: "info",
              },
            ]}
          />
          <SummaryCard
            title="ACTIONS EN RETARD"
            metrics={[
              {
                value: urgentActions.length,
                label: "À traiter",
                variant: "error",
              },
            ]}
          />
        </Container>

        {/* Section 2: Actions urgentes */}
        <Container layout="flex-col">
          <h3 className="text-xl font-semibold mb-4">🚨 Actions urgentes</h3>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="text-gray-500">Chargement...</div>
            </div>
          ) : urgentActions.length === 0 ? (
            <div className="text-center py-8 bg-green-50 rounded-lg border border-green-200">
              <div className="text-green-700 font-medium">
                ✅ Aucune action urgente - Vous êtes à jour !
              </div>
            </div>
          ) : (
            <Table
              columns={urgentActionsColumns}
              data={urgentActions
                .sort(
                  (a, b) =>
                    calculateDaysOverdue(b.nextActionDate ?? null) -
                    calculateDaysOverdue(a.nextActionDate ?? null)
                )
                .map((family) => ({
                  ...family,
                  id: family._id,
                }))}
              onRowClick={(row) => handleProspectClick(row._id)}
            />
          )}
        </Container>

        {/* Section 3: RDV de cette semaine */}
        <Container layout="flex-col">
          <h3 className="text-xl font-semibold mb-4">
            📅 Rendez-vous de cette semaine
          </h3>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="text-gray-500">Chargement...</div>
            </div>
          ) : weekRdvs.length === 0 ? (
            <div className="text-center py-8 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-blue-700 font-medium">
                📭 Aucun rendez-vous prévu cette semaine
              </div>
            </div>
          ) : (
            <Table
              columns={weekRdvsColumns}
              data={weekRdvs
                .sort(
                  (a, b) =>
                    new Date(a.date).getTime() - new Date(b.date).getTime()
                )
                .map((rdv) => ({
                  ...rdv,
                  id: rdv._id,
                }))}
              onRowClick={(row) => handleProspectClick(row.familyId || "")}
            />
          )}
        </Container>

        {/* Section 4: Prospects par statut */}
        <Container layout="flex-col">
          <h3 className="text-xl font-semibold mb-4">
            🎯 Prospects par statut
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {statusGroups.map((group) => {
              const count = prospects.filter(
                (p) => p.prospectStatus === group.status
              ).length;
              return (
                <button
                  key={group.status}
                  onClick={() =>
                    navigate("/admin/prospects", {
                      state: { filterStatus: group.status },
                    })
                  }
                  className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 text-center border border-gray-200 cursor-pointer"
                >
                  <div className="text-4xl mb-3">{group.icon}</div>
                  <div className={`text-3xl font-bold ${group.color}`}>
                    {count}
                  </div>
                  <div className="text-sm text-gray-600 mt-2">
                    {group.label}
                  </div>
                </button>
              );
            })}
          </div>
        </Container>
      </Container>
    </main>
  );
};
