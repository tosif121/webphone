import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useState, useEffect, useContext, useRef } from 'react';
import { Menu, X, LogOut, ChevronDown, User, Settings, LayoutDashboard, PhoneCall } from 'lucide-react';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';
import Cookies from 'js-cookie';
import ThemeToggle from './ThemeToggle';
import BreakDropdown from '../BreakDropdown';
import HistoryContext from '@/context/HistoryContext';

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const { setDropCalls, dropCalls, selectedStatus, campaignMissedCallsLength } = useContext(HistoryContext);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const userMenuRef = useRef(null);

  const navLinks = [
    {
      name: 'Dashboard',
      href: '/',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
  ];

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);

  const handleLogout = () => {
    Cookies.remove('samwad_token', { path: '/' });
    toast.success('Logged out!');
    localStorage.clear();
    router.push('/');
    setUserMenuOpen(false);
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    }

    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    // Cleanup
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userMenuOpen]);

  return (
    <header className="w-full backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border-b border-white/20 dark:border-slate-700/20 sticky top-0 z-40 shadow-lg shadow-blue-500/5">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <PhoneCall className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent hidden sm:block">
            SAMWAD
          </span>
        </div>

        <div className="hidden md:flex items-center gap-4">
          <nav className="flex gap-2">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2',
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20'
                      : 'text-slate-700 hover:bg-white/50 dark:text-slate-200 dark:hover:bg-slate-800/40'
                  )}
                >
                  {link.icon}
                  {link.name}
                </Link>
              );
            })}
            <button
              onClick={() => setDropCalls(true)}
              className={cn(
                'relative flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all focus:outline-none',
                dropCalls
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-white/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700 text-blue-700 dark:text-blue-200 hover:bg-blue-50 dark:hover:bg-blue-900/30'
              )}
              aria-label="Show Missed Calls"
              type="button"
            >
              <PhoneCall className={cn('w-5 h-5', dropCalls ? 'text-white' : 'text-blue-600 dark:text-blue-300')} />
              <span className="font-medium">Missed Calls</span>
              {campaignMissedCallsLength > 0 && (
                <span
                  className="
        absolute -top-2 -right-2 min-w-[1.5rem] h-6 flex items-center justify-center
        rounded-full bg-blue-600 text-white text-xs font-bold px-2 shadow
        border-2 border-white dark:border-slate-900
      "
                >
                  {campaignMissedCallsLength}
                </span>
              )}
            </button>

            <BreakDropdown dispoWithBreak={false} selectedStatus={selectedStatus} />
          </nav>

          <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>

          <div className="relative" ref={userMenuRef}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setUserMenuOpen((open) => !open)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-white/50 dark:hover:bg-slate-800/40"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500/20 to-indigo-600/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
              <span className="hidden sm:inline font-medium">
                {userRole === 'super_admin' ? 'Super Admin' : 'Admin'}
              </span>
              <ChevronDown className={cn('w-4 h-4 transition-transform duration-200', userMenuOpen && 'rotate-180')} />
            </Button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 backdrop-blur-md bg-white/90 dark:bg-slate-800/90 border border-white/20 dark:border-slate-700/20 rounded-xl shadow-xl shadow-blue-500/5 z-50 overflow-hidden">
                <div className="py-2">
                  <Link
                    href={userRole === 'super_admin' ? '/super-admin/profile' : '/admin/profile'}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-blue-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    Your Profile
                  </Link>
                  <Link
                    href={userRole === 'super_admin' ? '/super-admin/settings' : '/admin/settings'}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-blue-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <Settings className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    Settings
                  </Link>
                </div>
                <div className="py-2 border-t border-slate-200 dark:border-slate-700">
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>

          <ThemeToggle />
        </div>

        <div className="flex md:hidden items-center gap-3">
          <ThemeToggle />
          <button
            onClick={toggleMobileMenu}
            className="p-2 rounded-full hover:bg-white/50 dark:hover:bg-slate-800/40 transition-colors"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden backdrop-blur-md bg-white/90 dark:bg-slate-900/90 border-t border-white/20 dark:border-slate-700/20 px-4 py-3 space-y-1 animate-in slide-in-from-top">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all',
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                    : 'hover:bg-white/50 dark:hover:bg-slate-800/40'
                )}
              >
                {link.icon}
                {link.name}
              </Link>
            );
          })}

          <button
            onClick={() => {
              setMobileMenuOpen(false);
              handleLogout();
            }}
            className="flex w-full items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors mt-2"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      )}
    </header>
  );
}
