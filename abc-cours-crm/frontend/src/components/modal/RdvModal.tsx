import React, { useState, useEffect } from 'react';
import { ModalWrapper } from '../ui/ModalWrapper/ModalWrapper';
import { Button } from '../button/Button';
import { adminService, type Admin } from '../../services/adminService';

const RDV_TYPES = [
  { value: "physique", label: "Physique" },
  { value: "virtuel", label: "Virtuel" }
] as const;

const RDV_HOURS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00"
];

interface RdvModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: {
    assignedAdminId: string;
    date: string;
    time: string;
    type: "physique" | "virtuel";
    notes: string;
  };
  onFormChange: (key: string, value: any) => void;
  onSubmit: () => void;
  isEditing: boolean;
  loading?: boolean;
}

export const RdvModal: React.FC<RdvModalProps> = ({
  isOpen,
  onClose,
  formData,
  onFormChange,
  onSubmit,
  isEditing,
  loading = false
}) => {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);

  useEffect(() => {
    const fetchAdmins = async () => {
      if (!isOpen) return;
      
      try {
        setLoadingAdmins(true);
        const adminList = await adminService.getAdmins();
        setAdmins(adminList);
      } catch (error) {
        console.error('Erreur lors du chargement des administrateurs:', error);
      } finally {
        setLoadingAdmins(false);
      }
    };

    fetchAdmins();
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  const isFormValid = formData.date && formData.time;

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
    >
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          {isEditing ? "Modifier le rendez-vous" : "Nouveau rendez-vous"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date *
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => onFormChange('date', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {/* Heure */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Heure *
            </label>
            <select
              value={formData.time}
              onChange={(e) => onFormChange('time', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Sélectionner une heure</option>
              {RDV_HOURS.map(hour => (
                <option key={hour} value={hour}>
                  {hour}
                </option>
              ))}
            </select>
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => onFormChange('type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {RDV_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Admin assigné */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Admin assigné
            </label>
            <select
              value={formData.assignedAdminId}
              onChange={(e) => onFormChange('assignedAdminId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loadingAdmins}
            >
              <option value="">
                {loadingAdmins ? "Chargement des admins..." : "Sélectionner un admin"}
              </option>
              {admins.map(admin => (
                <option key={admin.id} value={admin.id}>
                  {admin.fullName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => onFormChange('notes', e.target.value)}
            placeholder="Notes sur le rendez-vous..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Boutons */}
        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            disabled={!isFormValid || loading}
          >
            {loading ? "En cours..." : isEditing ? "Modifier RDV" : "Créer RDV"}
          </Button>
        </div>
        </form>
      </div>
    </ModalWrapper>
  );
};