import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { BrowserRouter } from "react-router-dom";
import { Prospects } from "../src/pages/prospects/Prospects";

// Mock navigation
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

// Mock services
jest.mock("../src/services/familyService", () => ({
  familyService: {
    getFamilies: jest.fn(),
  },
}));

const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe("Prospect Add Student Flow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should navigate to wizard step 2 with correct parameters when clicking 'Ajouter un élève'", async () => {
    const { familyService } = require("../src/services/familyService");
    
    const mockProspect = {
      _id: "prospect123",
      familyName: "Dubois",
      primaryContact: {
        firstName: "Pierre",
        lastName: "Dubois",
      },
      demande: {
        beneficiaryType: "eleves",
        beneficiaryLevel: "3ème",
      },
      students: [], // Aucun élève
      status: "PROSPECT",
    };

    familyService.getFamilies.mockResolvedValue([mockProspect]);

    renderWithRouter(<Prospects />);

    await waitFor(() => {
      expect(screen.getByText("Pierre Dubois")).toBeInTheDocument();
    });

    // Chercher le bouton "Ajouter un élève"
    const addButton = screen.getByRole("button", { name: /ajouter un élève/i });
    expect(addButton).toBeInTheDocument();

    // Cliquer sur le bouton
    fireEvent.click(addButton);

    // Vérifier la navigation avec les bons paramètres
    expect(mockNavigate).toHaveBeenCalledWith(
      "/admin/dashboard/create/wizard?familyId=prospect123&returnTo=prospects&step=2"
    );
  });

  it("should not show 'Ajouter un élève' button when beneficiaryType is 'adulte'", async () => {
    const { familyService } = require("../src/services/familyService");
    
    const mockProspectAdulte = {
      _id: "prospect456",
      familyName: "Martin",
      primaryContact: {
        firstName: "Marie",
        lastName: "Martin",
      },
      demande: {
        beneficiaryType: "adulte",
      },
      students: [],
      status: "PROSPECT",
    };

    familyService.getFamilies.mockResolvedValue([mockProspectAdulte]);

    renderWithRouter(<Prospects />);

    await waitFor(() => {
      expect(screen.getByText("Marie Martin")).toBeInTheDocument();
    });

    // Le bouton ne doit pas être présent
    expect(screen.queryByRole("button", { name: /ajouter un élève/i })).not.toBeInTheDocument();
    
    // Vérifier qu'on affiche "Adulte" à la place
    expect(screen.getByText("Adulte")).toBeInTheDocument();
  });

  it("should not show 'Ajouter un élève' button when students already exist", async () => {
    const { familyService } = require("../src/services/familyService");
    
    const mockProspectWithStudents = {
      _id: "prospect789",
      familyName: "Dupont",
      primaryContact: {
        firstName: "Jean",
        lastName: "Dupont",
      },
      demande: {
        beneficiaryType: "eleves",
      },
      students: [
        { _id: "s1", firstName: "Emma", lastName: "Dupont" },
        { _id: "s2", firstName: "Lucas", lastName: "Dupont" }
      ],
      status: "PROSPECT",
    };

    familyService.getFamilies.mockResolvedValue([mockProspectWithStudents]);

    renderWithRouter(<Prospects />);

    await waitFor(() => {
      expect(screen.getByText("Jean Dupont")).toBeInTheDocument();
    });

    // Le bouton ne doit pas être présent
    expect(screen.queryByRole("button", { name: /ajouter un élève/i })).not.toBeInTheDocument();
    
    // Vérifier qu'on affiche les noms des élèves
    expect(screen.getByText("Emma Dupont, Lucas Dupont")).toBeInTheDocument();
  });
});