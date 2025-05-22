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
  info: false,
  setInfo: () => {},
  selectedStatus: '',
  setSelectedStatus: () => {},
});

export const HistoryProvider = ({ children }) => {
  // Initialize history from localStorage
  const callHistory = typeof window !== 'undefined' ? localStorage.getItem('call-history') : null;
  const initialHistory = callHistory ? JSON.parse(callHistory) : [];

  // Initialize only username from localStorage (more secure)
  const savedUsername = typeof window !== 'undefined' ? localStorage.getItem('saved-username') : '';

  const [history, setHistory] = useState(initialHistory);
  const [username, setUsername] = useState(savedUsername || '');
  const [password, setPassword] = useState('');
  const [selectedBreak, setSelectedBreak] = useState('Break');
  const [dropCalls, setDropCalls] = useState(false);
  const [info, setInfo] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');

  // Persist history to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('call-history', JSON.stringify(history));
    }
  }, [history]);

  // Persist username to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (username) {
        localStorage.setItem('saved-username', username);
      } else {
        localStorage.removeItem('saved-username');
      }
    }
  }, [username]);

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
        info,
        setInfo,
        selectedStatus,
        setSelectedStatus,
      }}
    >
      {children}
    </HistoryContext.Provider>
  );
};

export default HistoryContext;
