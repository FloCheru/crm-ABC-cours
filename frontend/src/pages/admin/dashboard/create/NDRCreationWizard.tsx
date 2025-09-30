import React, { useState, useEffect } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { Navbar, PageHeader, Container } from "../../../../components";
import { Step1ClientSelection } from "./Step1ClientSelection";
import { Step2StudentsSubjects } from "./Step2StudentsSubjects";
import { Step3RatesValidation } from "./Step3RatesValidation";
import type { Family } from "../../../../types/family";
import "./NDRCreationWizard.css";

// Interface pour les données NDR
interface NDRData {
  // Step 1
  familyId: string;
  // Step 2
  studentIds: string[];
  adult: boolean;
  subjects: string[];
  // Step 3
  paymentMethod: "card" | "CESU" | "check" | "transfer" | "cash" | "PRLV";
  paymentType: "avance" | "credit";
  deadlines?: {
    deadlinesNumber: number;
    deadlinesDay: number;
  };
  hourlyRate: number;
  quantity: number;
  charges: number;
  status: string;
  notes: string;
}

export const NDRCreationWizard: React.FC = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // État simple pour les données NDR
  const [ndrData, setNdrData] = useState<Partial<NDRData>>({});
  const [currentStep, setCurrentStep] = useState(1);
  const [returnContext, setReturnContext] = useState<string>("");
  const [familyData, setFamilyData] = useState<Family | null>(null);

  // Lire les paramètres URL
  useEffect(() => {
    const returnTo = searchParams.get("returnTo");
    const familyId = searchParams.get("familyId");
    const step = searchParams.get("step");

    if (returnTo) {
      setReturnContext(returnTo);
    }

    if (familyId) {
      setNdrData((prev) => ({ ...prev, familyId }));
    }

    if (familyId && step === "2") {
      setCurrentStep(2);
    }
  }, [searchParams]);

  // Fonctions de navigation
  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const previousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const updateNdrData = (updates: Partial<NDRData>) => {
    setNdrData((prev) => ({ ...prev, ...updates }));
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1ClientSelection
            ndrData={ndrData}
            updateNdrData={updateNdrData}
            setFamilyData={setFamilyData}
            nextStep={nextStep}
          />
        );
      case 2:
        return (
          <Step2StudentsSubjects
            ndrData={ndrData}
            updateNdrData={updateNdrData}
            familyData={familyData}
            nextStep={nextStep}
            previousStep={previousStep}
            returnContext={returnContext}
          />
        );
      case 3:
        return (
          <Step3RatesValidation
            ndrData={ndrData}
            updateNdrData={updateNdrData}
            previousStep={previousStep}
          />
        );
      default:
        return (
          <Step1ClientSelection
            ndrData={ndrData}
            updateNdrData={updateNdrData}
            setFamilyData={setFamilyData}
            nextStep={nextStep}
          />
        );
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return "Étape 1 : Informations Client";
      case 2:
        return "Étape 2 : Bénéficiaires et Matières";
      case 3:
        return "Étape 3 : Tarification et Validation";
      default:
        return "Création NDR";
    }
  };

  return (
    <div>
      <Navbar activePath={location.pathname} />
      <PageHeader
        title="Créer une note de règlement"
        breadcrumb={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Créer NDR" },
        ]}
        backButton={{ label: "Retour au dashboard", href: "/admin/dashboard" }}
      />

      <Container layout="flex-col">
        <div className="ndr-wizard">
          {/* En-tête avec indicateur de progression simple
          <div className="ndr-wizard__header">
            <div className="ndr-wizard__steps">
              <div className={`ndr-wizard__step ${currentStep >= 1 ? 'active' : ''}`}>1</div>
              <div className={`ndr-wizard__step ${currentStep >= 2 ? 'active' : ''}`}>2</div>
              <div className={`ndr-wizard__step ${currentStep >= 3 ? 'active' : ''}`}>3</div>
            </div>
          </div> */}

          {/* Contenu de l'étape courante */}
          <div className="ndr-wizard__content">
            <h2 className="ndr-wizard__step-title">{getStepTitle()}</h2>

            {renderCurrentStep()}
          </div>
        </div>
      </Container>
    </div>
  );
};
