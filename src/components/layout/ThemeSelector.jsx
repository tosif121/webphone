import { useState, useEffect } from 'react';
import { Palette, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

const colorThemes = [
  {
    label: 'Default',
    value: 'default',
    color: 'bg-[oklch(0.208_0.042_265.755)]',
    border: 'border-[oklch(0.704_0.04_256.788)]',
  },
  {
    label: 'Blue',
    value: 'blue',
    color: 'bg-[oklch(0.546_0.245_262.881)]',
    border: 'border-[oklch(0.623_0.214_259.815)]',
  },
  {
    label: 'Green',
    value: 'green',
    color: 'bg-[oklch(0.648_0.2_131.684)]',
    border: 'border-[oklch(0.648_0.2_131.684)]',
  },
  {
    label: 'Amber',
    value: 'amber',
    color: 'bg-[oklch(0.666_0.179_58.318)]',
    border: 'border-[oklch(0.769_0.188_70.08)]',
  },
  {
    label: 'Rose',
    value: 'rose',
    color: 'bg-[oklch(0.586_0.253_17.585)]',
    border: 'border-[oklch(0.645_0.246_16.439)]',
  },
  {
    label: 'Purple',
    value: 'purple',
    color: 'bg-[oklch(0.558_0.288_302.321)]',
    border: 'border-[oklch(0.627_0.265_303.9)]',
  },
  {
    label: 'Orange',
    value: 'orange',
    color: 'bg-[oklch(0.646_0.222_41.116)]',
    border: 'border-[oklch(0.705_0.213_47.604)]',
  },
  {
    label: 'Teal',
    value: 'teal',
    color: 'bg-[oklch(0.6_0.118_184.704)]',
    border: 'border-[oklch(0.704_0.14_182.503)]',
  },
];

// Enhanced storage that persists across refreshes
const themeStorage = {
  getItem: (key) => {
    try {
      // First check localStorage if available
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(key);
        if (stored) return stored;
      }
    } catch (e) {
      // localStorage not available, continue with fallbacks
    }

    // Fallback to data attributes
    const fromDataAttr = document.documentElement.getAttribute('data-color-theme');
    if (fromDataAttr) return fromDataAttr;

    // Check existing theme classes
    const existingTheme = colorThemes.find((theme) => document.documentElement.classList.contains(theme.value));
    return existingTheme ? existingTheme.value : 'default';
  },

  setItem: (key, value) => {
    try {
      // Try localStorage first
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, value);
      }
    } catch (e) {
      // localStorage failed, continue with fallbacks
    }

    // Always set data attribute as backup
    document.documentElement.setAttribute('data-color-theme', value);
  },
};

export default function ThemeSelector() {
  const [mounted, setMounted] = useState(false);
  const [currentTheme, setCurrentTheme] = useState(() => themeStorage.getItem('color-theme') || 'default');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      const html = document.documentElement;
      // Remove all theme classes
      colorThemes.forEach(({ value }) => html.classList.remove(value));
      // Add selected theme class
      if (currentTheme !== 'default') {
        html.classList.add(currentTheme);
      }
      // Save to storage
      themeStorage.setItem('color-theme', currentTheme);
    }
  }, [currentTheme, mounted]);

  useEffect(() => {
    if (mounted) {
      const html = document.documentElement;

      // Remove all theme classes
      colorThemes.forEach(({ value }) => {
        html.classList.remove(value);
      });

      // Add selected theme class
      if (currentTheme !== 'default') {
        html.classList.add(currentTheme);
      }

      // Save to our storage mechanism
      themeStorage.setItem('color-theme', currentTheme);
    }
  }, [currentTheme, mounted]);

  const handleSelect = (themeValue, event) => {
    // Prevent event from bubbling up to parent dropdowns
    event.stopPropagation();
    setCurrentTheme(themeValue);
  };

  // Prevent clicks on the dropdown content from closing parent menus
  const handleDropdownClick = (event) => {
    event.stopPropagation();
  };

  if (!mounted) {
    return (
      <Button variant="outline" className="flex items-center gap-3 px-4 py-2">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-gray-300 animate-pulse"></div>
          <span className="text-sm font-medium">Loading...</span>
        </div>
        <Palette className="w-4 h-4" />
      </Button>
    );
  }

  const selectedTheme = colorThemes.find((c) => c.value === currentTheme) || colorThemes[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="flex items-center gap-3 px-4 py-2"
          onClick={handleDropdownClick} // Prevent trigger click from bubbling
        >
          <div className="flex items-center gap-2">
            <div className={`w-5 h-5 rounded-full ${selectedTheme.color} ${selectedTheme.border} border-2`}></div>
            <span className="text-sm font-medium">{selectedTheme.label}</span>
          </div>
          <Palette className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-56 p-3"
        onClick={handleDropdownClick} // Prevent content clicks from bubbling
      >
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">
          Choose Theme
        </div>

        <div className="grid grid-cols-2 gap-1">
          {colorThemes.map((theme) => (
            <DropdownMenuItem
              key={theme.value}
              onClick={(e) => handleSelect(theme.value, e)}
              className="flex items-center gap-3 p-3 rounded-lg cursor-pointer focus:bg-accent focus:text-accent-foreground"
            >
              <div className="relative">
                <div className={`w-6 h-6 rounded-full ${theme.color} ${theme.border} border-2 shadow-sm`}></div>
                {currentTheme === theme.value && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Check className="w-3 h-3 text-white drop-shadow-sm" />
                  </div>
                )}
              </div>
              <span className="text-sm font-medium flex-1">{theme.label}</span>
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
