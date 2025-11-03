import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Check, ChevronsUpDown } from "lucide-react";
import { toast } from "sonner";
import { ndrService } from "../../../../services/ndrService";
import { PageHeader, Container, Button } from "../../../../components";
import { Input } from "../../../../components/ui/input";
import { Switch } from "../../../../components/ui/switch";
import { Label } from "../../../../components/ui/label";
import { ErrorMessage } from "../../../../components/ui/error-message";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../../components/ui/table";
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

  const deadlinesNumbers = Array.from({ length: 12 }, (_, i) => ({
    value: (i + 1).toString(),
    label: `${i + 1} échéance${i + 1 > 1 ? 's' : ''}`,
  }));

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
    deadlineDates: [] as { date: string; amount: number }[],
  });

  // États pour les Combobox
  const [comboboxStates, setComboboxStates] = useState({
    paymentMethod: false,
    paymentType: false,
    deadlinesNumber: false,
    deadlinesDay: false,
  });

  // États pour les erreurs de validation
  const [validationErrors, setValidationErrors] = useState({
    hourlyRate: "",
    quantity: "",
    charges: "",
    paymentMethod: "",
    paymentType: "",
    deadlines: "",
  });

  useEffect(() => {
    const ndrData = localStorage.getItem("ndrData");
    if (ndrData) {
      console.log("ndrData dans PricingPayment:", JSON.parse(ndrData));
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

  const handleDeadlinesNumberChange = (numStr: string) => {
    const num = parseInt(numStr);
    updateFormData("deadlinesNumber", numStr);

    // Calculer le montant par échéance
    const amountPerDeadline = calculateDeadlineAmount(num);

    // Réinitialiser les dates avec le bon nombre d'échéances
    const newDates = Array.from({ length: num }, () => ({
      date: "",
      amount: Math.round(amountPerDeadline * 100) / 100, // Arrondir à 2 décimales
    }));
    setFormData((prev) => ({ ...prev, deadlineDates: newDates }));
  };

  const handleDeadlineChange = (index: number, field: "date" | "amount", value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      deadlineDates: prev.deadlineDates.map((deadline, i) =>
        i === index ? { ...deadline, [field]: value } : deadline
      ),
    }));
  };

  const calculateDeadlineAmount = (numDeadlines: number): number => {
    const baseTotalAmount = formData.hourlyRate * formData.quantity;
    return numDeadlines > 0 ? baseTotalAmount / numDeadlines : 0;
  };

  const validateForm = () => {
    const errors = {
      hourlyRate: "",
      quantity: "",
      charges: "",
      paymentMethod: "",
      paymentType: "",
      deadlines: "",
    };

    // Validation Tarification - champs individuels
    if (formData.hourlyRate <= 0) {
      errors.hourlyRate = "Tarif horaire requis";
    }

    if (formData.quantity <= 0) {
      errors.quantity = "Quantité requise";
    }

    if (formData.charges < 0) {
      errors.charges = "Frais ne peuvent pas être négatifs";
    }

    // Validation Mode de paiement
    if (!formData.paymentMethod) {
      errors.paymentMethod = "Méthode de paiement requise";
    } else if (!formData.paymentType) {
      errors.paymentType = "Type de paiement requis";
    }

    // Validation Échéances
    if (formData.hasDeadlines) {
      const incompleteCount = formData.deadlineDates.filter(
        (d) => !d.date || d.amount <= 0
      ).length;

      if (incompleteCount > 0) {
        errors.deadlines = `${incompleteCount} échéance${incompleteCount > 1 ? 's' : ''} incomplète${incompleteCount > 1 ? 's' : ''}. Veuillez remplir toutes les dates et montants, ou désactiver les échéances.`;
      }
    }

    setValidationErrors(errors);
    return Object.values(errors).every((error) => !error);
  };

  const handleFinish = async () => {
    if (!validateForm()) {
      toast.error("Veuillez corriger les erreurs avant de continuer");
      return;
    }

    // Récupérer les données NDR existantes
    const existingNdrData = localStorage.getItem("ndrData");
    let ndrData: any = {};

    if (existingNdrData) {
      ndrData = JSON.parse(existingNdrData);
    }

    // Filtrer les deadlines incomplètes avant envoi
    const completedDeadlines =
      formData.hasDeadlines && formData.deadlineDates.length > 0
        ? formData.deadlineDates.filter((d) => d.date && d.amount > 0)
        : [];

    // Compléter avec les données de tarification
    // IMPORTANT: Exclure explicitement l'ancien deadlines du spread
    const { deadlines: _, ...cleanNdrData } = ndrData;

    const completedNdrData = {
      ...cleanNdrData,
      paymentMethod: formData.paymentMethod,
      paymentType: formData.paymentType,
      hourlyRate: formData.hourlyRate,
      quantity: formData.quantity,
      charges: formData.charges,
      notes: formData.notes || undefined,
      deadlines:
        formData.hasDeadlines && completedDeadlines.length > 0
          ? completedDeadlines
          : undefined,
    };
    try {
      const createdNdr = await ndrService.createNDR(completedNdrData);

      // Nettoyer localStorage après succès
      localStorage.removeItem("ndrData");
      localStorage.removeItem("selectedFamily");

      toast.success("NDR créée avec succès");

      // Rediriger vers NdrDetails avec la nouvelle NDR
      navigate(`/admin/ndrs/${createdNdr._id}`);
    } catch (error) {
      console.error("Erreur lors de la création de la NDR:", error);
      toast.error("Erreur lors de la création de la NDR. Veuillez réessayer.");
    }
  };

  const handleBack = () => {
    navigate("/admin/beneficiaries-subjects");
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
              <ErrorMessage>{validationErrors.hourlyRate}</ErrorMessage>
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
              <ErrorMessage>{validationErrors.quantity}</ErrorMessage>
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
              <ErrorMessage>{validationErrors.charges}</ErrorMessage>
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
              <ErrorMessage>{validationErrors.paymentMethod}</ErrorMessage>
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
              <ErrorMessage>{validationErrors.paymentType}</ErrorMessage>
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
            <>
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
                                  handleDeadlinesNumberChange(num.value);
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

              {/* Tableau des dates d'échéances */}
              {formData.deadlinesNumber && formData.deadlineDates.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-md font-semibold mb-4">Dates d'échéances</h4>
                  <Table className="border">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">Échéance</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Montant (€)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {formData.deadlineDates.map((deadline, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{index + 1}</TableCell>
                          <TableCell>
                            <Input
                              type="date"
                              value={deadline.date}
                              min={new Date().toISOString().split("T")[0]}
                              onChange={(e) =>
                                handleDeadlineChange(index, "date", e.target.value)
                              }
                              className="w-full"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="0.00"
                              value={deadline.amount || ""}
                              onChange={(e) =>
                                handleDeadlineChange(
                                  index,
                                  "amount",
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="w-full"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <ErrorMessage>{validationErrors.deadlines}</ErrorMessage>
                </div>
              )}
            </>
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
          >
            Créer NDR
          </Button>
        </div>
      </Container>
    </div>
  );
};
