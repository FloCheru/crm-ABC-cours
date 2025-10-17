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
        const coupons = await couponService.getMyCouponsHistory({
          status: "used",
        });
        setPayslips(coupons);
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
                    {filteredPayslips.map((coupon) => (
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
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled
                            title="Disponible prochainement"
                          >
                            Récapitulatif
                          </Button>
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
