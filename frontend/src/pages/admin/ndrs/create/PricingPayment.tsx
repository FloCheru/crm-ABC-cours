import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Check, ChevronsUpDown } from "lucide-react";
import { ndrService } from "../../../../services/ndrService";
import { PageHeader, Container, Button } from "../../../../components";
import { Input } from "../../../../components/ui/input";
import { Switch } from "../../../../components/ui/switch";
import { Label } from "../../../../components/ui/label";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../../../../components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../../../components/ui/popover";
import { cn } from "../../../../lib/utils";

export const PricingPayment: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  searchParams.get("from");

  // Options pour les Combobox
  const paymentMethods = [
    { value: "card", label: "Carte bancaire" },
    { value: "CESU", label: "CESU" },
    { value: "check", label: "Chèque" },
    { value: "transfer", label: "Virement" },
    { value: "cash", label: "Espèces" },
    { value: "PRLV", label: "Prélèvement" },
  ];

  const paymentTypes = [
    { value: "avance", label: "Avance" },
    { value: "credit", label: "Crédit" },
  ];

  const deadlinesNumbers = [
    { value: "1", label: "1 échéance" },
    { value: "2", label: "2 échéances" },
    { value: "3", label: "3 échéances" },
    { value: "4", label: "4 échéances" },
    { value: "6", label: "6 échéances" },
    { value: "12", label: "12 échéances" },
  ];

  const deadlinesDays = Array.from({ length: 28 }, (_, i) => ({
    value: (i + 1).toString(),
    label: `${i + 1} du mois`,
  }));

  // États pour le formulaire
  const [formData, setFormData] = useState({
    paymentMethod: "",
    paymentType: "",
    hourlyRate: 0,
    quantity: 0,
    charges: 0,
    notes: "",
    hasDeadlines: false,
    deadlinesNumber: "",
    deadlinesDay: "",
  });

  // États pour les Combobox
  const [comboboxStates, setComboboxStates] = useState({
    paymentMethod: false,
    paymentType: false,
    deadlinesNumber: false,
    deadlinesDay: false,
  });

  useEffect(() => {
    const ndrData = localStorage.getItem("ndrData");
    const from = localStorage.getItem("from");
    if (ndrData) {
      console.log("ndrData dans PricingPayment:", JSON.parse(ndrData));
      console.log("from dans PricingPayment:", from);
    } else {
      console.log("Aucune ndrData trouvée dans localStorage");
    }
  }, []);

  const toggleCombobox = (comboboxName: keyof typeof comboboxStates) => {
    setComboboxStates((prev) => ({
      ...prev,
      [comboboxName]: !prev[comboboxName],
    }));
  };

  const updateFormData = (field: string, value: string | number | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const isFormValid = () => {
    return (
      formData.paymentMethod &&
      formData.paymentType &&
      formData.hourlyRate > 0 &&
      formData.quantity > 0 &&
      formData.charges >= 0
    );
  };

  const handleFinish = async () => {
    if (!isFormValid()) {
      alert("Veuillez remplir tous les champs obligatoires");
      return;
    }

    // Récupérer les données NDR existantes
    const existingNdrData = localStorage.getItem("ndrData");
    let ndrData: any = {};

    if (existingNdrData) {
      ndrData = JSON.parse(existingNdrData);
    }

    // Compléter avec les données de tarification
    const completedNdrData = {
      ...ndrData,
      paymentMethod: formData.paymentMethod,
      paymentType: formData.paymentType,
      hourlyRate: formData.hourlyRate,
      quantity: formData.quantity,
      charges: formData.charges,
      notes: formData.notes || undefined,
      deadlines: formData.hasDeadlines
        ? {
            deadlinesNumber: parseInt(formData.deadlinesNumber),
            deadlinesDay: parseInt(formData.deadlinesDay),
          }
        : undefined,
    };
    console.log("completedNdrData", completedNdrData);
    try {
      await ndrService.createNDR(completedNdrData);

      // Récupérer l'origine avant de nettoyer localStorage
      const from = localStorage.getItem("from") || "prospects";

      // Nettoyer localStorage après succès
      localStorage.removeItem("ndrData");
      localStorage.removeItem("from");

      // Retourner à la page d'origine
      navigate(from === "ndrs" ? "/ndrs" : "/clients");
    } catch (error) {
      console.error("Erreur lors de la création de la NDR:", error);
      alert("Erreur lors de la création de la NDR. Veuillez réessayer.");
    }
  };

  const handleBack = () => {
    const from = localStorage.getItem("from") || "prospects";
    navigate(`/admin/beneficiaries-subjects?from=${from}`);
  };

  return (
    <div>
      <PageHeader title="Tarification et mode de paiement" />
      <Container layout="flex-col">
        <div className="mb-4">
          <h2>Étape 3 : Tarification et mode de paiement</h2>
        </div>

        {/* Section Tarification */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">Tarification</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="hourlyRate">Tarif horaire (€) *</Label>
              <Input
                id="hourlyRate"
                type="number"
                min="0"
                step="0.01"
                placeholder="25.00"
                value={formData.hourlyRate || ""}
                onChange={(e) =>
                  updateFormData("hourlyRate", parseFloat(e.target.value) || 0)
                }
              />
            </div>
            <div>
              <Label htmlFor="quantity">Quantité (heures) *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                placeholder="10"
                value={formData.quantity || ""}
                onChange={(e) =>
                  updateFormData("quantity", parseInt(e.target.value) || 0)
                }
              />
            </div>
            <div>
              <Label htmlFor="charges">Frais supplémentaires (€) *</Label>
              <Input
                id="charges"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={formData.charges || ""}
                onChange={(e) =>
                  updateFormData("charges", parseFloat(e.target.value) || 0)
                }
              />
            </div>
          </div>
        </div>

        {/* Section Mode de paiement */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">Mode de paiement</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Méthode de paiement *</Label>
              <Popover
                open={comboboxStates.paymentMethod}
                onOpenChange={() => toggleCombobox("paymentMethod")}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={comboboxStates.paymentMethod}
                    className="w-full justify-between"
                  >
                    {formData.paymentMethod
                      ? paymentMethods.find(
                          (method) => method.value === formData.paymentMethod
                        )?.label
                      : "Sélectionner..."}
                    <ChevronsUpDown className="opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Rechercher..." />
                    <CommandList>
                      <CommandEmpty>Aucune méthode trouvée.</CommandEmpty>
                      <CommandGroup>
                        {paymentMethods.map((method) => (
                          <CommandItem
                            key={method.value}
                            value={method.value}
                            onSelect={() => {
                              updateFormData("paymentMethod", method.value);
                              toggleCombobox("paymentMethod");
                            }}
                          >
                            {method.label}
                            <Check
                              className={cn(
                                "ml-auto",
                                formData.paymentMethod === method.value
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label>Type de paiement *</Label>
              <Popover
                open={comboboxStates.paymentType}
                onOpenChange={() => toggleCombobox("paymentType")}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={comboboxStates.paymentType}
                    className="w-full justify-between"
                  >
                    {formData.paymentType
                      ? paymentTypes.find(
                          (type) => type.value === formData.paymentType
                        )?.label
                      : "Sélectionner..."}
                    <ChevronsUpDown className="opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Rechercher..." />
                    <CommandList>
                      <CommandEmpty>Aucun type trouvé.</CommandEmpty>
                      <CommandGroup>
                        {paymentTypes.map((type) => (
                          <CommandItem
                            key={type.value}
                            value={type.value}
                            onSelect={() => {
                              updateFormData("paymentType", type.value);
                              toggleCombobox("paymentType");
                            }}
                          >
                            {type.label}
                            <Check
                              className={cn(
                                "ml-auto",
                                formData.paymentType === type.value
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        {/* Section Échéances */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">Échéances</h3>
          <div className="flex items-center space-x-2 mb-4">
            <Switch
              id="hasDeadlines"
              checked={formData.hasDeadlines}
              onCheckedChange={(checked: boolean) =>
                updateFormData("hasDeadlines", checked)
              }
            />
            <Label htmlFor="hasDeadlines">
              Paiement en plusieurs échéances
            </Label>
          </div>

          {formData.hasDeadlines && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Nombre d'échéances</Label>
                <Popover
                  open={comboboxStates.deadlinesNumber}
                  onOpenChange={() => toggleCombobox("deadlinesNumber")}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={comboboxStates.deadlinesNumber}
                      className="w-full justify-between"
                    >
                      {formData.deadlinesNumber
                        ? deadlinesNumbers.find(
                            (num) => num.value === formData.deadlinesNumber
                          )?.label
                        : "Sélectionner..."}
                      <ChevronsUpDown className="opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandList>
                        <CommandEmpty>Aucun nombre trouvé.</CommandEmpty>
                        <CommandGroup>
                          {deadlinesNumbers.map((num) => (
                            <CommandItem
                              key={num.value}
                              value={num.value}
                              onSelect={() => {
                                updateFormData("deadlinesNumber", num.value);
                                toggleCombobox("deadlinesNumber");
                              }}
                            >
                              {num.label}
                              <Check
                                className={cn(
                                  "ml-auto",
                                  formData.deadlinesNumber === num.value
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label>Jour de prélèvement</Label>
                <Popover
                  open={comboboxStates.deadlinesDay}
                  onOpenChange={() => toggleCombobox("deadlinesDay")}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={comboboxStates.deadlinesDay}
                      className="w-full justify-between"
                    >
                      {formData.deadlinesDay
                        ? deadlinesDays.find(
                            (day) => day.value === formData.deadlinesDay
                          )?.label
                        : "Sélectionner..."}
                      <ChevronsUpDown className="opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Rechercher un jour..." />
                      <CommandList>
                        <CommandEmpty>Aucun jour trouvé.</CommandEmpty>
                        <CommandGroup>
                          {deadlinesDays.map((day) => (
                            <CommandItem
                              key={day.value}
                              value={day.value}
                              onSelect={() => {
                                updateFormData("deadlinesDay", day.value);
                                toggleCombobox("deadlinesDay");
                              }}
                            >
                              {day.label}
                              <Check
                                className={cn(
                                  "ml-auto",
                                  formData.deadlinesDay === day.value
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}
        </div>

        {/* Section Notes */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">Notes</h3>
          <div>
            <Label htmlFor="notes">Commentaires</Label>
            <Input
              id="notes"
              placeholder="Notes supplémentaires..."
              value={formData.notes}
              onChange={(e) => updateFormData("notes", e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-4 justify-between">
          <Button variant="outline" onClick={handleBack}>
            Retour
          </Button>
          <Button
            variant="primary"
            onClick={handleFinish}
            disabled={!isFormValid()}
          >
            Créer NDR
          </Button>
        </div>
      </Container>
    </div>
  );
};
