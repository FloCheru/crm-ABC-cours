import React, { useState, useEffect } from 'react';
import { Button, FormCard } from '../../../../components';
import { familyService } from '../../../../services/familyService';
import type { Family } from '../../../../types/family';
import './Step1ClientSelection.css';

interface Props {
  ndrData: any;
  updateNdrData: (updates: any) => void;
  setFamilyData: (family: Family | null) => void;
  nextStep: () => void;
}

export const Step1ClientSelection: React.FC<Props> = ({
  ndrData,
  updateNdrData,
  setFamilyData,
  nextStep
}) => {
  const [families, setFamilies] = useState<Family[]>([]);
  const [selectedFamily, setSelectedFamily] = useState<Family | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Charger les familles au montage
  useEffect(() => {
    const loadFamilies = async () => {
      try {
        setIsLoading(true);
        const familiesData = await familyService.getFamilies();
        setFamilies(familiesData);

        // Si un familyId est déjà dans ndrData, le pré-sélectionner
        if (ndrData.familyId) {
          const family = familiesData.find(f => f._id === ndrData.familyId);
          if (family) {
            setSelectedFamily(family);
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement des familles:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadFamilies();
  }, [ndrData.familyId]);

  const handleFamilySelect = (family: Family) => {
    setSelectedFamily(family);
    updateNdrData({
      familyId: family._id
    });
    setFamilyData(family);
  };

  const handleNext = () => {
    if (!selectedFamily) {
      alert('Veuillez sélectionner une famille');
      return;
    }
    nextStep();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'prospect': return 'text-blue-600 bg-blue-100';
      case 'client': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (isLoading) {
    return (
      <div className="step1__loading">
        <div className="step1__loading-text">Chargement des familles...</div>
      </div>
    );
  }

  return (
    <div className="step1-client-selection">
      {/* Sélection de la famille */}
      <FormCard title="Sélection du client" className="step1__family-selection">
        <div className="step1__families-grid">
          {families.map((family) => (
            <div
              key={family._id}
              className={`step1__family-card ${
                selectedFamily?._id === family._id ? 'step1__family-card--selected' : ''
              }`}
              onClick={() => handleFamilySelect(family)}
            >
              <div className="step1__family-header">
                <h4 className="step1__family-name">
                  {family.primaryContact.firstName} {family.primaryContact.lastName}
                </h4>
                <span className={`step1__family-status ${getStatusColor(family.status)}`}>
                  {family.status}
                </span>
              </div>

              <div className="step1__family-details">
                <div className="step1__family-contact">
                  📧 {family.primaryContact.email}
                </div>
                <div className="step1__family-contact">
                  📞 {family.primaryContact.primaryPhone}
                </div>
                <div className="step1__family-address">
                  🏠 {family.address.city}, {family.address.postalCode}
                </div>
              </div>
            </div>
          ))}
        </div>
      </FormCard>

      {/* Confirmation sélection */}
      {selectedFamily && (
        <FormCard title="Client sélectionné" className="step1__selected-family">
          <div className="step1__selected-info">
            <h4>{selectedFamily.primaryContact.firstName} {selectedFamily.primaryContact.lastName}</h4>
            <p>📧 {selectedFamily.primaryContact.email}</p>
            <p>📞 {selectedFamily.primaryContact.primaryPhone}</p>
            <p>🏠 {selectedFamily.address.street}, {selectedFamily.address.city} {selectedFamily.address.postalCode}</p>
          </div>
        </FormCard>
      )}

      {/* Navigation */}
      <div className="ndr-wizard__navigation">
        <div></div> {/* Spacer pour pousser le bouton à droite */}
        <Button
          variant="primary"
          onClick={handleNext}
          disabled={!selectedFamily}
        >
          Suivant : Élèves et Matières →
        </Button>
      </div>
    </div>
  );
};