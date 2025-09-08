import React from 'react';
import { useNDRWizard } from '../../../../../contexts/NDRWizardContext';
import './ProgressStepper.css';

export const ProgressStepper: React.FC = () => {
  const { state, goToStep } = useNDRWizard();

  const steps = [
    {
      number: 1,
      title: 'Client',
      description: 'Informations client',
      isValid: state.isValid.step1,
    },
    {
      number: 2,
      title: 'Bénéficiaires',
      description: 'Bénéficiaires et matières',
      isValid: state.isValid.step2,
    },
    {
      number: 3,
      title: 'Tarifs',
      description: 'Tarification',
      isValid: state.isValid.step3,
    },
  ];

  const getStepStatus = (stepNumber: number) => {
    if (stepNumber < state.currentStep) {
      return steps[stepNumber - 1].isValid ? 'completed' : 'error';
    }
    if (stepNumber === state.currentStep) {
      return 'active';
    }
    return 'pending';
  };

  const canClickStep = (stepNumber: number) => {
    // On peut cliquer sur les étapes précédentes ou l'étape actuelle
    return stepNumber <= state.currentStep;
  };

  return (
    <div className="progress-stepper">
      {steps.map((step, index) => {
        const status = getStepStatus(step.number);
        const isClickable = canClickStep(step.number);
        
        return (
          <div key={step.number} className="progress-stepper__step-container">
            {/* Ligne de connexion (sauf pour le dernier) */}
            {index < steps.length - 1 && (
              <div 
                className={`progress-stepper__line ${
                  status === 'completed' ? 'progress-stepper__line--completed' : ''
                }`}
              />
            )}
            
            {/* Étape */}
            <div
              className={`progress-stepper__step progress-stepper__step--${status} ${
                isClickable ? 'progress-stepper__step--clickable' : ''
              }`}
              onClick={() => isClickable && goToStep(step.number as 1 | 2 | 3)}
            >
              {/* Cercle avec numéro ou icône */}
              <div className="progress-stepper__circle">
                {status === 'completed' ? (
                  <svg className="progress-stepper__check" viewBox="0 0 20 20" fill="currentColor">
                    <path 
                      fillRule="evenodd" 
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                      clipRule="evenodd" 
                    />
                  </svg>
                ) : status === 'error' ? (
                  <svg className="progress-stepper__error" viewBox="0 0 20 20" fill="currentColor">
                    <path 
                      fillRule="evenodd" 
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" 
                      clipRule="evenodd" 
                    />
                  </svg>
                ) : (
                  step.number
                )}
              </div>
              
              {/* Texte */}
              <div className="progress-stepper__text">
                <div className="progress-stepper__title">{step.title}</div>
                <div className="progress-stepper__description">{step.description}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};