import React, { useState, useEffect, useMemo } from "react";
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
import { couponService } from "../../services/couponService";
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

export const FichePaie: React.FC = () => {
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

  // Charger les coupons utilisés
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
            sessionData: {
              sessionDate: new Date(2025, 9, 15).toISOString(), // 15 octobre 2025
              sessionDuration: 2,
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
            sessionData: {
              sessionDate: new Date(2025, 9, 18).toISOString(), // 18 octobre 2025
              sessionDuration: 1.5,
            },
          },
          {
            _id: "3",
            code: "FR-2025-003",
            status: "used",
            studentName: "Emma Leroy",
            familyName: "Famille Leroy",
            subjectName: "Français",
            professorSalary: 40.00,
            sessionData: {
              sessionDate: new Date(2025, 9, 20).toISOString(), // 20 octobre 2025
              sessionDuration: 2,
            },
          },
          {
            _id: "4",
            code: "MATH-2025-004",
            status: "used",
            studentName: "Thomas Bernard",
            familyName: "Famille Bernard",
            subjectName: "Mathématiques",
            professorSalary: 60.00,
            sessionData: {
              sessionDate: new Date(2025, 9, 22).toISOString(), // 22 octobre 2025
              sessionDuration: 2,
            },
          },
          {
            _id: "5",
            code: "ANG-2025-005",
            status: "used",
            studentName: "Léa Petit",
            familyName: "Famille Petit",
            subjectName: "Anglais",
            professorSalary: 35.00,
            sessionData: {
              sessionDate: new Date(2025, 9, 25).toISOString(), // 25 octobre 2025
              sessionDuration: 1,
            },
          },
          {
            _id: "6",
            code: "MATH-2025-006",
            status: "used",
            studentName: "Sophie Martin",
            familyName: "Famille Martin",
            subjectName: "Mathématiques",
            professorSalary: 45.00,
            sessionData: {
              sessionDate: new Date(2025, 8, 12).toISOString(), // 12 septembre 2025
              sessionDuration: 2,
            },
          },
          {
            _id: "7",
            code: "SVT-2025-007",
            status: "used",
            studentName: "Jules Moreau",
            familyName: "Famille Moreau",
            subjectName: "SVT",
            professorSalary: 42.00,
            sessionData: {
              sessionDate: new Date(2025, 8, 18).toISOString(), // 18 septembre 2025
              sessionDuration: 1.5,
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
        // Tri par date décroissante (plus récent en haut)
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

  // Formater la date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Formater le montant
  const formatAmount = (amount: number): string => {
    return `${amount.toFixed(2)} €`;
  };

  // Afficher le récapitulatif / PDF
  const handleView = async (couponId: string) => {
    try {
      // TODO: Remplacer par l'appel API réel
      // const blob = await couponService.downloadPayslip(couponId);
      // const url = window.URL.createObjectURL(blob);
      // window.open(url, '_blank');
      // window.URL.revokeObjectURL(url);

      console.log('Visualisation du récapitulatif:', couponId);
      alert('Fonctionnalité de visualisation à implémenter avec le backend');
    } catch (err) {
      console.error('Erreur lors de la visualisation:', err);
      alert('Erreur lors de la visualisation du récapitulatif');
    }
  };

  // Télécharger le PDF
  const handleDownload = async (couponId: string) => {
    try {
      // TODO: Remplacer par l'appel API réel
      // const blob = await couponService.downloadPayslip(couponId);
      // const url = window.URL.createObjectURL(blob);
      // const a = document.createElement('a');
      // a.href = url;
      // a.download = `fiche-paie-${couponId}.pdf`;
      // document.body.appendChild(a);
      // a.click();
      // window.URL.revokeObjectURL(url);
      // document.body.removeChild(a);

      console.log('Téléchargement du récapitulatif:', couponId);
      alert('Fonctionnalité de téléchargement à implémenter avec le backend');
    } catch (err) {
      console.error('Erreur lors du téléchargement:', err);
      alert('Erreur lors du téléchargement du récapitulatif');
    }
  };

  return (
    <>
      <PageHeader title="Fiche de Paie" />
      <div className="px-4 py-8 w-full space-y-8">
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
                  onValueChange={(value) =>
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
                  onValueChange={(value) =>
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
      </div>
    </>
  );
};
