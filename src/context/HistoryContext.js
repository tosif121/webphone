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

  // Load call history from localStorage on client-side hydration
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const callHistory = localStorage.getItem('call-history');
        if (callHistory) {
          setHistory(JSON.parse(callHistory));
        }
      } catch (error) {
        console.error('Error loading call history from localStorage:', error);
      }
    }
  }, []);

  // Save call history to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('call-history', JSON.stringify(history));
    }
  }, [history]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        // Try 'username' first, then fall back to 'savedUsername'
        const storedUsername = localStorage.getItem('username') ?? localStorage.getItem('savedUsername');
        // Try 'password' first, then fall back to 'savedPassword'
        const storedPassword = localStorage.getItem('password') ?? localStorage.getItem('savedPassword');

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
