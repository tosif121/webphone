import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import ThemeSelector from './ThemeSelector';

export default function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isDark = resolvedTheme === 'dark';

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  return (
    <div className="flex items-center justify-between">
      <ThemeSelector />
      <label htmlFor="theme-toggle" className="flex items-center justify-between cursor-pointer gap-3">
        {/* <div className="flex items-center gap-x-2">
        {!isDark ? <Sun className="w-3.5 h-3.5 text-yellow-400" /> : <Moon className="w-3.5 h-3.5 text-blue-500" />}
        <span className="text-xs font-medium text-gray-700 dark:text-gray-200 select-none">
          {isDark ? 'Dark' : 'Light'}
        </span>
      </div> */}
        <div className="relative">
          <input type="checkbox" id="theme-toggle" className="sr-only" checked={isDark} onChange={toggleTheme} />
          {/* Track adapts to theme */}
          <div
            className={`block w-14 h-7 rounded-full transition-colors duration-300 ${
              isDark ? 'bg-gray-700' : 'bg-gray-300'
            }`}
          ></div>
          {/* Sliding dot with icon */}
          <div
            className={`dot absolute top-1 w-5 h-5 rounded-full transition-transform duration-300 ease-in-out flex items-center justify-center
            ${isDark ? 'translate-x-7 bg-black/50' : 'translate-x-1 bg-white'}`}
          >
            {!isDark ? <Sun className="w-3.5 h-3.5 text-yellow-400" /> : <Moon className="w-3.5 h-3.5 text-blue-500" />}
          </div>
        </div>
      </label>
    </div>
  );
}
