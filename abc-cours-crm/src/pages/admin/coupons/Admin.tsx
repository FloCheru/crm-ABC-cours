import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Navbar,
  Breadcrumb,
  Container,
  SummaryCard,
  ButtonGroup,
  Input,
  Button,
  Table,
} from "../../../components";

export const Admin: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleCreateSeries = () => {
    navigate("/admin/coupons/create");
  };

  const couponsColumns = [
    {
      key: "name",
      label: "Nom de la série",
      width: "20%",
    },
    {
      key: "totalCoupons",
      label: "Total coupons",
      width: "12%",
    },
    {
      key: "utilises",
      label: "Utilisés",
      width: "12%",
    },
    {
      key: "restants",
      label: "Restants",
      width: "12%",
    },
    {
      key: "montantTotal",
      label: "Montant total",
      width: "15%",
    },
    {
      key: "statut",
      label: "Statut",
      width: "12%",
    },
    {
      key: "actions",
      label: "Actions",
      width: "17%",
      render: (_: unknown, row: { id: number }) => (
        <div className="table__actions">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => console.log("Modifier", row.id)}
          >
            Modifier
          </Button>
          <Button
            size="sm"
            variant="error"
            onClick={() => console.log("Supprimer", row.id)}
          >
            Supprimer
          </Button>
        </div>
      ),
    },
  ];
  const couponsData = [
    {
      id: 1,
      name: "Martin_Janvier_2025",
      totalCoupons: 50,
      utilises: 20,
      restants: 30,
      montantTotal: "2,000 €",
      statut: "active",
    },
    {
      id: 2,
      name: "Martin_Janvier_2025",
      totalCoupons: 50,
      utilises: 20,
      restants: 30,
      montantTotal: "2,000 €",
      statut: "active",
    },
    {
      id: 3,
      name: "Martin_Janvier_2025",
      totalCoupons: 50,
      utilises: 20,
      restants: 30,
      montantTotal: "2,000 €",
      statut: "active",
    },
    {
      id: 4,
      name: "Martin_Janvier_2025",
      totalCoupons: 50,
      utilises: 20,
      restants: 30,
      montantTotal: "2,000 €",
      statut: "active",
    },
    {
      id: 5,
      name: "Martin_Janvier_2025",
      totalCoupons: 50,
      utilises: 20,
      restants: 30,
      montantTotal: "2,000 €",
      statut: "active",
    },
  ];
  return (
    <div>
      <Navbar activePath={location.pathname} />
      <Breadcrumb
        items={[
          { label: "Admin", href: "/admin" },
          { label: "Coupons", href: "/admin/coupons" },
        ]}
      />
      <Container layout="flex-col">
        <h1>Gestion des coupons</h1>
        <Container layout="grid" padding="none">
          <SummaryCard
            title="Nombre de coupons"
            metrics={[
              { value: 100, label: "Total", variant: "primary" },
              { value: 10, label: "Valides", variant: "success" },
            ]}
          />
          <SummaryCard
            title="Nombre de coupons"
            metrics={[
              { value: 100, label: "Total", variant: "primary" },
              { value: 10, label: "Valides", variant: "success" },
            ]}
          />
        </Container>
        <Container layout="grid">
          <ButtonGroup
            variant="triple"
            buttons={[
              {
                text: "Créer une nouvelle série",
                variant: "primary",
                onClick: handleCreateSeries,
              },
              { text: "Modifier les coupons", variant: "secondary" },
              { text: "Saisir un coupon", variant: "secondary" },
            ]}
          />
          <ButtonGroup
            variant="double"
            buttons={[
              { text: "Bloquer un coupon", variant: "error" },
              { text: "Exporter", variant: "secondary" },
            ]}
          />
        </Container>
        <Container layout="flex">
          <Input
            placeholder="Rechercher par nom de série, famille, date..."
            button={<Button variant="primary">Appliquer</Button>}
          />
          <ButtonGroup
            variant="double"
            buttons={[
              { text: "Filtrer", variant: "outline" },
              { text: "Réinitialiser", variant: "outline" },
            ]}
          />
        </Container>
        <Container layout="flex-col">
          <h3>Liste des séries de coupons</h3>
          <Table columns={couponsColumns} data={couponsData} />
        </Container>
      </Container>
    </div>
  );
};
