import * as React from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { TRANSPORT_MODES } from '@/constants/transportModes';

interface TransportModesComboboxProps {
  /** Callback appelé quand un mode de transport est sélectionné/désélectionné */
  onSelect: (modeValue: string) => void;
  /** Liste des valeurs de modes déjà sélectionnés (pour afficher la coche) */
  selectedValues?: string[];
  /** Placeholder du bouton */
  placeholder?: string;
  /** Contrôle l'état d'ouverture du Popover (mode contrôlé) */
  open?: boolean;
  /** Callback appelé quand l'état d'ouverture change */
  onOpenChange?: (open: boolean) => void;
}

/**
 * Combobox pour sélectionner des modes de transport
 * Composant métier spécifique au contexte ABC Cours
 *
 * @example
 * <TransportModesCombobox
 *   onSelect={(value) => toggleTransportMode(value)}
 *   selectedValues={['voiture', 'vélo']}
 * />
 */
export const TransportModesCombobox = ({
  onSelect,
  selectedValues = [],
  placeholder = 'Sélectionner les modes de déplacement...',
  open: controlledOpen,
  onOpenChange,
}: TransportModesComboboxProps) => {
  const [internalOpen, setInternalOpen] = React.useState(false);

  // Mode contrôlé si open et onOpenChange sont fournis, sinon mode non-contrôlé
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;

  const handleOpenChange = (newOpen: boolean) => {
    if (onOpenChange) {
      onOpenChange(newOpen);
    } else {
      setInternalOpen(newOpen);
    }
  };

  const handleSelect = (modeValue: string) => {
    onSelect(modeValue);
    // Ne pas fermer le Popover automatiquement pour permettre la sélection multiple
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={isOpen}
          className="w-full justify-between"
        >
          {placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Rechercher un mode de transport..." />
          <CommandList>
            <CommandEmpty>Aucun mode de transport trouvé.</CommandEmpty>
            <CommandGroup>
              {TRANSPORT_MODES.map((mode) => {
                const isSelected = selectedValues.includes(mode.value);
                return (
                  <CommandItem
                    key={mode.value}
                    value={mode.label}
                    onSelect={() => handleSelect(mode.value)}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        isSelected ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    {mode.label}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
