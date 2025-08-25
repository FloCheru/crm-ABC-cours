import React from 'react';
import { useLocation } from 'react-router-dom';
import { Navbar, Breadcrumb, Container } from '../../../../components';
import { NDRWizardProvider, useNDRWizard } from '../../../../contexts/NDRWizardContext';
import { ProgressStepper } from './components/ProgressStepper';
import { Step1ClientSelection } from './Step1ClientSelection';
import { Step2StudentsSubjects } from './Step2StudentsSubjects'; 
import { Step3RatesValidation } from './Step3RatesValidation';
import './NDRCreationWizard.css';

const NDRWizardContent: React.FC = () => {
  const { state } = useNDRWizard();
  const location = useLocation();

  const renderCurrentStep = () => {
    switch (state.currentStep) {
      case 1:
        return <Step1ClientSelection />;
      case 2:
        return <Step2StudentsSubjects />;
      case 3:
        return <Step3RatesValidation />;
      default:
        return <Step1ClientSelection />;
    }
  };

  const getStepTitle = () => {
    switch (state.currentStep) {
      case 1:
        return 'Étape 1 : Informations Client';
      case 2:
        return 'Étape 2 : Bénéficiaires et Matières';
      case 3:
        return 'Étape 3 : Tarification et Validation';
      default:
        return 'Création NDR';
    }
  };

  return (
    <div>
      <Navbar activePath={location.pathname} />
      <Breadcrumb 
        items={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Création NDR', href: '/admin/dashboard/create/wizard' },
          { label: getStepTitle().split(' : ')[1], href: '#' }
        ]} 
      />
      
      <Container layout="flex-col">
        <div className="ndr-wizard">
          {/* En-tête avec indicateur de progression */}
          <div className="ndr-wizard__header">
            <h1 className="ndr-wizard__title">
              Création d'une Note de Règlement
            </h1>
            <ProgressStepper />
          </div>

          {/* Contenu de l'étape courante */}
          <div className="ndr-wizard__content">
            <h2 className="ndr-wizard__step-title">
              {getStepTitle()}
            </h2>
            
            {renderCurrentStep()}
          </div>
        </div>
      </Container>
    </div>
  );
};

export const NDRCreationWizard: React.FC = () => {
  return (
    <NDRWizardProvider>
      <NDRWizardContent />
    </NDRWizardProvider>
  );
};