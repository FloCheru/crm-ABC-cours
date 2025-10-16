import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores';
import { PageHeader } from '../../components';
import type { Teacher, EmploymentStatus, WeeklySchedule } from '../../types/teacher';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../../components/ui/tabs';
import { Checkbox } from '../../components/ui/checkbox';
import { Label } from '../../components/ui/label';
import { AvailabilityForm } from '../../components/professor/AvailabilityForm';
import { FRENCH_DEPARTMENTS } from '../../constants/departments';

export const MonProfil: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState<Partial<Teacher>>({});
  const [activeTab, setActiveTab] = useState('identite');
  const [isSaving, setIsSaving] = useState(false);

  // État pour gérer l'édition par onglet
  const [editingTab, setEditingTab] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      // TODO: Remplacer par un vrai appel API via professorService.getMyProfile()
      // Pour l'instant, données mockées
      const mockProfile: Partial<Teacher> = {
        _id: user?._id || '',
        gender: 'Mme',
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        birthName: '',
        birthDate: '1990-05-15',
        socialSecurityNumber: '',
        birthCountry: 'France',
        email: user?.email || '',
        phone: '0123456789',
        secondaryPhone: '',
        address: '123 Rue Exemple',
        addressComplement: '',
        postalCode: '75001',
        city: 'Paris',
        inseeCity: '',
        distributionOffice: '',
        transportMode: 'voiture',
        courseLocation: 'domicile',
        secondaryAddress: '',
        // RIB fields
        employmentStatus: undefined,
        siret: '',
        bankName: '',
        iban: '',
        bic: '',
        // Déplacements
        availableDepartments: [],
        // Disponibilités
        weeklyAvailability: {},
      };
      setFormData(mockProfile);
    } catch (err) {
      console.error('Erreur lors du chargement du profil:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (section: string) => {
    try {
      setIsSaving(true);
      console.log('Sauvegarde des données:', section, formData);
      // TODO: Appeler professorService.updateMyProfile(formData)
      await new Promise((resolve) => setTimeout(resolve, 500)); // Simuler API call
      setEditingTab(null);
    } catch (err) {
      console.error('Erreur lors de la sauvegarde:', err);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditingTab(null);
    loadProfile(); // Recharger les données originales
  };

  const handleInputChange = (field: keyof Teacher, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleDepartment = (code: string) => {
    const current = formData.availableDepartments || [];
    const updated = current.includes(code)
      ? current.filter((c) => c !== code)
      : [...current, code];
    handleInputChange('availableDepartments', updated);
  };

  const handleAvailabilityChange = (schedule: WeeklySchedule) => {
    handleInputChange('weeklyAvailability', schedule);
  };

  const renderEditField = (
    label: string,
    field: keyof Teacher,
    type: 'text' | 'email' | 'tel' | 'date' | 'select' = 'text',
    options?: { value: string; label: string }[],
    isFullWidth = false
  ) => (
    <div className={isFullWidth ? 'col-span-2' : ''}>
      <label className="text-xs text-gray-500 mb-1 block">{label}</label>
      {type === 'select' ? (
        <select
          value={(formData[field] as string) || ''}
          onChange={(e) => handleInputChange(field, e.target.value)}
          className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        >
          {options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          value={(formData[field] as string) || ''}
          onChange={(e) => handleInputChange(field, e.target.value)}
          className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
      )}
    </div>
  );

  const renderField = (label: string, value: string | undefined, isFullWidth = false) => (
    <div className={isFullWidth ? 'col-span-2' : ''}>
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-base text-gray-900">{value || '-'}</div>
    </div>
  );

  const isRibMissing = !formData.iban || !formData.employmentStatus;

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 max-w-6xl">
        <PageHeader
          title="Chargement..."
          breadcrumb={[{ label: 'Mon Profil' }]}
        />
        <div className="text-center text-gray-500 py-8">
          Chargement de votre profil...
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 max-w-6xl">
      <PageHeader
        title="Mon Profil"
        breadcrumb={[{ label: 'Mon Profil' }]}
        description="Gérez vos informations personnelles et professionnelles"
      />

      {/* Alerte RIB manquant */}
      {isRibMissing && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <h4 className="font-semibold text-yellow-900 mb-1">
                RIB à ajouter
              </h4>
              <p className="text-sm text-yellow-800">
                Vous devez renseigner vos informations bancaires avant toute saisie de coupon.
                Veuillez compléter l'onglet "Mon RIB" ci-dessous.
              </p>
            </div>
          </div>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-transparent border-b border-gray-200 rounded-none p-0 h-auto w-full justify-start">
          <TabsTrigger
            value="identite"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-3"
          >
            Identité
          </TabsTrigger>
          <TabsTrigger
            value="coordonnees"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-3"
          >
            Coordonnées
          </TabsTrigger>
          <TabsTrigger
            value="rib"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-3"
          >
            Mon RIB
          </TabsTrigger>
          <TabsTrigger
            value="deplacements"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-3"
          >
            Déplacements
          </TabsTrigger>
          <TabsTrigger
            value="disponibilites"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-3"
          >
            Disponibilités
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Identité */}
        <TabsContent value="identite" className="mt-6">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Identité</h3>
                <p className="text-sm text-gray-500">
                  Vos informations personnelles
                </p>
              </div>
              {editingTab !== 'identite' && (
                <button
                  onClick={() => setEditingTab('identite')}
                  className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
                >
                  Modifier ✏️
                </button>
              )}
            </div>

            {editingTab === 'identite' ? (
              <>
                <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                  {renderEditField('Genre *', 'gender', 'select', [
                    { value: 'M.', label: 'M.' },
                    { value: 'Mme', label: 'Mme' },
                  ])}
                  {renderEditField('Prénom *', 'firstName')}
                  {renderEditField('Nom *', 'lastName')}
                  {renderEditField('Nom de naissance (si différent)', 'birthName')}
                  {renderEditField('Date de naissance *', 'birthDate', 'date')}
                  {renderEditField('N° de sécurité sociale', 'socialSecurityNumber')}
                  {renderEditField('Pays de naissance', 'birthCountry', 'text', undefined, true)}
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => handleSave('identite')}
                    disabled={isSaving}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isSaving ? 'Enregistrement...' : 'Sauvegarder'}
                  </button>
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                </div>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                {renderField('Genre *', formData.gender)}
                {renderField('Prénom *', formData.firstName)}
                {renderField('Nom *', formData.lastName)}
                {renderField('Nom de naissance (si différent)', formData.birthName)}
                {renderField(
                  'Date de naissance *',
                  formData.birthDate
                    ? new Date(formData.birthDate).toLocaleDateString('fr-FR')
                    : undefined
                )}
                {renderField('N° de sécurité sociale', formData.socialSecurityNumber)}
                {renderField('Pays de naissance', formData.birthCountry, true)}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Tab 2: Coordonnées */}
        <TabsContent value="coordonnees" className="mt-6">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Coordonnées</h3>
                <p className="text-sm text-gray-500">
                  Informations de contact et adresse
                </p>
              </div>
              {editingTab !== 'coordonnees' && (
                <button
                  onClick={() => setEditingTab('coordonnees')}
                  className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
                >
                  Modifier ✏️
                </button>
              )}
            </div>

            {editingTab === 'coordonnees' ? (
              <>
                <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                  {renderEditField('Email *', 'email', 'email')}
                  {renderEditField('Tél principal *', 'phone', 'tel')}
                  {renderEditField('Tél secondaire', 'secondaryPhone', 'tel')}
                  {renderEditField('Code postal *', 'postalCode')}
                  {renderEditField('Adresse', 'address', 'text', undefined, true)}
                  {renderEditField('Complément d\'adresse', 'addressComplement', 'text', undefined, true)}
                  {renderEditField('Commune', 'city')}
                  {renderEditField('Commune INSEE', 'inseeCity')}
                  {renderEditField('Bureau distributeur', 'distributionOffice', 'text', undefined, true)}
                  {renderEditField('Déplacement', 'transportMode', 'select', [
                    { value: '', label: 'Sélectionner...' },
                    { value: 'voiture', label: 'Voiture' },
                    { value: 'vélo', label: 'Vélo' },
                    { value: 'transports', label: 'Transports en commun' },
                    { value: 'moto', label: 'Moto' },
                  ])}
                  {renderEditField('Cours', 'courseLocation', 'select', [
                    { value: '', label: 'Sélectionner...' },
                    { value: 'domicile', label: 'À domicile' },
                    { value: 'visio', label: 'En visio' },
                  ])}
                  {renderEditField('Adresse secondaire', 'secondaryAddress', 'text', undefined, true)}
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => handleSave('coordonnees')}
                    disabled={isSaving}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isSaving ? 'Enregistrement...' : 'Sauvegarder'}
                  </button>
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                </div>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                {renderField('Email *', formData.email)}
                {renderField('Tél principal *', formData.phone)}
                {renderField('Tél secondaire', formData.secondaryPhone)}
                {renderField('Code postal *', formData.postalCode)}
                {renderField('Adresse', formData.address, true)}
                {renderField('Complément d\'adresse', formData.addressComplement, true)}
                {renderField('Commune', formData.city)}
                {renderField('Commune INSEE', formData.inseeCity)}
                {renderField('Bureau distributeur', formData.distributionOffice, true)}
                {renderField('Déplacement', formData.transportMode)}
                {renderField('Cours', formData.courseLocation)}
                {renderField('Adresse secondaire', formData.secondaryAddress, true)}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Tab 3: Mon RIB */}
        <TabsContent value="rib" className="mt-6">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Mon RIB</h3>
                <p className="text-sm text-gray-500">
                  Informations bancaires et statut professionnel
                </p>
              </div>
              {editingTab !== 'rib' && (
                <button
                  onClick={() => setEditingTab('rib')}
                  className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
                >
                  Modifier ✏️
                </button>
              )}
            </div>

            {editingTab === 'rib' ? (
              <>
                <div className="space-y-6">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">
                      Statut professionnel *
                    </label>
                    <select
                      value={formData.employmentStatus || ''}
                      onChange={(e) =>
                        handleInputChange('employmentStatus', e.target.value as EmploymentStatus)
                      }
                      className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    >
                      <option value="">Sélectionner...</option>
                      <option value="salarie">Salarié</option>
                      <option value="auto-entrepreneur">Auto-entrepreneur</option>
                    </select>
                  </div>

                  {formData.employmentStatus === 'auto-entrepreneur' && (
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">
                        SIRET * (14 chiffres)
                      </label>
                      <input
                        type="text"
                        value={formData.siret || ''}
                        onChange={(e) => handleInputChange('siret', e.target.value)}
                        pattern="[0-9]{14}"
                        title="14 chiffres requis"
                        maxLength={14}
                        className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        placeholder="12345678901234"
                      />
                    </div>
                  )}

                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">
                      Nom de la banque
                    </label>
                    <input
                      type="text"
                      value={formData.bankName || ''}
                      onChange={(e) => handleInputChange('bankName', e.target.value)}
                      className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="Ex: Crédit Agricole"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">
                      IBAN * (27 caractères pour la France)
                    </label>
                    <input
                      type="text"
                      value={formData.iban || ''}
                      onChange={(e) => handleInputChange('iban', e.target.value.toUpperCase())}
                      pattern="FR[0-9]{25}"
                      title="Format IBAN français: FR suivi de 25 chiffres"
                      maxLength={27}
                      className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono"
                      placeholder="FR7612345678901234567890123"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">
                      BIC/SWIFT (8 ou 11 caractères)
                    </label>
                    <input
                      type="text"
                      value={formData.bic || ''}
                      onChange={(e) => handleInputChange('bic', e.target.value.toUpperCase())}
                      pattern="[A-Z]{6}[A-Z0-9]{2,5}"
                      title="Format BIC: 8 ou 11 caractères alphanumériques"
                      maxLength={11}
                      className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono"
                      placeholder="AGRIFRPP"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => handleSave('rib')}
                    disabled={isSaving}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isSaving ? 'Enregistrement...' : 'Sauvegarder'}
                  </button>
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                </div>
              </>
            ) : (
              <div className="space-y-6">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Statut professionnel</div>
                  <div className="text-base text-gray-900">
                    {formData.employmentStatus === 'salarie'
                      ? 'Salarié'
                      : formData.employmentStatus === 'auto-entrepreneur'
                      ? 'Auto-entrepreneur'
                      : '-'}
                  </div>
                </div>

                {formData.employmentStatus === 'auto-entrepreneur' && (
                  <div>
                    <div className="text-xs text-gray-500 mb-1">SIRET</div>
                    <div className="text-base text-gray-900 font-mono">
                      {formData.siret || '-'}
                    </div>
                  </div>
                )}

                <div>
                  <div className="text-xs text-gray-500 mb-1">Nom de la banque</div>
                  <div className="text-base text-gray-900">{formData.bankName || '-'}</div>
                </div>

                <div>
                  <div className="text-xs text-gray-500 mb-1">IBAN</div>
                  <div className="text-base text-gray-900 font-mono">
                    {formData.iban || '-'}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-gray-500 mb-1">BIC/SWIFT</div>
                  <div className="text-base text-gray-900 font-mono">
                    {formData.bic || '-'}
                  </div>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Tab 4: Déplacements */}
        <TabsContent value="deplacements" className="mt-6">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Déplacements</h3>
                <p className="text-sm text-gray-500">
                  Départements où vous pouvez vous déplacer pour donner des cours
                </p>
              </div>
              {editingTab !== 'deplacements' && (
                <button
                  onClick={() => setEditingTab('deplacements')}
                  className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
                >
                  Modifier ✏️
                </button>
              )}
            </div>

            {editingTab === 'deplacements' ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {FRENCH_DEPARTMENTS.map((dept) => (
                    <div key={dept.code} className="flex items-center space-x-2">
                      <Checkbox
                        id={`dept-${dept.code}`}
                        checked={formData.availableDepartments?.includes(dept.code) || false}
                        onCheckedChange={() => toggleDepartment(dept.code)}
                      />
                      <Label
                        htmlFor={`dept-${dept.code}`}
                        className="text-sm cursor-pointer"
                      >
                        {dept.code} - {dept.name}
                      </Label>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => handleSave('deplacements')}
                    disabled={isSaving}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isSaving ? 'Enregistrement...' : 'Sauvegarder'}
                  </button>
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                </div>
              </>
            ) : (
              <div>
                {formData.availableDepartments && formData.availableDepartments.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {formData.availableDepartments.map((code) => {
                      const dept = FRENCH_DEPARTMENTS.find((d) => d.code === code);
                      return (
                        <div key={code} className="flex items-center space-x-2">
                          <span className="text-blue-600">✓</span>
                          <span className="text-sm text-gray-900">
                            {code} - {dept?.name || 'Inconnu'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    Aucun département sélectionné
                  </p>
                )}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Tab 5: Disponibilités */}
        <TabsContent value="disponibilites" className="mt-6">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Disponibilités</h3>
                <p className="text-sm text-gray-500">
                  Vos créneaux horaires disponibles dans la semaine
                </p>
              </div>
              {editingTab !== 'disponibilites' && (
                <button
                  onClick={() => setEditingTab('disponibilites')}
                  className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
                >
                  Modifier ✏️
                </button>
              )}
            </div>

            {editingTab === 'disponibilites' ? (
              <>
                <AvailabilityForm
                  value={formData.weeklyAvailability || {}}
                  onChange={handleAvailabilityChange}
                />

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => handleSave('disponibilites')}
                    disabled={isSaving}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isSaving ? 'Enregistrement...' : 'Sauvegarder'}
                  </button>
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                </div>
              </>
            ) : (
              <div className="space-y-3">
                {formData.weeklyAvailability &&
                Object.keys(formData.weeklyAvailability).length > 0 ? (
                  Object.entries(formData.weeklyAvailability).map(([day, schedule]) => {
                    if (!schedule?.enabled || schedule.timeSlots.length === 0) return null;

                    const dayLabels: Record<string, string> = {
                      lundi: 'Lundi',
                      mardi: 'Mardi',
                      mercredi: 'Mercredi',
                      jeudi: 'Jeudi',
                      vendredi: 'Vendredi',
                      samedi: 'Samedi',
                      dimanche: 'Dimanche',
                    };

                    return (
                      <div key={day} className="border-l-4 border-blue-500 pl-4 py-2">
                        <div className="font-medium text-gray-900 mb-1">
                          {dayLabels[day]}
                        </div>
                        <div className="space-y-1">
                          {schedule.timeSlots.map((slot, index) => (
                            <div key={index} className="text-sm text-gray-600">
                              {slot.start} - {slot.end}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-gray-500">
                    Aucune disponibilité configurée
                  </p>
                )}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
