import * as React from 'react';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
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
import { geoApiService, type Commune } from '@/services/geoApiService';

interface CommuneComboboxProps {
  /** Code du département pour charger les communes (ex: "75", "2A") */
  departmentCode: string;
  /** Callback appelé quand une commune est sélectionnée */
  onSelect: (cityCode: string) => void;
  /** Liste des codes communes (INSEE) déjà sélectionnées */
  selectedCodes?: string[];
  /** Placeholder du bouton */
  placeholder?: string;
  /** Contrôle l'état d'ouverture du Popover (mode contrôlé) */
  open?: boolean;
  /** Callback appelé quand l'état d'ouverture change */
  onOpenChange?: (open: boolean) => void;
}

/**
 * Combobox pour sélectionner des communes d'un département français
 * Composant métier spécifique au contexte ABC Cours
 *
 * @example
 * <CommuneCombobox
 *   departmentCode="75"
 *   onSelect={(code) => addCity(code)}
 *   selectedCodes={['75056', '75108']}
 * />
 */
export const CommuneCombobox = ({
  departmentCode,
  onSelect,
  selectedCodes = [],
  placeholder = 'Sélectionner une commune...',
  open: controlledOpen,
  onOpenChange,
}: CommuneComboboxProps) => {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const [communes, setCommunles] = React.useState<Commune[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Mode contrôlé si open et onOpenChange sont fournis, sinon mode non-contrôlé
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;

  React.useEffect(() => {
    console.log('[CommuneCombobox] Render avec selectedCodes:', selectedCodes);
  }, [selectedCodes]);

  // Charger les communes quand le popover s'ouvre ou que le département change
  React.useEffect(() => {
    if (isOpen && communes.length === 0) {
      loadCommunnes();
    }
  }, [isOpen, departmentCode]);

  const loadCommunnes = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await geoApiService.getCommunesByDepartment(departmentCode);

      if (data.length === 0) {
        setError(`Aucune commune trouvée pour le département ${departmentCode}`);
      }

      setCommunles(data);
    } catch (err) {
      setError('Erreur lors du chargement des communes');
      console.error('[CommuneCombobox] Erreur:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (onOpenChange) {
      onOpenChange(newOpen);
    } else {
      setInternalOpen(newOpen);
    }
  };

  const handleSelect = (communeCode: string) => {
    onSelect(communeCode);
    // Ne pas fermer le Popover automatiquement
    // Il se fermera uniquement quand l'utilisateur clique en dehors
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
          <CommandInput placeholder="Rechercher une commune..." />
          <CommandList>
            {isLoading ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="ml-2 text-sm text-gray-500">Chargement...</span>
              </div>
            ) : error ? (
              <CommandEmpty className="text-red-500">{error}</CommandEmpty>
            ) : communes.length === 0 ? (
              <CommandEmpty>Aucune commune trouvée.</CommandEmpty>
            ) : (
              <CommandGroup>
                {communes.map((commune) => {
                  const isSelected = selectedCodes.includes(commune.code);
                  const postalCode = commune.codesPostaux?.[0] || commune.code;
                  const displayName = `${commune.nom} (${postalCode})`;
                  return (
                    <CommandItem
                      key={commune.code}
                      value={`${commune.code} ${commune.nom} ${postalCode}`}
                      onSelect={() => handleSelect(commune.code)}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          isSelected ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      {displayName}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};