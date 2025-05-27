import React, { useState, useRef, useEffect, useContext } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import HistoryContext from '@/context/HistoryContext';
import { Clock, Coffee, Sandwich, GraduationCap, ChevronDown } from 'lucide-react';

const breakTypes = [
  { type: 'TeaBreak', label: 'Tea Break', icon: Coffee },
  { type: 'LunchBreak', label: 'Lunch Break', icon: Sandwich },
  { type: 'TrainingBreak', label: 'Training Break', icon: GraduationCap },
];

const BreakDropdown = ({ bridgeID, dispoWithBreak, selectedStatus }) => {
  const { username, selectedBreak, setSelectedBreak } = useContext(HistoryContext);
  const [isOpen, setIsOpen] = useState(false);
  const [timer, setTimer] = useState(0);
  const dropdownRef = useRef(null);
  const timerRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (selectedBreak !== 'Break') {
      setTimer(0);
      timerRef.current = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(timerRef.current);
    } else {
      setTimer(0);
      clearInterval(timerRef.current);
    }
    // eslint-disable-next-line
  }, [selectedBreak]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const removeBreak = async () => {
    try {
      await axios.post(`https://esamwad.iotcom.io/user/removebreakuser:${username}`);
      setSelectedBreak('Break');
      setIsOpen(false);
    } catch (error) {
      toast.error('Error removing break');
    }
  };

  const sendBreakSelection = async (breakType) => {
    if (selectedBreak !== 'Break') {
      await removeBreak();
      return;
    }
    try {
      if (dispoWithBreak && breakType !== 'Break') {
        await axios.post(
          `https://esamwad.iotcom.io/user/disposition${username}`,
          { bridgeID, Disposition: `dispoWithBreak` },
          { headers: { 'Content-Type': 'application/json' } }
        );
      }
      await axios.post(`https://esamwad.iotcom.io/user/breakuser:${username}`, { breakType });
      setSelectedBreak(breakType);
      setIsOpen(false);
      toast.success('Break applied successfully');
    } catch {
      toast.error('Error applying break');
    }
  };

  const handleButtonClick = () => {
    if (selectedBreak === 'Break') setIsOpen((prev) => !prev);
    else removeBreak();
  };

  const isOnBreak = selectedBreak !== 'Break';
  const selectedBreakObj = breakTypes.find((b) => b.type === selectedBreak);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleButtonClick}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all
          ${
            isOnBreak
              ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md'
              : 'bg-white/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700 text-blue-700 dark:text-blue-200 hover:bg-blue-50 dark:hover:bg-blue-900/30'
          } ${isOpen && 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20'}
          focus:outline-none
        `}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        {isOnBreak && selectedBreakObj && <selectedBreakObj.icon className="w-5 h-5" />}
        <span>{isOnBreak ? selectedBreakObj?.label || selectedBreak : 'Take a Break'}</span>
        {isOnBreak && (
          <span className="flex items-center gap-1 ml-2 text-xs font-medium">
            <Clock className="w-4 h-4" />
            {formatTime(timer)}
          </span>
        )}
        {!isOnBreak && <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${isOpen ? 'rotate-180' : ''}`} />}
      </button>

      {/* Dropdown */}
      {isOpen && selectedBreak === 'Break' && (
        <ul
          className="
            absolute right-0 mt-2 w-48 z-50
            bg-white/90 dark:bg-slate-900/90
            border border-slate-200 dark:border-slate-700
            rounded-xl shadow-xl backdrop-blur
            py-2
          "
          role="listbox"
        >
          {breakTypes.map(({ type, label, icon: Icon }) => (
            <li
              key={type}
              onClick={() => sendBreakSelection(type)}
              className="
                flex items-center gap-3 px-4 py-3 cursor-pointer rounded-lg
                hover:bg-blue-50 dark:hover:bg-blue-900/30
                transition-colors
              "
              role="option"
              aria-selected={selectedBreak === type}
            >
              <Icon className="w-5 h-5 text-green-500" />
              <span className="font-medium text-slate-700 dark:text-slate-200">{label}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default BreakDropdown;
