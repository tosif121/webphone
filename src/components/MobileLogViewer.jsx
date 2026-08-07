'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Terminal, Copy, Check, Trash2, X, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Global memory buffer for logs so they persist across component re-renders
const globalLogBuffer = [];
const logListeners = new Set();

const addGlobalLog = (level, args) => {
  const timestamp = new Date().toISOString().split('T')[1].slice(0, 12);
  const message = args
    .map((arg) => {
      if (typeof arg === 'object' && arg !== null) {
        try {
          return JSON.stringify(arg, null, 2);
        } catch (_) {
          return String(arg);
        }
      }
      return String(arg);
    })
    .join(' ');

  const entry = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    timestamp,
    level,
    message,
  };

  globalLogBuffer.push(entry);
  if (globalLogBuffer.length > 500) {
    globalLogBuffer.shift();
  }

  logListeners.forEach((listener) => listener([...globalLogBuffer]));
};

// Override console methods once globally
if (typeof window !== 'undefined' && !window.__mobileLoggerInitialized) {
  window.__mobileLoggerInitialized = true;

  const originalLog = console.log;
  const originalWarn = console.warn;
  const originalError = console.error;

  console.log = (...args) => {
    originalLog(...args);
    addGlobalLog('info', args);
  };

  console.warn = (...args) => {
    originalWarn(...args);
    addGlobalLog('warn', args);
  };

  console.error = (...args) => {
    originalError(...args);
    addGlobalLog('error', args);
  };

  window.addEventListener('mobileLog', (e) => {
    if (e.detail) {
      addGlobalLog(e.detail.level || 'info', [e.detail.message || e.detail]);
    }
  });
}

export default function MobileLogViewer() {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState(() => [...globalLogBuffer]);
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState('all');
  const [autoScroll, setAutoScroll] = useState(true);
  const logContainerRef = useRef(null);

  useEffect(() => {
    const handleUpdate = (updatedLogs) => {
      setLogs(updatedLogs);
    };
    logListeners.add(handleUpdate);
    return () => {
      logListeners.delete(handleUpdate);
    };
  }, []);

  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const handleCopyLogs = useCallback(() => {
    const textToCopy = logs
      .map((l) => `[${l.timestamp}] [${l.level.toUpperCase()}] ${l.message}`)
      .join('\n');

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      // Fallback for WebView/legacy browsers
      const textArea = document.createElement('textarea');
      textArea.value = textToCopy;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (e) {
        console.error('Copy failed', e);
      }
      document.body.removeChild(textArea);
    }
  }, [logs]);

  const handleClearLogs = useCallback(() => {
    globalLogBuffer.length = 0;
    setLogs([]);
  }, []);

  const filteredLogs = logs.filter((log) => {
    if (filterLevel !== 'all' && log.level !== filterLevel) return false;
    if (searchQuery && !log.message.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <>
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 z-[99999] flex items-center gap-2 rounded-full bg-black/80 px-3.5 py-2 text-xs font-medium text-white shadow-2xl backdrop-blur-md border border-white/20 hover:bg-black active:scale-95 transition-all"
        >
          <Terminal className="h-4 w-4 text-green-400 animate-pulse" />
          <span>Logs ({logs.length})</span>
        </button>
      )}

      {/* Full-screen / Drawer Log Viewer Screen */}
      {isOpen && (
        <div className="fixed inset-0 z-[99999] flex flex-col bg-slate-950 text-slate-100 font-mono text-xs shadow-2xl">
          {/* Header Bar */}
          <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-4 py-3 backdrop-blur-md">
            <div className="flex items-center gap-2">
              <Terminal className="h-4 w-4 text-green-400" />
              <span className="font-semibold text-sm text-slate-100">Step-by-Step Logs</span>
              <Badge variant="outline" className="text-[10px] text-green-400 border-green-500/40">
                {filteredLogs.length} / {logs.length}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopyLogs}
                className="h-8 bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-green-400 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                {copied ? 'Copied' : 'Copy'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleClearLogs}
                className="h-8 bg-slate-800 border-slate-700 text-red-400 hover:bg-red-950 hover:text-red-300"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex items-center gap-2 border-b border-slate-800 bg-slate-900/50 px-4 py-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Filter logs (e.g. decline, clear, SIP)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-md bg-slate-900 border border-slate-800 py-1.5 pl-8 pr-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-green-500"
              />
            </div>
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className="rounded-md bg-slate-900 border border-slate-800 py-1.5 px-2 text-xs text-slate-300 focus:outline-none focus:border-green-500"
            >
              <option value="all">All Levels</option>
              <option value="info">Info</option>
              <option value="warn">Warn</option>
              <option value="error">Error</option>
            </select>
          </div>

          {/* Logs Container */}
          <div
            ref={logContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-1.5 font-mono text-[11px] leading-relaxed selection:bg-green-500 selection:text-black"
          >
            {filteredLogs.length === 0 ? (
              <div className="py-12 text-center text-slate-500 italic">No logs recorded yet or match filter.</div>
            ) : (
              filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className={`flex items-start gap-2 rounded px-2 py-1 transition-colors ${
                    log.level === 'error'
                      ? 'bg-red-950/40 text-red-300 border-l-2 border-red-500'
                      : log.level === 'warn'
                      ? 'bg-yellow-950/30 text-yellow-300 border-l-2 border-yellow-500'
                      : 'hover:bg-slate-900/60 text-slate-300'
                  }`}
                >
                  <span className="text-slate-500 shrink-0 font-sans text-[10px]">{log.timestamp}</span>
                  <span
                    className={`font-semibold shrink-0 uppercase text-[9px] px-1 py-0.2 rounded ${
                      log.level === 'error'
                        ? 'bg-red-900/60 text-red-200'
                        : log.level === 'warn'
                        ? 'bg-yellow-900/60 text-yellow-200'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {log.level}
                  </span>
                  <span className="whitespace-pre-wrap break-all flex-1">{log.message}</span>
                </div>
              ))
            )}
          </div>

          {/* Footer Bar */}
          <div className="flex items-center justify-between border-t border-slate-800 bg-slate-900/80 px-4 py-2 text-[10px] text-slate-400">
            <span>Tap Copy button to copy all step-by-step logs</span>
            <button
              onClick={() => setAutoScroll(!autoScroll)}
              className={`hover:underline ${autoScroll ? 'text-green-400' : 'text-slate-500'}`}
            >
              Auto-scroll: {autoScroll ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
