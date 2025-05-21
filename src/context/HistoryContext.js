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
  const callHistory = typeof window !== 'undefined' ? localStorage.getItem('call-history') : null;
  const initialHistory = callHistory ? JSON.parse(callHistory) : [];

  const [history, setHistory] = useState(initialHistory);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedBreak, setSelectedBreak] = useState('Break');
  const [dropCalls, setDropCalls] = useState(false);
  const [info, setInfo] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('call-history', JSON.stringify(history));
    }
  }, [history]);

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
