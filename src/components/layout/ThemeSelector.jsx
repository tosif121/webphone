import { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { useTheme } from 'next-themes';

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
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Apply theme to document root immediately
  useEffect(() => {
    if (mounted && theme) {
      const root = document.documentElement;
      
      // Remove all existing theme data attributes
      colorThemes.forEach(({ value }) => {
        root.removeAttribute(`data-theme-${value}`);
      });
      
      // Set current theme data attribute
      root.setAttribute('data-theme', theme || 'default');
      
      // Force a re-render by updating CSS custom properties
      if (theme && theme !== 'default') {
        root.style.setProperty('--theme-applied', theme);
      } else {
        root.style.removeProperty('--theme-applied');
      }
    }
  }, [theme, mounted]);

  const handleSelect = (color) => {
    setTheme(color);
    setOpen(false);
  };

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <Button variant="outline" className="flex items-center gap-2">
        <span className="font-medium">Color:</span>
        <span>Loading...</span>
        <ChevronDown className="ml-2 h-4 w-4" />
      </Button>
    );
  }

  const currentTheme = colorThemes.find((c) => c.value === theme);
  const displayLabel = currentTheme?.label || 'Default';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2 text-base !py-5 rounded-lg">
          <span className="font-medium">Theme:</span>
          <span>{displayLabel}</span>
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-0">
        <div>
          {colorThemes.map((c) => (
            <Button
              key={c.value}
              variant="ghost"
              className={`w-full justify-start px-4 py-2 ${theme === c.value ? 'font-bold' : ''}`}
              onClick={() => handleSelect(c.value)}
            >
              {c.label}
              {theme === c.value && <span className="ml-auto">✓</span>}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}