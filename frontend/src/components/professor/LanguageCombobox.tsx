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
import { LANGUAGES, getLanguageName } from '@/constants/languages';

interface LanguageComboboxProps {
  /** Valeur sélectionnée (code ISO de la langue) */
  value?: string;
  /** Callback appelé quand une langue est sélectionnée */
  onSelect: (languageCode: string) => void;
  /** Placeholder du bouton */
  placeholder?: string;
}

/**
 * Combobox pour sélectionner une langue maternelle
 * Composant métier spécifique au contexte ABC Cours
 *
 * @example
 * <LanguageCombobox
 *   value={formData.nativeLanguage}
 *   onSelect={(code) => handleInputChange('nativeLanguage', code)}
 * />
 */
export const LanguageCombobox = ({
  value,
  onSelect,
  placeholder = 'Sélectionner une langue...',
}: LanguageComboboxProps) => {
  const [open, setOpen] = React.useState(false);

  const handleSelect = (languageCode: string) => {
    onSelect(languageCode);
    setOpen(false);
  };

  const displayValue = value ? getLanguageName(value) : placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'w-full justify-between',
            !value && 'text-muted-foreground'
          )}
        >
          {displayValue}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Rechercher une langue..." />
          <CommandList>
            <CommandEmpty>Aucune langue trouvée.</CommandEmpty>
            <CommandGroup>
              {LANGUAGES.map((language) => (
                <CommandItem
                  key={language.code}
                  value={language.name}
                  onSelect={() => handleSelect(language.code)}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === language.code ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {language.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};