import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
import { PageHeader } from "../../components";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader } from "../../components/ui/card";
import { Label } from "../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import type { Coupon } from "../../types/coupon";
import { BookOpen, FileText, Eye, Download } from "lucide-react";

const MONTH_OPTIONS = [
  { value: 1, label: "Janvier" },
  { value: 2, label: "Février" },
  { value: 3, label: "Mars" },
  { value: 4, label: "Avril" },
  { value: 5, label: "Mai" },
  { value: 6, label: "Juin" },
  { value: 7, label: "Juillet" },
  { value: 8, label: "Août" },
  { value: 9, label: "Septembre" },
  { value: 10, label: "Octobre" },
  { value: 11, label: "Novembre" },
  { value: 12, label: "Décembre" },
];

// Composant interne pour la colonne Actions avec hover interactif
const ActionButtons: React.FC<{
  couponId: string;
  onView: (id: string) => void;
  onDownload: (id: string) => void;
  isLastRow?: boolean;
}> = ({ couponId, onView, onDownload, isLastRow = false }) => {
  const [isHovered, setIsHovered] = useState(false);

  // Déterminer la classe de positionnement du menu
  const menuPositionClass = isLastRow ? "bottom-full mb-1" : "top-full mt-1";

  return (
    <div className="flex items-center justify-center gap-2">
      {/* Bouton Book Open */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onView(couponId)}
        title="Voir le récapitulatif"
        className="h-8 w-8 p-0"
      >
        <BookOpen className="w-4 h-4" />
      </Button>

      {/* Conteneur du bouton File Text avec hover */}
      <div
        className="relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          title="Plus d'options"
        >
          <FileText className="w-4 h-4" />
        </Button>

        {/* Menu de hover */}
        {isHovered && (
          <div className={`absolute right-0 ${menuPositionClass} bg-white border border-gray-200 rounded-md shadow-lg z-10 whitespace-nowrap`}>
            <button
              onClick={() => {
                onView(couponId);
                setIsHovered(false);
              }}
              className="w-full px-3 py-2 text-sm text-left hover:bg-gray-100 flex items-center gap-2 border-b border-gray-200 last:border-b-0"
              title="Voir le PDF"
            >
              <Eye className="w-4 h-4" />
              Voir le PDF
            </button>
            <button
              onClick={() => {
                onDownload(couponId);
                setIsHovered(false);
              }}
              className="w-full px-3 py-2 text-sm text-left hover:bg-gray-100 flex items-center gap-2"
              title="Télécharger"
            >
              <Download className="w-4 h-4" />
              Télécharger
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export const Attestations: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab') || 'fiche-paie';
  const [activeTab, setActiveTab] = useState(tabFromUrl);
  const [payslips, setPayslips] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });

  // Générer les options d'années (3 dernières années)
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return [currentYear, currentYear - 1, currentYear - 2];
  }, []);

  // Synchroniser l'onglet actif avec l'URL
  useEffect(() => {
    const tab = searchParams.get('tab') || 'fiche-paie';
    setActiveTab(tab);
  }, [searchParams]);

  // Charger les coupons utilisés pour les fiches de paie
  useEffect(() => {
    const loadPayslips = async () => {
      try {
        setIsLoading(true);

        // TODO: Remplacer par l'appel API réel
        // const coupons = await couponService.getMyCouponsHistory({
        //   status: "used",
        // });

        // Données mockées pour visualiser les fiches de paie
        const mockPayslips: Coupon[] = [
          {
            _id: "1",
            code: "MATH-2025-001",
            status: "used",
            studentName: "Sophie Martin",
            familyName: "Famille Martin",
            subjectName: "Mathématiques",
            professorSalary: 45.00,
            updatedAt: new Date(2025, 9, 15).toISOString(),
            sessionData: {
              sessionDate: new Date(2025, 9, 15).toISOString(),
              sessionDuration: 2,
              sessionLocation: "home",
            },
          },
          {
            _id: "2",
            code: "PHYS-2025-002",
            status: "used",
            studentName: "Lucas Dubois",
            familyName: "Famille Dubois",
            subjectName: "Physique-Chimie",
            professorSalary: 50.00,
            updatedAt: new Date(2025, 9, 18).toISOString(),
            sessionData: {
              sessionDate: new Date(2025, 9, 18).toISOString(),
              sessionDuration: 1.5,
              sessionLocation: "professor",
            },
          },
        ];

        setPayslips(mockPayslips);
      } catch (error) {
        console.error("Erreur lors du chargement des coupons:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPayslips();
  }, []);

  // Filtrer les coupons par mois/année
  const filteredPayslips = useMemo(() => {
    return payslips
      .filter((coupon) => {
        if (!coupon.sessionData?.sessionDate) return false;
        const date = new Date(coupon.sessionData.sessionDate);
        return (
          date.getMonth() + 1 === filters.month &&
          date.getFullYear() === filters.year
        );
      })
      .sort((a, b) => {
        const dateA = new Date(a.sessionData!.sessionDate);
        const dateB = new Date(b.sessionData!.sessionDate);
        return dateB.getTime() - dateA.getTime();
      });
  }, [payslips, filters]);

  // Calculer le total à facturer
  const totalAmount = useMemo(() => {
    return filteredPayslips.reduce(
      (sum, coupon) => sum + (coupon.professorSalary || 0),
      0
    );
  }, [filteredPayslips]);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatAmount = (amount: number): string => {
    return `${amount.toFixed(2)} €`;
  };

  const handleView = async (couponId: string) => {
    console.log('Visualisation du récapitulatif:', couponId);
    alert('Fonctionnalité de visualisation à implémenter avec le backend');
  };

  const handleDownload = async (couponId: string) => {
    console.log('Téléchargement du récapitulatif:', couponId);
    alert('Fonctionnalité de téléchargement à implémenter avec le backend');
  };

  return (
    <>
      <PageHeader title="Attestations" />

      <div className="container mx-auto px-4 max-w-6xl py-8">
        <Tabs value={activeTab} onValueChange={(tab: string) => {
          setActiveTab(tab);
          navigate(`?tab=${tab}`, { replace: true });
        }} className="w-full">
          <TabsList className="bg-transparent border-b border-gray-200 rounded-none p-0 h-auto w-full justify-start">
            <TabsTrigger
              value="fiche-paie"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-3"
            >
              Fiche de paie
            </TabsTrigger>
            <TabsTrigger
              value="fiches-paie-groupees"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-3"
            >
              Fiches de paie groupées
            </TabsTrigger>
            <TabsTrigger
              value="certificat"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-3"
            >
              Certificat
            </TabsTrigger>
            <TabsTrigger
              value="france-travail"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-3"
            >
              Attestation France Travail
            </TabsTrigger>
            <TabsTrigger
              value="montant-facturer"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-3"
            >
              Montant à Facturer
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Fiche de paie */}
          <TabsContent value="fiche-paie" className="mt-6 space-y-8">
            {/* Filtres */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Filtrer par période</h3>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="month">Mois</Label>
                    <Select
                      value={filters.month.toString()}
                      onValueChange={(value: string) =>
                        setFilters((prev) => ({ ...prev, month: parseInt(value) }))
                      }
                    >
                      <SelectTrigger id="month">
                        <SelectValue placeholder="Sélectionner un mois" />
                      </SelectTrigger>
                      <SelectContent>
                        {MONTH_OPTIONS.map((month) => (
                          <SelectItem key={month.value} value={month.value.toString()}>
                            {month.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="year">Année</Label>
                    <Select
                      value={filters.year.toString()}
                      onValueChange={(value: string) =>
                        setFilters((prev) => ({ ...prev, year: parseInt(value) }))
                      }
                    >
                      <SelectTrigger id="year">
                        <SelectValue placeholder="Sélectionner une année" />
                      </SelectTrigger>
                      <SelectContent>
                        {yearOptions.map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Statistiques */}
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-sm text-muted-foreground">Nombre de cours</p>
                    <p className="text-2xl font-bold">{filteredPayslips.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Heures totales</p>
                    <p className="text-2xl font-bold">
                      {filteredPayslips.reduce(
                        (sum, c) => sum + (c.sessionData?.sessionDuration || 0),
                        0
                      )}
                      h
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Montant total</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatAmount(totalAmount)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tableau */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">
                  Cours effectués -{" "}
                  {MONTH_OPTIONS.find((m) => m.value === filters.month)?.label}{" "}
                  {filters.year}
                </h3>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p className="text-center text-muted-foreground py-8">
                    Chargement des données...
                  </p>
                ) : filteredPayslips.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Aucun cours effectué pour cette période.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Élève</TableHead>
                          <TableHead>Famille</TableHead>
                          <TableHead>Matière</TableHead>
                          <TableHead className="text-center">Heures</TableHead>
                          <TableHead className="text-right">Montant</TableHead>
                          <TableHead className="text-center">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredPayslips.map((coupon, index) => (
                          <TableRow key={coupon._id}>
                            <TableCell>
                              {coupon.sessionData?.sessionDate
                                ? formatDate(coupon.sessionData.sessionDate)
                                : "-"}
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">
                                {coupon.studentName || "-"}
                              </div>
                            </TableCell>
                            <TableCell>{coupon.familyName || "-"}</TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {coupon.subjectName || "-"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              {coupon.sessionData?.sessionDuration || 0}h
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              {formatAmount(coupon.professorSalary || 0)}
                            </TableCell>
                            <TableCell className="text-center">
                              <ActionButtons
                                couponId={coupon._id}
                                onView={handleView}
                                onDownload={handleDownload}
                                isLastRow={index >= filteredPayslips.length - 2}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {/* Total à facturer */}
                {filteredPayslips.length > 0 && (
                  <div className="mt-6 flex justify-end">
                    <div className="bg-muted px-6 py-4 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">
                        Montant à facturer
                      </p>
                      <p className="text-3xl font-bold text-green-600">
                        {formatAmount(totalAmount)}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 2: Fiches de paie groupées */}
          <TabsContent value="fiches-paie-groupees" className="mt-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12 text-gray-500">
                  <p className="text-lg font-semibold mb-2">Fonctionnalité en développement</p>
                  <p className="text-sm">
                    Cette section permettra de télécharger plusieurs fiches de paie groupées.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 3: Certificat */}
          <TabsContent value="certificat" className="mt-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12 text-gray-500">
                  <p className="text-lg font-semibold mb-2">Fonctionnalité en développement</p>
                  <p className="text-sm">
                    Cette section permettra de générer et télécharger un certificat de travail.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 4: Attestation France Travail */}
          <TabsContent value="france-travail" className="mt-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12 text-gray-500">
                  <p className="text-lg font-semibold mb-2">Fonctionnalité en développement</p>
                  <p className="text-sm">
                    Cette section permettra de générer une attestation France Travail (Pôle Emploi).
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 5: Montant à Facturer */}
          <TabsContent value="montant-facturer" className="mt-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12 text-gray-500">
                  <p className="text-lg font-semibold mb-2">Fonctionnalité en développement</p>
                  <p className="text-sm">
                    Cette section permettra de visualiser le montant total à facturer par période.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};
