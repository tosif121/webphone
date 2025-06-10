import { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

const colorThemes = [
  { label: 'Default', value: 'default' },
  { label: 'Blue', value: 'blue' },
  { label: 'Green', value: 'green' },
  { label: 'Amber', value: 'amber' },
  { label: 'Rose', value: 'rose' },
  { label: 'Purple', value: 'purple' },
  { label: 'Orange', value: 'orange' },
  { label: 'Teal', value: 'teal' },
];

export default function ThemeSelector() {
  const [mounted, setMounted] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('default');

  useEffect(() => {
    setMounted(true);
    // Get initial theme from HTML element or default to 'default'
    const html = document.documentElement;
    const existingTheme = colorThemes.find((theme) => html.classList.contains(theme.value));
    if (existingTheme) {
      setCurrentTheme(existingTheme.value);
    }
  }, []);

  // Apply theme class to HTML element
  useEffect(() => {
    if (mounted) {
      const html = document.documentElement;

      // Remove all theme classes
      colorThemes.forEach(({ value }) => {
        html.classList.remove(value);
      });

      // Add current theme class (but not 'default' since it's the root styles)
      if (currentTheme !== 'default') {
        html.classList.add(currentTheme);
      }
    }
  }, [currentTheme, mounted]);

  const handleSelect = (themeValue) => {
    setCurrentTheme(themeValue);
  };

  if (!mounted) {
    return (
      <Button variant="outline" className="flex items-center gap-2">
        <span className="font-medium">Theme:</span>
        <span>Loading...</span>
        <ChevronDown className="ml-2 h-4 w-4" />
      </Button>
    );
  }

  const selectedTheme = colorThemes.find((c) => c.value === currentTheme) || colorThemes[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <span className="font-medium">Theme:</span>
          <span>{selectedTheme.label}</span>
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-48">
        {colorThemes.map((theme) => (
          <DropdownMenuItem
            key={theme.value}
            onClick={() => handleSelect(theme.value)}
            className={currentTheme === theme.value ? 'bg-accent text-accent-foreground space-x-5' : ''}
          >
            {theme.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
