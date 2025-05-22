import React, { useState, useRef, useEffect, useContext } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import HistoryContext from '@/context/HistoryContext';
import { Clock } from 'lucide-react';

const BreakDropdown = ({ bridgeID, dispoWithBreak, selectedStatus }) => {
  const { username, selectedBreak, setSelectedBreak } = useContext(HistoryContext);
  const [isOpen, setIsOpen] = useState(false);
  const [timer, setTimer] = useState(0);
  const dropdownRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (selectedBreak !== 'Break') {
      setTimer(0);
      timerRef.current = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
      setTimer(0);
    }

    return () => {
      clearInterval(timerRef.current);
    };
  }, [selectedBreak]);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const removeBreak = async () => {
    try {
      const response = await axios.post(`https://esamwad.iotcom.io/user/removebreakuser:${username}`);
      if (response.status === 200) {
        setSelectedBreak('Break');
        setIsOpen(false);
      }
    } catch (error) {
      console.error('Error removing break:', error);
    }
  };

  const sendBreakSelection = async (breakType) => {
    if (selectedBreak !== 'Break') {
      await removeBreak();
      return;
    }

    try {
      if (dispoWithBreak && breakType !== 'Break') {
        const dispositionData = {
          bridgeID: bridgeID,
          Disposition: `dispoWithBreak`,
        };

        const dispositionResponse = await axios.post(
          `https://esamwad.iotcom.io/user/disposition${username}`,
          dispositionData,
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (!dispositionResponse.data.success) {
          throw new Error('Disposition failed');
        }
      }

      const response = await axios.post(`https://esamwad.iotcom.io/user/breakuser:${username}`, {
        breakType,
      });

      if (response.status === 200) {
        setSelectedBreak(breakType);
        setIsOpen(false);
        toast.success('Break applied successfully');
      }
    } catch (error) {
      console.error('Error selecting break:', error);
      toast.error('Error applying break');
    }
  };

  const handleButtonClick = () => {
    if (selectedBreak === 'Break') {
      setIsOpen(!isOpen);
    } else {
      removeBreak();
    }
  };

  const breakTypes = [
    { type: 'TeaBreak', label: 'Tea Break', color: 'green-500' },
    { type: 'LunchBreak', label: 'Lunch Break', color: 'green-500' },
    { type: 'TrainingBreak', label: 'Training Break', color: 'green-500' },
  ];

  const buttonClassName =
    selectedBreak === 'Break'
      ? 'primary-btn'
      : `px-4 py-2 text-white bg-${
          breakTypes.find((b) => b.type === selectedBreak)?.color
        } rounded-md focus:outline-none flex items-center space-x-2`;

  return (
    <div className="relative inline-block text-left">
      <button onClick={handleButtonClick} className={buttonClassName} disabled={selectedStatus !== 'start'}>
        <span>{selectedBreak === 'Break' ? 'Break' : `${selectedBreak.replace('Break', '')} Break`}</span>
        {selectedBreak !== 'Break' && (
          <div className="flex items-center space-x-1">
            <Clock className="w-4 h-4" />
            <span>{formatTime(timer)}</span>
          </div>
        )}
      </button>

      {isOpen && selectedBreak === 'Break' && (
        <ul
          ref={dropdownRef}
          className="absolute z-10 mt-2 w-48 bg-white border dark:bg-black/50 dark:text-white dark:border-[#999] border-gray-200 rounded-md shadow-lg"
        >
          {breakTypes.map(({ type, label }) => (
            <li
              key={type}
              onClick={() => sendBreakSelection(type)}
              className="px-4 py-2 cursor-pointer hover:bg-gray-100 hover:dark:bg-gray-600 flex justify-between items-center group"
            >
              {label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default BreakDropdown;
