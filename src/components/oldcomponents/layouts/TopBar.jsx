import { useEffect, useState, useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../../hooks/useTheme';
import {
  FaSignOutAlt,
  FaUser,
  FaIdBadge,
  FaRocket,
  FaPalette,
  FaUserTie,
  FaChevronDown,
  FaTachometerAlt,
} from 'react-icons/fa';
import BreakDropdown from '../../BreakDropdown';
import HistoryContext from '../../context/HistoryContext';
import { RiMoonLine, RiSunLine } from 'react-icons/ri';

const TopBar = () => {
  const toggleTheme = useTheme();
  const location = useLocation();
  const { setDropCalls, selectedStatus } = useContext(HistoryContext);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const tokenData = localStorage.getItem('token');
  const parsedData = JSON.parse(tokenData);
  const username = parsedData?.userData?.username || 'Guest';
  const userId = parsedData?.userData?.userid || 'N/A';
  const campaignName = parsedData?.userData?.campaign || 'N/A';

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/webphone/login';
  };

  const getInitials = (name = '') => {
    const words = name.trim().split(' ');
    return words
      .map((w) => w[0]?.toUpperCase())
      .slice(0, 2)
      .join('');
  };

  const handleOutsideClick = (e) => {
    if (!e.target.closest('.user-dropdown')) {
      setShowUserDropdown(false);
    }
  };

  useEffect(() => {
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  useEffect(() => {
    setShowUserDropdown(false); // Close dropdown on route change
  }, [location.pathname]);

  const handleThemeToggle = () => {
    toggleTheme();
    setShowUserDropdown(false);
  };

  return (
    <header className="bg-white h-16 flex items-center p-4 justify-between dark:bg-[#1a1a1a] border-b dark:border-[#333] border-[#ddd] sticky top-0 z-50">
      <Link to="/webphone/dashboard">
        <img src={`https://esamwad.iotcom.io/webphone/images/logo.png`} alt="Logo" width={48} height={48} />
      </Link>

      <div className="flex items-center gap-x-3 flex-wrap md:flex-nowrap">
        {location.pathname === '/webphone/dashboard' && (
          <>
            <button
              onClick={() => setDropCalls(true)}
              className="primary-btn text-sm md:text-base whitespace-nowrap"
              disabled={selectedStatus !== 'start'}
            >
              Drop Calls
            </button>
            <BreakDropdown dispoWithBreak={false} selectedStatus={selectedStatus} />
          </>
        )}

        {/* User Dropdown */}
        <div className="relative user-dropdown">
          <button
            onClick={() => setShowUserDropdown((prev) => !prev)}
            aria-expanded={showUserDropdown}
            aria-haspopup="true"
            className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-[#00498e] rounded-md text-sm font-semibold text-primary dark:text-white hover:bg-gray-200 dark:hover:bg-[#003366] transition duration-200"
          >
            <span className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-300 dark:bg-white text-primary font-bold">
              {getInitials(username)}
            </span>
            <FaChevronDown className="text-xs" />
          </button>

          {showUserDropdown && (
            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#1a1a1a] shadow-xl rounded-lg border dark:border-[#333] z-50 transition-opacity duration-300 ease-in-out opacity-100">
              <div className="px-4 py-3 border-b dark:border-[#333]">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-white">
                  <FaUserTie />
                  {username}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <FaIdBadge />
                  {userId}
                </div>
              </div>

              <ul className="text-sm text-gray-800 dark:text-gray-200 divide-y divide-gray-100 dark:divide-gray-700">
                <li className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-[#333] transition duration-200 justify-between">
                  <div className="flex items-center gap-2">
                    <FaRocket className="text-blue-500" />
                    Campaign Id
                  </div>

                  <span className="font-semibold">{campaignName}</span>
                </li>
                {(location.pathname !== '/webphone/dashboard' && (
                  <li className="hover:bg-gray-100 dark:hover:bg-[#333] transition duration-200">
                    <Link to="/webphone/dashboard" className="flex items-center gap-2 px-4 py-2 w-full">
                      <FaTachometerAlt className="text-purple-500" />
                      Agent Panel
                    </Link>
                  </li>
                )) || (
                  <li className="hover:bg-gray-100 dark:hover:bg-[#333] transition duration-200">
                    <Link to="/webphone/agent-dashboard" className="flex items-center gap-2 px-4 py-2 w-full">
                      <FaUser className="text-green-600" />
                      Agent Dashboard
                    </Link>
                  </li>
                )}

                <li
                  className="flex items-center gap-2 px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-[#333] transition duration-200"
                  onClick={handleThemeToggle}
                >
                  <DarkModeToggle toggleTheme={toggleTheme} />
                </li>

                <li
                  className="flex items-center gap-2 px-4 py-2 text-red-500 cursor-pointer hover:bg-gray-100 dark:hover:bg-[#333] transition duration-200"
                  onClick={handleLogout}
                >
                  <FaSignOutAlt />
                  Logout
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

const DarkModeToggle = ({ toggleTheme }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const currentTheme = localStorage.getItem('theme');
    setIsDarkMode(currentTheme === 'dark');
  }, []);

  const handleToggle = () => {
    toggleTheme();
    setIsDarkMode((prevMode) => !prevMode);
  };

  return (
    <>
      <label htmlFor="dark-toggle" className="flex items-center cursor-pointer justify-between w-full">
        <div className="flex items-center gap-2 ">
          {isDarkMode ? (
            <RiMoonLine className="text-white" width={16} height={16} />
          ) : (
            <RiSunLine className="text-black" width={16} height={16} />
          )}
          <div className="font-medium text-gray-900 dark:text-[#00498e]">{isDarkMode ? 'Dark' : 'Light'}</div>
        </div>
        <div className="relative">
          <input type="checkbox" id="dark-toggle" className="hidden" checked={isDarkMode} onChange={handleToggle} />
          <DarkModeSlider isDarkMode={isDarkMode} />
        </div>
      </label>
    </>
  );
};

const DarkModeSlider = ({ isDarkMode }) => (
  <div className="block w-14 h-7 rounded-full border-[1px] border-yellow-300 dark:border-[#00498e] bg-yellow-100 dark:bg-[#1a1a1a]">
    <div
      className={`absolute left-1 top-1 w-5 h-5 flex items-center justify-center rounded-full transition-transform duration-500 transform ${
        isDarkMode ? 'translate-x-6' : ''
      } bg-yellow-400 dark:bg-[#00498e]`}
    >
      {isDarkMode ? (
        <RiMoonLine className="text-white" width={16} height={16} />
      ) : (
        <RiSunLine className="text-white" width={16} height={16} />
      )}
    </div>
  </div>
);

export default TopBar;
