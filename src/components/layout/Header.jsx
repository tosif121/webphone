import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useState, useEffect, useContext, useRef } from 'react';
import {
  Menu,
  X,
  LogOut,
  ChevronDown,
  User,
  Settings,
  LayoutDashboard,
  PhoneCall,
  UserCircle,
  Rocket,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

import ThemeToggle from './ThemeToggle';
import BreakDropdown from '../BreakDropdown';
import HistoryContext from '@/context/HistoryContext';

export default function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const { setDropCalls, dropCalls, selectedStatus, campaignMissedCallsLength } = useContext(HistoryContext);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const [username, setUsername] = useState('Guest');
  const [userId, setUserId] = useState('N/A');
  const [campaignName, setCampaignName] = useState('N/A');

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
    toast.success('Logged out!');
    localStorage.clear();
    window.location.href = '/login';
    setUserMenuOpen(false);
  };

  useEffect(() => {
    // Only runs on client
    const tokenData = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (tokenData) {
      try {
        const parsedData = JSON.parse(tokenData);
        setUsername(parsedData?.userData?.username || 'Guest');
        setUserId(parsedData?.userData?.userid || 'N/A');
        setCampaignName(parsedData?.userData?.campaign || 'N/A');
        setUserRole(parsedData?.userData?.role || null);
      } catch (e) {
        // If parsing fails, fallback to default
        setUsername('Guest');
        setUserId('N/A');
        setCampaignName('N/A');
        setUserRole(null);
      }
    }
  }, []);

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
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userMenuOpen]);

  const getInitials = (name = '') => {
    const words = name.trim().split(' ');
    return words
      .map((w) => w[0]?.toUpperCase())
      .slice(0, 2)
      .join('');
  };

  return (
    <header className="w-full backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border-b border-white/20 dark:border-slate-700/20 sticky top-0 z-40 shadow-lg shadow-blue-500/5">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <PhoneCall className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent hidden sm:block">
            SAMWAD
          </span>
        </div>

        {/* Desktop Nav */}
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

          {/* Single Modern User Dropdown */}
          <div className="relative" ref={userMenuRef}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setUserMenuOpen((open) => !open)}
              aria-expanded={userMenuOpen}
              aria-haspopup="true"
              className="flex items-center cursor-pointer gap-3 px-3 py-2 rounded-xl hover:bg-white/50 dark:hover:bg-slate-800/40 transition-all"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-blue-500/20">
                {getInitials(username)}
              </div>
              <div className="hidden sm:flex flex-col items-start">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{username}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">{userId}</span>
              </div>
              <ChevronDown
                className={cn('w-4 h-4 transition-transform duration-200 text-slate-500', userMenuOpen && 'rotate-180')}
              />
            </Button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-80 backdrop-blur-md bg-white/95 dark:bg-slate-800/95 border border-white/20 dark:border-slate-700/20 rounded-xl shadow-xl shadow-blue-500/10 z-50 overflow-hidden animate-in slide-in-from-top-2 duration-200">
                {/* User Info Header */}
                <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700 border-b border-slate-200 dark:border-slate-600">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20">
                      {getInitials(username)}
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
                        {username}
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-300">ID: {userId}</div>
                    </div>
                  </div>
                </div>

                {/* Campaign Info */}
                <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <Rocket className="w-4 h-4 text-blue-500" />
                      Campaign
                    </div>
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{campaignName}</span>
                  </div>
                </div>

                {/* Navigation Links */}
                <div className="py-2">
                  {pathname !== '/dashboard' ? (
                    <Link
                      href="/dashboard"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-700/50 transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4 text-purple-500" />
                      Agent Panel
                    </Link>
                  ) : (
                    <Link
                      href="/agent-dashboard"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-700/50 transition-colors"
                    >
                      <User className="w-4 h-4 text-green-600" />
                      Agent Dashboard
                    </Link>
                  )}

                  <Link
                    href={'/'}
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    Your Profile
                  </Link>

                  <Link
                    href={'/'}
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <Settings className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    Settings
                  </Link>
                </div>

                {/* Theme Toggle */}
                <div className="py-2 px-4 border-t border-slate-200 dark:border-slate-700">
                  {/* Logout */}
                  <ThemeToggle />
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
        </div>

        {/* Mobile Menu Button */}
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

      {/* Mobile Menu */}
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
