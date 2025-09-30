import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar, PageHeader, Container, Button } from "../../../../components";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../../../components/ui/card";
import { familyService } from "../../../../services/familyService";
import type { Family } from "../../../../types/family";

export const FamilySelection: React.FC = () => {
  const navigate = useNavigate();
  const [families, setFamilies] = useState<Family[]>([]);
  const [selectedFamily, setSelectedFamily] = useState<Family | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFamilies = async () => {
      try {
        const familiesData = await familyService.getFamilies();
        setFamilies(familiesData);
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
    // Stocker la famille sélectionnée et l'origine
    localStorage.setItem("selectedFamily", JSON.stringify(family));
    localStorage.setItem("from", "ndrs");
  };

  const handleNext = () => {
    if (selectedFamily) {
      navigate("/beneficiaries-subjects");
    }
  };

  const handleCancel = () => {
    navigate("/ndrs");
  };

  return (
    <div>
      <Navbar activePath="/family-selection" />
      <PageHeader title="Sélection de la famille" />
      <Container layout="flex-col">
        <div className="mb-4">
          <h2>Étape 1 : Sélection de la famille pour la NDR</h2>
          <p>
            Sélectionnez la famille pour laquelle créer une note de règlement.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <p>Chargement des familles...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            {families.map((family) => (
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
                  <p className="text-sm text-muted-foreground">
                    {family.address.city}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="flex gap-4 justify-end">
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
    </div>
  );
};
