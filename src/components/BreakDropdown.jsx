import React, { useState, useRef, useEffect, useContext } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import HistoryContext from '@/context/HistoryContext';
import { Clock, ChevronDown, Coffee, Utensils, Clock3, Users, Activity } from 'lucide-react';

const BreakDropdown = ({ bridgeID, dispoWithBreak, selectedStatus }) => {
  const { username, selectedBreak, setSelectedBreak } = useContext(HistoryContext);
  const [isOpen, setIsOpen] = useState(false);
  const [timer, setTimer] = useState(0);
  const [breakTypes, setBreakTypes] = useState([]);
  const dropdownRef = useRef(null);
  const timerRef = useRef(null);

  // Map break types to icons dynamically based on keywords
  const getBreakIcon = (label) => {
    if (!label) return Activity;
    
    const lowerLabel = label.toLowerCase();
    
    // Food related
    if (lowerLabel.includes('lunch') || lowerLabel.includes('dinner') || lowerLabel.includes('meal')) return Utensils;
    
    // Drink related  
    if (lowerLabel.includes('coffee') || lowerLabel.includes('tea') || lowerLabel.includes('drink')) return Coffee;
    
    // Time related
    if (lowerLabel.includes('short') || lowerLabel.includes('quick') || lowerLabel.includes('brief')) return Clock3;
    
    // Meeting/people related
    if (lowerLabel.includes('meeting') || lowerLabel.includes('call') || lowerLabel.includes('conference')) return Users;
    
    // General break related
    if (lowerLabel.includes('break') || lowerLabel.includes('rest') || lowerLabel.includes('pause')) return Clock;
    
    // Default for any other type
    return Activity;
  };

  useEffect(() => {
    const tokenData = localStorage.getItem('token');
    let transformedBreakOptions = [];
    
    if (tokenData) {
      const parsedData = JSON.parse(tokenData);
      const rawBreakOptions = parsedData?.userData?.breakoptions || [];
      
      // Handle different possible data structures flexibly
      transformedBreakOptions = rawBreakOptions.map(option => {
        // Handle different property names that might exist
        const type = option.value || option.type || option.name || option.id;
        const label = option.label || option.name || option.title || option.value || option.type;
        const id = option.id || option.value || option.type;
        
        return {
          type: type,
          label: label,
          icon: getBreakIcon(label),
          id: id
        };
      });
    }
    
    // If no break options found or array is empty, add default break options
    if (transformedBreakOptions.length === 0) {
      transformedBreakOptions = [
        {
          type: 'General Break',
          label: 'Break',
          icon: getBreakIcon('General Break'),
          id: 'default-general'
        }
      ];
    }
    
    setBreakTypes(transformedBreakOptions);
  }, []);

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
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
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
      toast.success('Break removed successfully');
    } catch (error) {
      console.error('Error removing break:', error);
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
    } catch (error) {
      console.error('Error applying break:', error);
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
        {isOnBreak && selectedBreakObj && (
          <selectedBreakObj.icon className="w-5 h-5" />
        )}
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
          className={`${(!dispoWithBreak && 'absolute') || ''}
            right-0 mt-2 w-48 z-50
            bg-white/90 dark:bg-slate-900/90
            border border-slate-200 dark:border-slate-700
            rounded-xl shadow-xl backdrop-blur
            py-2
          `}
          role="listbox"
        >
          {breakTypes.length > 0 ? (
            breakTypes.map(({ type, label, icon: Icon, id }) => (
              <li
                key={id || type}
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
            ))
          ) : (
            <li className="px-4 py-3 text-slate-500 dark:text-slate-400 text-sm">
              No break options available
            </li>
          )}
        </ul>
      )}
    </div>
  );
};

export default BreakDropdown;