import { createContext, useEffect, useState } from 'react';

const HistoryContext = createContext({
  history: [],
  setHistory: () => {},
  username: '',
  setUsername: () => {},
  password: '',
  setPassword: () => {},
  selectedBreak: 'Break',
  setSelectedBreak: () => {},
  dropCalls: false,
  setDropCalls: () => {},
  callAlert: false,
  setCallAlert: () => {},
  info: false,
  setInfo: () => {},
  selectedStatus: '',
  setSelectedStatus: () => {},
});

export const HistoryProvider = ({ children }) => {
  // Initialize with empty array to prevent hydration mismatch
  const [history, setHistory] = useState([]);
  const [selectedBreak, setSelectedBreak] = useState('Break');
  const [dropCalls, setDropCalls] = useState(false);
  const [callAlert, setCallAlert] = useState(false);
  const [info, setInfo] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [campaignMissedCallsLength, setCampaignMissedCallsLength] = useState(0);
  const [scheduleCallsLength, setScheduleCallsLength] = useState(0);
  const [showSecurityAlert, setShowSecurityAlert] = useState(false);

  // Load call history and break state from localStorage on client-side hydration
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const callHistory = localStorage.getItem('call-history');
        if (callHistory) {
          setHistory(JSON.parse(callHistory));
        }

        const storedBreak = localStorage.getItem('selectedBreak');
        if (storedBreak && storedBreak !== 'Break') {
          setSelectedBreak(storedBreak);
        }
      } catch (error) {
        console.error('Error loading data from localStorage:', error);
      }
    }
  }, []);

  // Save selectedBreak to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (selectedBreak && selectedBreak !== 'Break') {
        localStorage.setItem('selectedBreak', selectedBreak);
      } else {
        localStorage.removeItem('selectedBreak');
      }
    }
  }, [selectedBreak]);

  // Save call history to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('call-history', JSON.stringify(history));
    }
  }, [history]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const tokenPayload = localStorage.getItem('token');
        let tokenUsername = '';

        if (tokenPayload) {
          try {
            const parsedToken = JSON.parse(tokenPayload);
            tokenUsername = parsedToken?.userData?.userid || parsedToken?.userData?.username || '';
          } catch (error) {
            console.error('Error parsing token for stored username:', error);
          }
        }

        const storedUsername = tokenUsername || localStorage.getItem('savedUsername') || localStorage.getItem('username');
        const storedPassword = localStorage.getItem('savedPassword') || localStorage.getItem('password');

        // Update state only if values exist
        if (storedUsername) setUsername(storedUsername);
        if (storedPassword) setPassword(storedPassword);
      } catch (error) {
        console.error('Error accessing localStorage:', error);
      }
    }
  }, []);

  return (
    <HistoryContext.Provider
      value={{
        history,
        setHistory,
        username,
        setUsername,
        password,
        setPassword,
        selectedBreak,
        setSelectedBreak,
        dropCalls,
        setDropCalls,
        callAlert,
        setCallAlert,
        info,
        setInfo,
        selectedStatus,
        setSelectedStatus,
        campaignMissedCallsLength,
        setCampaignMissedCallsLength,
        scheduleCallsLength,
        setScheduleCallsLength,
        showSecurityAlert,
        setShowSecurityAlert,
      }}
    >
      {children}
    </HistoryContext.Provider>
  );
};

export default HistoryContext;
