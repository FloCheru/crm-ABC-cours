import React from 'react';
import type { WeeklySchedule } from '../../types/professor';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';

interface AvailabilityFormProps {
  value: WeeklySchedule;
  onChange: (schedule: WeeklySchedule) => void;
}

const DAYS = [
  { key: 'lundi', label: 'Lundi' },
  { key: 'mardi', label: 'Mardi' },
  { key: 'mercredi', label: 'Mercredi' },
  { key: 'jeudi', label: 'Jeudi' },
  { key: 'vendredi', label: 'Vendredi' },
  { key: 'samedi', label: 'Samedi' },
  { key: 'dimanche', label: 'Dimanche' },
] as const;

export const AvailabilityForm: React.FC<AvailabilityFormProps> = ({ value, onChange }) => {

  const toggleDay = (day: keyof WeeklySchedule) => {
    const currentDay = value[day];
    const newSchedule = { ...value };

    if (currentDay?.enabled) {
      // Désactiver le jour
      newSchedule[day] = { enabled: false, timeSlots: [] };
    } else {
      // Activer le jour avec un créneau par défaut
      newSchedule[day] = {
        enabled: true,
        timeSlots: [{ start: '09:00', end: '17:00' }],
      };
    }

    onChange(newSchedule);
  };

  const addTimeSlot = (day: keyof WeeklySchedule) => {
    const currentDay = value[day];
    if (!currentDay) return;

    const newSchedule = { ...value };
    const lastSlot = currentDay.timeSlots[currentDay.timeSlots.length - 1];
    const newStart = lastSlot ? lastSlot.end : '09:00';

    newSchedule[day] = {
      ...currentDay,
      timeSlots: [
        ...currentDay.timeSlots,
        { start: newStart, end: '18:00' },
      ],
    };

    onChange(newSchedule);
  };

  const removeTimeSlot = (day: keyof WeeklySchedule, slotIndex: number) => {
    const currentDay = value[day];
    if (!currentDay) return;

    const newSchedule = { ...value };
    newSchedule[day] = {
      ...currentDay,
      timeSlots: currentDay.timeSlots.filter((_, i) => i !== slotIndex),
    };

    onChange(newSchedule);
  };

  const updateTimeSlot = (
    day: keyof WeeklySchedule,
    slotIndex: number,
    field: 'start' | 'end',
    newValue: string
  ) => {
    const currentDay = value[day];
    if (!currentDay) return;

    const newSchedule = { ...value };
    const updatedSlots = [...currentDay.timeSlots];
    updatedSlots[slotIndex] = {
      ...updatedSlots[slotIndex],
      [field]: newValue,
    };

    newSchedule[day] = {
      ...currentDay,
      timeSlots: updatedSlots,
    };

    onChange(newSchedule);
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600 mb-4">
        Sélectionnez les jours et créneaux horaires où vous êtes disponible pour donner des cours.
      </div>

      {DAYS.map(({ key, label }) => {
        const daySchedule = value[key];
        const isEnabled = daySchedule?.enabled || false;

        return (
          <div
            key={key}
            className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
          >
            <div className="flex items-center space-x-3 mb-3">
              <Checkbox
                id={`day-${key}`}
                checked={isEnabled}
                onCheckedChange={() => toggleDay(key)}
              />
              <Label
                htmlFor={`day-${key}`}
                className="text-base font-medium cursor-pointer"
              >
                {label}
              </Label>
            </div>

            {isEnabled && daySchedule && (
              <div className="ml-7 space-y-3">
                {daySchedule.timeSlots.map((slot, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 bg-gray-50 p-3 rounded-md"
                  >
                    <div className="flex items-center gap-2">
                      <Label className="text-sm text-gray-600">De</Label>
                      <input
                        type="time"
                        value={slot.start}
                        onChange={(e) =>
                          updateTimeSlot(key, index, 'start', e.target.value)
                        }
                        className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <Label className="text-sm text-gray-600">à</Label>
                      <input
                        type="time"
                        value={slot.end}
                        onChange={(e) =>
                          updateTimeSlot(key, index, 'end', e.target.value)
                        }
                        className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                    </div>

                    {daySchedule.timeSlots.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTimeSlot(key, index)}
                        className="ml-auto text-red-600 hover:text-red-800 text-sm"
                        title="Supprimer ce créneau"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => addTimeSlot(key)}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  + Ajouter un créneau
                </button>
              </div>
            )}

            {!isEnabled && (
              <div className="ml-7 text-sm text-gray-400 italic">
                Pas disponible
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
