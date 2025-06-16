import React, { useState, useRef, useEffect, useContext } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import HistoryContext from '@/context/HistoryContext';
import { Clock, ChevronDown, Coffee, Utensils, Clock3, Users, Activity } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from './ui/button';

const BreakDropdown = ({ bridgeID, dispoWithBreak, selectedStatus }) => {
  const { username, selectedBreak, setSelectedBreak } = useContext(HistoryContext);
  const [timer, setTimer] = useState(0);
  const [breakTypes, setBreakTypes] = useState([]);
  const timerRef = useRef(null);

  // Map break types to icons dynamically based on keywords
  const getBreakIcon = (label) => {
    if (!label) return Activity;
    const lowerLabel = label.toLowerCase();
    if (lowerLabel.includes('lunch') || lowerLabel.includes('dinner') || lowerLabel.includes('meal')) return Utensils;
    if (lowerLabel.includes('coffee') || lowerLabel.includes('tea') || lowerLabel.includes('drink')) return Coffee;
    if (lowerLabel.includes('short') || lowerLabel.includes('quick') || lowerLabel.includes('brief')) return Clock3;
    if (lowerLabel.includes('meeting') || lowerLabel.includes('call') || lowerLabel.includes('conference'))
      return Users;
    if (lowerLabel.includes('break') || lowerLabel.includes('rest') || lowerLabel.includes('pause')) return Clock;
    return Activity;
  };

  useEffect(() => {
    const tokenData = localStorage.getItem('token');
    let transformedBreakOptions = [];
    if (tokenData) {
      const parsedData = JSON.parse(tokenData);
      const rawBreakOptions = parsedData?.userData?.breakoptions || [];
      transformedBreakOptions = rawBreakOptions.map((option) => {
        const type = option.value || option.type || option.name || option.id;
        const label = option.label || option.name || option.title || option.value || option.type;
        const id = option.id || option.value || option.type;
        return {
          type: type,
          label: label,
          icon: getBreakIcon(label),
          id: id,
        };
      });
    }
    if (transformedBreakOptions.length === 0) {
      transformedBreakOptions = [
        {
          type: 'General Break',
          label: 'Break',
          icon: getBreakIcon('General Break'),
          id: 'default-general',
        },
      ];
    }
    setBreakTypes(transformedBreakOptions);
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
      await axios.post(`${window.location.origin}/user/removebreakuser:${username}`);
      setSelectedBreak('Break');
      toast.success('Break removed successfully');
    } catch (error) {
      console.error('Error removing break:', error);
      toast.error('Error removing break');
    }
  };

  const handleBreakAction = async (breakType) => {
    if (selectedBreak !== 'Break') {
      await removeBreak();
      return;
    }
    try {
      if (dispoWithBreak && breakType !== 'Break') {
        await axios.post(
          `${window.location.origin}/user/disposition${username}`,
          { bridgeID, Disposition: `dispoWithBreak` },
          { headers: { 'Content-Type': 'application/json' } }
        );
      }
      await axios.post(`${window.location.origin}/user/breakuser:${username}`, { breakType });
      setSelectedBreak(breakType);
      toast.success('Break applied successfully');
    } catch (error) {
      console.error('Error applying break:', error);
      toast.error('Error applying break');
    }
  };

  const isOnBreak = selectedBreak !== 'Break';
  const selectedBreakObj = breakTypes.find((b) => b.type === selectedBreak);

  return (
    <>
      {isOnBreak ? (
        <Button
          variant="default"
          className={`${
            (dispoWithBreak && 'w-auto') || 'w-full sm:w-auto'
          } gap-2 font-medium sm:w-auto justify-baseline`}
          onClick={removeBreak}
        >
          {selectedBreakObj?.icon ? <selectedBreakObj.icon className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
          <span>{selectedBreakObj?.label}</span>
          <span className="flex items-center gap-1 ml-2 text-xs">
            <Clock className="w-3 h-3" />
            {formatTime(timer)}
          </span>
        </Button>
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger
            asChild
            className={`${(dispoWithBreak && 'w-auto') || 'w-full sm:w-auto'} justify-baseline`}
          >
            <Button variant="outline" className="gap-2 font-medium">
              <Activity className="w-4 h-4" />
              <span>Take Break</span>
              <ChevronDown className="w-4 h-4 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {breakTypes.map(({ type, label, icon: Icon, id }) => (
              <DropdownMenuItem key={id} onClick={() => handleBreakAction(type)} className="gap-3 cursor-pointer">
                <Icon className="w-4 h-4 text-muted-foreground" />
                <span>{label}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </>
  );
};

export default BreakDropdown;
