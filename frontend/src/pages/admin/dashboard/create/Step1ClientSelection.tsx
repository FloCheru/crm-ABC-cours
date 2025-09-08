import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button, Input, FormCard } from '../../../../components';
import { useNDRWizard } from '../../../../contexts/NDRWizardContext';
import { familyService } from '../../../../services/familyService';
import type { Family } from '../../../../types/family';
import './Step1ClientSelection.css';

export const Step1ClientSelection: React.FC = () => {
  const { updateStep1, validateStep1, nextStep, errors } = useNDRWizard();
  const [searchParams] = useSearchParams();
  const familyIdFromUrl = searchParams.get('familyId');
  
  const [families, setFamilies] = useState<Family[]>([]);
  const [selectedFamily, setSelectedFamily] = useState<Family | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sameBillingAddress, setSameBillingAddress] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedRef = useRef(false); // Prévient les appels multiples

  // Charger les familles au montage
  useEffect(() => {
    // Prévient les appels multiples
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    const loadFamilies = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const familiesData = await familyService.getFamilies();
        setFamilies(familiesData);

        // Si un familyId est fourni en paramètre, le pré-sélectionner
        if (familyIdFromUrl) {
          const family = familiesData.find(f => f._id === familyIdFromUrl);
          if (family) {
            setSelectedFamily(family);
            updateStep1({
              familyId: family._id,
              clientName: `${family.primaryContact.firstName} ${family.primaryContact.lastName}`,
              department: family.address.city || '',
              primaryContact: {
                firstName: family.primaryContact.firstName,
                lastName: family.primaryContact.lastName,
                email: family.primaryContact.email || '',
                phone: family.primaryContact.primaryPhone || '',
                dateOfBirth: family.primaryContact.dateOfBirth,
                gender: family.primaryContact.gender as 'M.' | 'Mme',
              },
              address: {
                street: family.address.street,
                city: family.address.city,
                postalCode: family.address.postalCode,
              },
              companyInfo: {
                urssafNumber: family.companyInfo?.urssafNumber || '',
                siretNumber: family.companyInfo?.siretNumber || '',
                ceNumber: family.companyInfo?.ceNumber || '',
              },
            });
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement des familles:', error);
        setError(error instanceof Error ? error.message : 'Erreur lors du chargement des familles');
        // Réinitialiser hasLoadedRef pour permettre un nouvel essai
        hasLoadedRef.current = false;
      } finally {
        setIsLoading(false);
      }
    };

    loadFamilies();
    // ESLint-disable-next-line react-hooks/exhaustive-deps
  }, [familyIdFromUrl]); // Retrait d'updateStep1 pour éviter la boucle infinie

  const handleFamilySelect = (family: Family) => {
    setSelectedFamily(family);
    updateStep1({
      familyId: family._id,
      clientName: `${family.primaryContact.firstName} ${family.primaryContact.lastName}`,
      department: family.address.city || '',
      primaryContact: {
        firstName: family.primaryContact.firstName,
        lastName: family.primaryContact.lastName,
        email: family.primaryContact.email || '',
        phone: family.primaryContact.primaryPhone || '',
        dateOfBirth: family.primaryContact.dateOfBirth,
        gender: family.primaryContact.gender as 'M.' | 'Mme',
      },
      address: {
        street: family.address.street,
        city: family.address.city,
        postalCode: family.address.postalCode,
      },
      companyInfo: {
        urssafNumber: family.companyInfo?.urssafNumber || '',
        siretNumber: family.companyInfo?.siretNumber || '',
        ceNumber: family.companyInfo?.ceNumber || '',
      },
      sameBillingAddress: true,
    });
    setSameBillingAddress(true);
  };

  const handleFieldChange = (field: string, value: any) => {
    if (!selectedFamily) return;

    // Mettre à jour la famille locale ET le state du wizard
    const updatedFamily = { ...selectedFamily };
    
    // Navigation dans l'objet imbriqué
    const fieldParts = field.split('.');
    let current: any = updatedFamily;
    
    for (let i = 0; i < fieldParts.length - 1; i++) {
      if (!current[fieldParts[i]]) {
        current[fieldParts[i]] = {};
      }
      current = current[fieldParts[i]];
    }
    
    current[fieldParts[fieldParts.length - 1]] = value;
    
    setSelectedFamily(updatedFamily);
    
    // Mettre à jour aussi dans le wizard state
    const step1Update: any = {};
    const step1Current: any = step1Update;
    
    for (let i = 0; i < fieldParts.length - 1; i++) {
      step1Current[fieldParts[i]] = step1Current[fieldParts[i]] || {};
      if (i === fieldParts.length - 2) {
        step1Current[fieldParts[i]][fieldParts[fieldParts.length - 1]] = value;
      }
    }
    
    updateStep1(step1Update);
  };

  const handleSameBillingAddressChange = (checked: boolean) => {
    setSameBillingAddress(checked);
    updateStep1({ sameBillingAddress: checked });
    
    if (checked && selectedFamily) {
      // Copier l'adresse principale
      updateStep1({
        billingAddress: {
          street: selectedFamily.address.street,
          city: selectedFamily.address.city,
          postalCode: selectedFamily.address.postalCode,
        },
      });
    }
  };

  const handleNext = () => {
    if (validateStep1()) {
      nextStep();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'prospect': return 'text-blue-600 bg-blue-100';
      case 'client': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Fonction pour réessayer le chargement
  const retryLoadFamilies = () => {
    hasLoadedRef.current = false;
    setError(null);
    setIsLoading(true);
    
    const loadFamilies = async () => {
      try {
        const familiesData = await familyService.getFamilies();
        setFamilies(familiesData);
        hasLoadedRef.current = true;
      } catch (error) {
        console.error('Erreur lors du chargement des familles:', error);
        setError(error instanceof Error ? error.message : 'Erreur lors du chargement des familles');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadFamilies();
  };

  if (isLoading) {
    return (
      <div className="step1__loading">
        <div className="step1__loading-text">Chargement des familles...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="step1__error-container">
        <div className="step1__error-message">
          ⚠️ Erreur de chargement : {error}
        </div>
        <Button 
          variant="primary" 
          onClick={retryLoadFamilies}
          className="step1__retry-button"
        >
          🔄 Réessayer
        </Button>
      </div>
    );
  }

  return (
    <div className="step1-client-selection">
      {/* Sélection de la famille */}
      <FormCard title="Sélection du client" className="step1__family-selection">
        {errors.step1?.familyId && (
          <div className="step1__error">
            {errors.step1.familyId}
          </div>
        )}
        
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

      {/* Détails du client sélectionné */}
      {selectedFamily && (
        <>
          {/* Informations personnelles */}
          <FormCard title="Informations personnelles" className="step1__personal-info">
            <div className="step1__form-grid">
              <Input
                label="Prénom"
                value={selectedFamily.primaryContact.firstName}
                onChange={(e) => handleFieldChange('primaryContact.firstName', e.target.value)}
                required
              />
              <Input
                label="Nom"
                value={selectedFamily.primaryContact.lastName}
                onChange={(e) => handleFieldChange('primaryContact.lastName', e.target.value)}
                required
              />
              <Input
                label="Email"
                type="email"
                value={selectedFamily.primaryContact.email || ''}
                onChange={(e) => handleFieldChange('primaryContact.email', e.target.value)}
              />
              <Input
                label="Téléphone"
                type="tel"
                value={selectedFamily.primaryContact.primaryPhone || ''}
                onChange={(e) => handleFieldChange('primaryContact.primaryPhone', e.target.value)}
              />
              
              {/* Date de naissance */}
              <div className="step1__form-field">
                <Input
                  label="Date de naissance"
                  type="date"
                  value={
                    selectedFamily.primaryContact.dateOfBirth
                      ? new Date(selectedFamily.primaryContact.dateOfBirth).toISOString().split('T')[0]
                      : ''
                  }
                  onChange={(e) => handleFieldChange('primaryContact.dateOfBirth', 
                    e.target.value ? new Date(e.target.value) : null
                  )}
                />
                {errors.step1?.clientBirthDate && (
                  <div className="step1__field-error">
                    {errors.step1.clientBirthDate}
                  </div>
                )}
              </div>

              {/* Civilité */}
              <div className="step1__form-field">
                <label className="step1__form-label">Civilité</label>
                <select
                  value={selectedFamily.primaryContact.gender || ''}
                  onChange={(e) => handleFieldChange('primaryContact.gender', e.target.value)}
                  className="step1__form-select"
                >
                  <option value="">Sélectionner...</option>
                  <option value="M.">M.</option>
                  <option value="Mme">Mme</option>
                </select>
              </div>
            </div>
          </FormCard>

          {/* Adresse */}
          <FormCard title="Adresse" className="step1__address">
            <div className="step1__form-grid">
              <Input
                label="Rue"
                value={selectedFamily.address.street}
                onChange={(e) => handleFieldChange('address.street', e.target.value)}
                required
                className="step1__form-field--full"
              />
              <Input
                label="Ville"
                value={selectedFamily.address.city}
                onChange={(e) => handleFieldChange('address.city', e.target.value)}
                required
              />
              <Input
                label="Code postal"
                value={selectedFamily.address.postalCode}
                onChange={(e) => handleFieldChange('address.postalCode', e.target.value)}
                required
              />
            </div>
          </FormCard>

          {/* Informations entreprise */}
          <FormCard title="Informations entreprise" className="step1__company-info">
            <div className="step1__form-grid">
              <Input
                label="N° URSSAF"
                value={selectedFamily.companyInfo?.urssafNumber || ''}
                onChange={(e) => handleFieldChange('companyInfo.urssafNumber', e.target.value)}
                placeholder="Numéro URSSAF"
              />
              <Input
                label="N° SIRET"
                value={selectedFamily.companyInfo?.siretNumber || ''}
                onChange={(e) => handleFieldChange('companyInfo.siretNumber', e.target.value)}
                placeholder="Numéro SIRET"
              />
              <Input
                label="N° CE"
                value={selectedFamily.companyInfo?.ceNumber || ''}
                onChange={(e) => handleFieldChange('companyInfo.ceNumber', e.target.value)}
                placeholder="Numéro CE"
              />
            </div>
          </FormCard>

          {/* Adresse de facturation */}
          <FormCard title="Adresse de facturation" className="step1__billing-address">
            <div className="step1__checkbox-container">
              <input
                type="checkbox"
                id="sameBillingAddress"
                checked={sameBillingAddress}
                onChange={(e) => handleSameBillingAddressChange(e.target.checked)}
                className="step1__checkbox"
              />
              <label htmlFor="sameBillingAddress" className="step1__checkbox-label">
                L'adresse de facturation est la même que le domicile
              </label>
            </div>

            {!sameBillingAddress && (
              <div className="step1__form-grid step1__billing-fields">
                <Input
                  label="Rue (facturation)"
                  value={selectedFamily.billingAddress?.street || ''}
                  onChange={(e) => handleFieldChange('billingAddress.street', e.target.value)}
                  placeholder="Adresse de facturation"
                  className="step1__form-field--full"
                />
                <Input
                  label="Ville (facturation)"
                  value={selectedFamily.billingAddress?.city || ''}
                  onChange={(e) => handleFieldChange('billingAddress.city', e.target.value)}
                  placeholder="Ville"
                />
                <Input
                  label="Code postal (facturation)"
                  value={selectedFamily.billingAddress?.postalCode || ''}
                  onChange={(e) => handleFieldChange('billingAddress.postalCode', e.target.value)}
                  placeholder="Code postal"
                />
              </div>
            )}
          </FormCard>
        </>
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