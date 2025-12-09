import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader, Container, Button, ButtonGroup } from "../../../../components";
import { Input } from "../../../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../components/ui/select";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../../../components/ui/card";
import { CompleteFamilyModal } from "../../../../components/domain/CompleteFamilyModal";
import { Table } from "../../../../components/table/Table";
import { familyService } from "../../../../services/familyService";
import type { Family } from "../../../../types/family";
import { getDepartmentFromPostalCode } from "../../../../utils";

interface IncompleteFamilyData extends Family {
  missingFields: string[];
}

export const FamilySelection: React.FC = () => {
  const navigate = useNavigate();
  const [completeFamilies, setCompleteFamilies] = useState<Family[]>([]);
  const [incompleteFamilies, setIncompleteFamilies] = useState<
    IncompleteFamilyData[]
  >([]);
  const [selectedFamily, setSelectedFamily] = useState<Family | null>(null);
  const [loading, setLoading] = useState(true);

  // States pour les filtres
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("");

  // States pour la modal d'informations
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIncompleteFamily, setSelectedIncompleteFamily] = useState<IncompleteFamilyData | null>(null);

  useEffect(() => {
    const loadFamilies = async () => {
      try {
        const familiesData = await familyService.getFamilies();

        // Séparer les familles complètes et incomplètes
        const complete: Family[] = [];
        const incomplete: IncompleteFamilyData[] = [];

        familiesData.forEach((family) => {
          const validation = familyService.validateFamilyCompleteness(family);
          if (validation.isComplete) {
            complete.push(family);
          } else {
            incomplete.push({
              ...family,
              missingFields: validation.missingFields,
            });
          }
        });

        setCompleteFamilies(complete);
        setIncompleteFamilies(incomplete);
      } catch (error) {
        console.error("Erreur lors du chargement des familles:", error);
      } finally {
        setLoading(false);
      }
    };
    loadFamilies();
  }, []);


  const selectFamily = (family: Family) => {
    setSelectedFamily(family);
    // Stocker la famille sélectionnée
    localStorage.setItem("selectedFamily", JSON.stringify(family));
  };

  const handleNext = () => {
    if (selectedFamily) {
      navigate("/admin/beneficiaries-subjects");
    }
  };

  const handleCancel = () => {
    navigate("/admin/ndrs");
  };

  const handleIncompleteRowClick = (row: any) => {
    const family = filteredIncompleteFamilies.find((f) => f._id === row.id);
    if (family) {
      setSelectedIncompleteFamily(family);
      setIsModalOpen(true);
    }
  };

  const handleSaveSuccess = async (updatedFamily: Family) => {
    // Fermer le modal
    setIsModalOpen(false);

    // Recharger les familles
    console.log("🟡 [RELOAD] Rechargement des familles...");
    setLoading(true);
    const familiesData = await familyService.getFamilies();
    console.log("🟡 [RELOAD] Nombre de familles rechargées:", familiesData.length);

    const complete: Family[] = [];
    const incomplete: IncompleteFamilyData[] = [];

    familiesData.forEach((family) => {
      const validation = familyService.validateFamilyCompleteness(family);
      if (validation.isComplete) {
        complete.push(family);
      } else {
        incomplete.push({
          ...family,
          missingFields: validation.missingFields,
        });
      }
    });

    console.log("🟡 [RELOAD] Familles complètes:", complete.length);
    console.log("🟡 [RELOAD] Familles incomplètes:", incomplete.length);

    // Vérifier si notre famille modifiée est devenue complète
    const wasFamilyUpdated = familiesData.find(f => f._id === updatedFamily._id);
    if (wasFamilyUpdated) {
      console.log("🟡 [RELOAD] Famille modifiée après rechargement:", {
        id: wasFamilyUpdated._id,
        nom: `${wasFamilyUpdated.primaryContact.firstName} ${wasFamilyUpdated.primaryContact.lastName}`,
        adresse: wasFamilyUpdated.primaryContact.address,
        validation: familyService.validateFamilyCompleteness(wasFamilyUpdated)
      });
    }

    setCompleteFamilies(complete);
    setIncompleteFamilies(incomplete);
    setLoading(false);

    console.log("✅ [SAVE] Sauvegarde terminée avec succès");
  };

  // Extraire les valeurs uniques pour les filtres (depuis completeFamilies uniquement)
  const cities = Array.from(
    new Set(completeFamilies.map((f) => f.primaryContact.address?.city).filter((city): city is string => Boolean(city)))
  ).sort();

  const departments = Array.from(
    new Set(
      completeFamilies
        .map((f) => getDepartmentFromPostalCode(f.primaryContact.address?.postalCode || ""))
        .filter((dept) => dept !== "")
    )
  ).sort();

  // Fonction de réinitialisation des filtres
  const handleReset = () => {
    setSearchTerm("");
    setFilterCity("");
    setFilterDepartment("");
  };

  // Fonction de filtrage réutilisable pour les familles
  const filterFamily = (family: Family) => {
    // Recherche textuelle
    const searchLower = searchTerm.toLowerCase();
    const fullName =
      `${family.primaryContact.firstName} ${family.primaryContact.lastName}`.toLowerCase();
    const email = (family.primaryContact.email || "").toLowerCase();

    const matchesSearch =
      fullName.includes(searchLower) || email.includes(searchLower);

    // Filtres par critère
    const matchesCity = !filterCity || family.primaryContact.address?.city === filterCity;
    const matchesDepartment =
      !filterDepartment ||
      getDepartmentFromPostalCode(family.primaryContact.address?.postalCode || "") === filterDepartment;

    return matchesSearch && matchesCity && matchesDepartment;
  };

  // Filtrer les familles complètes
  const filteredFamilies = completeFamilies.filter(filterFamily);

  // Filtrer les familles incomplètes
  const filteredIncompleteFamilies = incompleteFamilies.filter(filterFamily);

  // Colonnes du tableau des familles incomplètes
  const incompleteColumns = [
    { key: "firstName", label: "Prénom" },
    { key: "lastName", label: "Nom" },
    { key: "email", label: "Email" },
    { key: "postalCode", label: "Code postal" },
    {
      key: "missingFields",
      label: "Informations manquantes",
      render: (value: string[]) => value.join(", "),
    },
  ];

  // Transformation des données pour le tableau (filtrées)
  const incompleteFamiliesData = filteredIncompleteFamilies.map((family) => ({
    id: family._id,
    firstName: family.primaryContact.firstName || "—",
    lastName: family.primaryContact.lastName || "—",
    email: family.primaryContact.email || "—",
    postalCode: family.primaryContact.address?.postalCode || "—",
    missingFields: family.missingFields,
  }));

  return (
    <div>
      <PageHeader title="Étape 1 : Sélection de la famille pour la NDR" />
      <Container layout="flex-col">
        {loading ? (
          <div className="text-center py-8">
            <p>Chargement des familles...</p>
          </div>
        ) : (
          <>
            {/* Barre de recherche */}
            <Container layout="flex">
              <Input
                placeholder="Rechercher par nom, prénom, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </Container>

            {/* Filtres */}
            <Container layout="flex">
              <div className="flex gap-4 flex-wrap items-center">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Ville:</label>
                  <Select value={filterCity || "all"} onValueChange={(value) => setFilterCity(value === "all" ? "" : value)}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Toutes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes</SelectItem>
                      {cities.map((city) => (
                        <SelectItem key={city} value={city}>{city}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Département:</label>
                  <Select value={filterDepartment || "all"} onValueChange={(value) => setFilterDepartment(value === "all" ? "" : value)}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Tous" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous</SelectItem>
                      {departments.map((dept) => (
                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <ButtonGroup
                variant="single"
                buttons={[
                  {
                    text: "Réinitialiser",
                    variant: "outline",
                    onClick: handleReset,
                  },
                ]}
              />
            </Container>

            <div className="mb-4">
              <p>
                Cliquez sur la famille pour laquelle créer une note de règlement.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              {filteredFamilies.map((family) => (
                <Card
                  key={family._id}
                  className={`cursor-pointer hover:bg-accent transition-colors ${
                    selectedFamily?._id === family._id
                      ? "ring-2 ring-primary"
                      : ""
                  }`}
                  onClick={() => selectFamily(family)}
                >
                  <CardHeader>
                    <CardTitle>
                      {family.primaryContact.firstName}{" "}
                      {family.primaryContact.lastName}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">
                        {family.primaryContact.email}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {family.primaryContact.address?.city} - {getDepartmentFromPostalCode(family.primaryContact.address?.postalCode || "")}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {incompleteFamilies.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4">
                  Familles à compléter pour la création d'une Note de réglement(
                  {incompleteFamilies.length})
                </h3>
                <Table
                  columns={incompleteColumns}
                  data={incompleteFamiliesData}
                  onRowClick={handleIncompleteRowClick}
                  emptyMessage="Aucune famille incomplète ne correspond aux filtres"
                />
              </div>
            )}
          </>
        )}

        <div className="flex gap-4 justify-end mt-6">
          <Button variant="outline" onClick={handleCancel}>
            Annuler
          </Button>
          <Button
            variant="primary"
            onClick={handleNext}
            disabled={!selectedFamily}
          >
            Suivant
          </Button>
        </div>
      </Container>

      {/* Modal d'informations famille incomplète */}
      <CompleteFamilyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        family={selectedIncompleteFamily}
        onSaveSuccess={handleSaveSuccess}
      />
    </div>
  );
};
