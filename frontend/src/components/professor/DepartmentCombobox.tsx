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
import { FRENCH_DEPARTMENTS } from '@/constants/departments';

interface DepartmentComboboxProps {
  /** Callback appelé quand un département est sélectionné */
  onSelect: (departmentCode: string) => void;
  /** Liste des codes départements déjà sélectionnés (pour afficher la coche) */
  selectedCodes?: string[];
  /** Placeholder du bouton */
  placeholder?: string;
  /** Contrôle l'état d'ouverture du Popover (mode contrôlé) */
  open?: boolean;
  /** Callback appelé quand l'état d'ouverture change */
  onOpenChange?: (open: boolean) => void;
}

/**
 * Combobox pour sélectionner un département français
 * Composant métier spécifique au contexte ABC Cours
 *
 * @example
 * <DepartmentCombobox
 *   onSelect={(code) => addDepartment(code)}
 *   selectedCodes={['75', '92']}
 * />
 */
export const DepartmentCombobox = ({
  onSelect,
  selectedCodes = [],
  placeholder = 'Ajouter un département...',
  open: controlledOpen,
  onOpenChange,
}: DepartmentComboboxProps) => {
  const [internalOpen, setInternalOpen] = React.useState(false);

  // Mode contrôlé si open et onOpenChange sont fournis, sinon mode non-contrôlé
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;

  React.useEffect(() => {
    console.log('[DepartmentCombobox] Render avec selectedCodes:', selectedCodes);
  }, [selectedCodes]);

  const handleOpenChange = (newOpen: boolean) => {
    if (onOpenChange) {
      onOpenChange(newOpen);
    } else {
      setInternalOpen(newOpen);
    }
  };

  const handleSelect = (departmentCode: string) => {
    onSelect(departmentCode);
    // Ne pas fermer le Popover automatiquement
    // Il se fermera uniquement quand l'utilisateur clique en dehors
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Rechercher un département..." />
          <CommandList>
            <CommandEmpty>Aucun département trouvé.</CommandEmpty>
            <CommandGroup>
              {FRENCH_DEPARTMENTS.map((dept) => {
                const isSelected = selectedCodes.includes(dept.code);
                return (
                  <CommandItem
                    key={dept.code}
                    value={`${dept.code} ${dept.name}`}
                    onSelect={() => handleSelect(dept.code)}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        isSelected ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    {dept.code} - {dept.name}
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