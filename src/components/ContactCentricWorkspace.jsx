import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import moment from 'moment';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Eye,
  Phone,
  PhoneCall,
  PhoneIncoming,
  PhoneOutgoing,
  RefreshCcw,
  Search,
  SkipForward,
} from 'lucide-react';

import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { normalizePhone } from '@/utils/normalizePhone';

const PAGE_OPTIONS = [10, 15, 25];
const DETAIL_SKIP_KEYS = new Set([
  '_id',
  'id',
  '__v',
  'isDeleted',
  'contactNumber',
  'createdAt',
  'updatedAt',
  'tags',
  'formId',
  'formID',
  'formTitle',
  'formType',
  'campaignId',
  'campaignName',
]);
const pillSelectClass = 'h-11 rounded-full border border-border/70 bg-background px-4 text-sm';

const formatTimestamp = (value) => {
  if (!value) return '-';
  const numeric = Number(value);
  const parsed =
    Number.isFinite(numeric) && numeric > 0
      ? moment(String(Math.trunc(numeric)).length === 10 ? numeric * 1000 : numeric)
      : moment(value);
  return parsed.isValid() ? parsed.format('DD MMM YYYY, hh:mm A') : '-';
};

const normalizeTimeValue = (value) => {
  if (value === null || value === undefined || value === '') return 0;
  if (moment.isMoment(value)) return value.valueOf();
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'string' && value.includes(':') && /^\d{1,2}:\d{2}(:\d{2})?$/.test(value.trim())) {
    return 0;
  }
  const numeric = Number(value);
  if (Number.isFinite(numeric) && numeric > 0) {
    if (String(Math.trunc(Math.abs(numeric))).length <= 10) {
      return numeric * 1000;
    }
    return numeric;
  }
  const parsed = moment(value);
  return parsed.isValid() ? parsed.valueOf() : 0;
};

const parseDurationStringToSeconds = (value) => {
  const cleaned = String(value || '').trim();
  if (!cleaned || !cleaned.includes(':')) return 0;
  const parts = cleaned.split(':').map((part) => Number(part));
  if (parts.some((part) => !Number.isFinite(part))) return 0;
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return 0;
};

const formatDuration = (call) => {
  let seconds = 0;
  const stringDuration = parseDurationStringToSeconds(call?.duration);
  if (stringDuration > 0) {
    seconds = stringDuration;
  } else {
    const rawDuration = Number(call?.duration || 0);
    if (Number.isFinite(rawDuration) && rawDuration > 0) {
      if (rawDuration > 100000 || rawDuration > 10800) {
        seconds = Math.round(rawDuration / 1000);
      } else {
        seconds = Math.round(rawDuration);
      }
    }
  }

  if (!seconds) {
    const answerMs = normalizeTimeValue(call?.anstime);
    const hangupMs = normalizeTimeValue(call?.hanguptime);
    const startMs = normalizeTimeValue(call?.startTime || call?.createdAt || call?.updatedAt);
    if (answerMs > 0 && hangupMs > answerMs) {
      seconds = Math.round((hangupMs - answerMs) / 1000);
    } else if (startMs > 0 && hangupMs > startMs) {
      seconds = Math.round((hangupMs - startMs) / 1000);
    }
  }

  const safeSeconds = Math.max(seconds, 0);
  return moment.utc(safeSeconds * 1000).format(safeSeconds >= 3600 ? 'HH:mm:ss' : 'mm:ss');
};

const withinRange = (value, preset) => {
  if (!value || preset === 'all') return true;
  const when = moment(Number.isFinite(Number(value)) ? Number(value) : value);
  if (!when.isValid()) return true;
  const now = moment();
  if (preset === 'today') return when.isSame(now, 'day');
  if (preset === '7d') return when.isSameOrAfter(now.clone().subtract(6, 'days').startOf('day'));
  if (preset === '30d') return when.isSameOrAfter(now.clone().subtract(29, 'days').startOf('day'));
  return true;
};

const toLabel = (value) =>
  String(value || '')
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/^./, (char) => char.toUpperCase())
    .trim();

const buildCallIdentityCandidates = (call = {}) =>
  [
    call?._id,
    call?.id,
    call?.bridgeID,
    call?.bridgeid,
    call?.channelID,
    call?.channelIDstring,
    call?.incomingchannel,
    call?.startTime,
    call?.Caller,
    call?.dialNumber,
    call?.contactNumber,
  ]
    .map((value) =>
      String(value || '')
        .trim()
        .toLowerCase(),
    )
    .filter(Boolean);

const buildConversationIdentityCandidates = (conversation = {}) =>
  [
    conversation?._id,
    conversation?.id,
    conversation?.callReference,
    conversation?.bridgeID,
    conversation?.bridgeid,
    conversation?.channelID,
    conversation?.channelIDstring,
    conversation?.incomingchannel,
    conversation?.createdAt,
    conversation?.updatedAt,
    conversation?.contactNumber,
  ]
    .map((value) =>
      String(value || '')
        .trim()
        .toLowerCase(),
    )
    .filter(Boolean);

const getConversationRemark = (conversation = {}) =>
  String(
    conversation?.Remarks ||
      conversation?.remarks ||
      conversation?.comment ||
      conversation?.CallRemark ||
      conversation?.callRemark ||
      '',
  ).trim();

const getConversationMatchKey = (conversation = {}, index = 0) =>
  String(
    conversation?._id ||
      conversation?.id ||
      conversation?.callReference ||
      conversation?.bridgeID ||
      conversation?.createdAt ||
      conversation?.updatedAt ||
      `${conversation?.contactNumber || 'conversation'}-${index}`,
  ).trim();

const findConversationForCall = (call = {}, conversations = [], usedKeys = new Set()) => {
  if (!Array.isArray(conversations) || conversations.length === 0) {
    return null;
  }

  const callIdentityCandidates = buildCallIdentityCandidates(call);
  const directMatch = conversations.find((conversation, index) => {
    const conversationKey = getConversationMatchKey(conversation, index);
    if (usedKeys.has(conversationKey)) {
      return false;
    }
    const conversationCandidates = buildConversationIdentityCandidates(conversation);
    return conversationCandidates.some((candidate) => callIdentityCandidates.includes(candidate));
  });
  if (directMatch) {
    return directMatch;
  }

  const startMs = normalizeTimeValue(call?.startTime || call?.createdAt || call?.updatedAt);
  const hangupMs = normalizeTimeValue(call?.hanguptime);
  const effectiveEndMs = hangupMs > startMs ? hangupMs : startMs;
  if (!startMs) {
    return null;
  }

  const matchingWindowEnd = effectiveEndMs + 15 * 60 * 1000;
  const callNumber = normalizePhone(call?.Caller || call?.dialNumber || call?.contactNumber || '');

  const matches = conversations
    .filter((conversation, index) => {
      const conversationKey = getConversationMatchKey(conversation, index);
      if (usedKeys.has(conversationKey)) {
        return false;
      }
      const conversationNumber = normalizePhone(conversation?.contactNumber || callNumber);
      if (callNumber && conversationNumber && conversationNumber !== callNumber) {
        return false;
      }
      const conversationTime = normalizeTimeValue(conversation?.updatedAt || conversation?.createdAt);
      return conversationTime >= startMs - 5 * 60 * 1000 && conversationTime <= matchingWindowEnd;
    })
    .sort((a, b) => {
      const aTime = normalizeTimeValue(a?.updatedAt || a?.createdAt);
      const bTime = normalizeTimeValue(b?.updatedAt || b?.createdAt);
      return Math.abs(aTime - effectiveEndMs) - Math.abs(bTime - effectiveEndMs);
    });

  return matches[0] || null;
};

const matchConversationsToCalls = (calls = [], conversations = []) => {
  if (!Array.isArray(calls) || calls.length === 0) {
    return [];
  }

  const usedConversationKeys = new Set();
  return calls.map((call, index) => {
    const relatedConversation = findConversationForCall(call, conversations, usedConversationKeys);
    if (relatedConversation) {
      usedConversationKeys.add(getConversationMatchKey(relatedConversation, index));
    }
    return {
      call,
      historyId: String(call?._id || call?.id || call?.startTime || index),
      relatedConversation,
      previewText: getConversationRemark(relatedConversation) || 'Tagging not updated for this call.',
    };
  });
};

const mapCallRow = (call, index) => ({
  id: String(call?._id || call?.id || `${call?.Caller || call?.contactNumber || 'call'}-${index}`),
  callerNumber: normalizePhone(
    call?.Caller || call?.contactNumber || call?.dialNumber || call?.DestinationNumber || '',
  ),
  callerName: String(
    call?.callerName ||
      call?.caller_name ||
      call?.CallerName ||
      call?.['Caller Name'] ||
      call?.['Caller Name '] ||
      call?.patientName ||
      call?.['Patient Name'] ||
      call?.PatientName ||
      call?.Customer ||
      call?.callerIDName ||
      call?.CallerIDName ||
      call?.contactName ||
      call?.customerName ||
      call?.CustomerName ||
      call?.name ||
      '',
  ).trim(),
  type:
    String(call?.Type || call?.callType || '')
      .trim()
      .toLowerCase() === 'incoming'
      ? 'Incoming'
      : 'Outgoing',
  time: call?.startTime || call?.createdAt || call?.updatedAt || null,
  durationLabel: formatDuration(call),
  status: String(call?.Disposition || call?.disposition || '').trim() || 'No Status',
  raw: call,
});

const mapLeadRow = (lead, index) => {
  const state = String(lead?.leadState || '')
    .trim()
    .toLowerCase();
  const contacted = ['completed', 'failed', 'skipped'].includes(state) || Number(lead?.lastDialedStatus || 0) > 0;
  return {
    id: String(lead?._id || lead?.leadId || `${lead?.number || lead?.phone || 'lead'}-${index}`),
    callerNumber: normalizePhone(lead?.number || lead?.phone || lead?.phone_number || lead?.contactNumber || ''),
    callerName: String(lead?.name || lead?.fullName || lead?.patientName || '').trim() || '-',
    type: contacted ? 'Contacted' : 'Pending',
    time: lead?.updatedAt || lead?.uploadDate || lead?.createdAt || null,
    durationLabel:
      Object.entries(lead || {})
        .filter(
          ([key, value]) =>
            !['leadid', '_id', 'number', 'phone', 'phone_number', 'contactnumber', 'leadstate'].includes(
              String(key).toLowerCase(),
            ) &&
            value !== undefined &&
            value !== null &&
            String(value).trim() !== '' &&
            typeof value !== 'object',
        )
        .slice(0, 2)
        .map(([, value]) => String(value))
        .join(' • ') || 'Lead details available',
    status: state === 'completed' ? 'Completed' : contacted ? 'Contacted' : 'Pending',
    raw: lead,
  };
};

const normalizeSearchText = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
const normalizeSearchDigits = (value) => String(value || '').replace(/\D/g, '');

const buildRowSearchIndex = (row) => {
  const raw = row?.raw || {};
  const flattenedValues = [
    row?.callerNumber,
    row?.callerName,
    row?.status,
    row?.type,
    row?.durationLabel,
    formatTimestamp(row?.time),
    ...Object.values(raw).flatMap((value) => {
      if (value === undefined || value === null) return [];
      if (typeof value === 'object') {
        try {
          return [JSON.stringify(value)];
        } catch (error) {
          return [];
        }
      }
      return [String(value)];
    }),
  ]
    .map((value) => String(value || '').trim())
    .filter(Boolean);

  const searchText = normalizeSearchText(flattenedValues.join(' '));
  const searchDigits = normalizeSearchDigits(flattenedValues.join(' '));

  return {
    ...row,
    _searchText: searchText,
    _searchDigits: searchDigits,
  };
};

const Tabs = ({ mode, onModeChange }) => (
  <div className="flex items-center gap-2">
    {[
      { value: 'callInfo', label: 'Call Info' },
      { value: 'leads', label: 'Leads' },
    ].map((tab) => (
      <Button
        key={tab.value}
        type="button"
        size="sm"
        variant={mode === tab.value ? 'default' : 'outline'}
        className="h-9 rounded-full px-4 text-xs font-semibold"
        onClick={() => onModeChange?.(tab.value)}
      >
        {tab.label}
      </Button>
    ))}
  </div>
);

const SkeletonRows = () => (
  <div className="space-y-3">
    {Array.from({ length: 6 }).map((_, index) => (
      <div key={index} className="h-12 animate-pulse rounded-xl bg-muted/60" />
    ))}
  </div>
);

export default function ContactCentricWorkspace({
  mode,
  onModeChange,
  callsData,
  leadsData,
  token,
  previewLeadMode,
  activeCardFilter,
  handleDialAction,
  callLoading,
  leadLoading,
  workspaceErrorMessage,
  activeLead,
  activeLeadNumber,
  smartLeadLoading,
  smartLeadError,
  smartLeadDetailEntries,
  agentLifecycle,
  leadLockToken,
  datePreset = 'today',
  onDatePresetChange,
  onSkipLead,
  onRefreshLead,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [pageIndex, setPageIndex] = useState(0);
  const [selectedRow, setSelectedRow] = useState(null);
  const [workspaceData, setWorkspaceData] = useState(null);
  const [workspaceLoading, setWorkspaceLoading] = useState(false);
  const [workspaceError, setWorkspaceError] = useState('');
  const [mobileDetailsOpen, setMobileDetailsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [expandedHistoryId, setExpandedHistoryId] = useState(null);
  const [historyRowsPerPage, setHistoryRowsPerPage] = useState(10);
  const [historyPage, setHistoryPage] = useState(0);
  const [historyDatePreset, setHistoryDatePreset] = useState('7d');
  const workspaceCacheRef = useRef({});
  const historyRowRefs = useRef({});

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 1023px)');
    const sync = () => setIsMobile(mediaQuery.matches);
    sync();
    mediaQuery.addEventListener('change', sync);
    return () => mediaQuery.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    setSearchTerm('');
    setRowsPerPage(10);
    setPageIndex(0);
    setSelectedRow(null);
    setWorkspaceData(null);
    setWorkspaceError('');
    setExpandedHistoryId(null);
    setHistoryRowsPerPage(10);
    setHistoryPage(0);
    setHistoryDatePreset('7d');
    setMobileDetailsOpen(false);
  }, [mode, activeCardFilter, previewLeadMode]);
  const rows = useMemo(() => {
    const normalizedSearchText = normalizeSearchText(searchTerm);
    const normalizedDigits = normalizeSearchDigits(searchTerm);
    const sourceRows = (mode === 'callInfo' ? callsData : leadsData)
      .map(mode === 'callInfo' ? mapCallRow : mapLeadRow)
      .map(buildRowSearchIndex);
    return sourceRows.filter((row) => {
      if (mode === 'callInfo') {
        if (activeCardFilter === 'incoming' && row.type !== 'Incoming') return false;
        if (activeCardFilter === 'outgoing' && row.type !== 'Outgoing') return false;
        if (activeCardFilter === 'connected' && row.durationLabel === '00:00') return false;
      } else {
        if (activeCardFilter === 'contacted' && row.status === 'Pending') return false;
        if (activeCardFilter === 'pending' && row.status !== 'Pending') return false;
        if (activeCardFilter === 'completed' && row.status !== 'Completed') return false;
      }
      if (!withinRange(row.time, datePreset)) return false;
      if (!normalizedSearchText) return true;
      const matchesNumber = normalizedDigits ? row._searchDigits.includes(normalizedDigits) : false;
      const matchesText = row._searchText.includes(normalizedSearchText);
      return matchesNumber || matchesText;
    });
  }, [activeCardFilter, callsData, datePreset, leadsData, mode, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(rows.length / rowsPerPage));
  const pagedRows = useMemo(
    () => rows.slice(pageIndex * rowsPerPage, pageIndex * rowsPerPage + rowsPerPage),
    [pageIndex, rows, rowsPerPage],
  );
  useEffect(() => setPageIndex(0), [rowsPerPage, searchTerm, datePreset]);
  useEffect(() => {
    if (pageIndex >= totalPages) setPageIndex(Math.max(totalPages - 1, 0));
  }, [pageIndex, totalPages]);

  const fetchWorkspace = useCallback(
    async (phoneNumber) => {
      const normalizedNumber = normalizePhone(phoneNumber);
      if (!normalizedNumber || !token) {
        setWorkspaceData(null);
        return;
      }
      if (workspaceCacheRef.current[normalizedNumber]) {
        setWorkspaceData(workspaceCacheRef.current[normalizedNumber]);
        setWorkspaceError('');
        return;
      }
      setWorkspaceLoading(true);
      setWorkspaceError('');
      try {
        const response = await axios.get(`https://esamwad.iotcom.io/contact/${normalizedNumber}/full`, {
          params: { limit: 50 },
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = response.data?.result || null;
        workspaceCacheRef.current[normalizedNumber] = result;
        setWorkspaceData(result);
      } catch (error) {
        const message = error.response?.data?.message || error.message || 'Failed to load contact workspace.';
        setWorkspaceError(message);
        toast.error(message);
      } finally {
        setWorkspaceLoading(false);
      }
    },
    [token],
  );

  const handleSelectRow = useCallback(
    async (row) => {
      setSelectedRow(row);
      setExpandedHistoryId(null);
      setHistoryPage(0);
      setHistoryDatePreset('7d');
      await fetchWorkspace(row.callerNumber);
      if (isMobile) setMobileDetailsOpen(true);
    },
    [fetchWorkspace, isMobile],
  );

  const handleBackToList = useCallback(() => {
    setSelectedRow(null);
    setWorkspaceData(null);
    setWorkspaceError('');
    setExpandedHistoryId(null);
    setHistoryPage(0);
  }, []);

  const isLoading = mode === 'callInfo' ? callLoading : leadLoading;
  const contact = workspaceData?.contact || {};
  const contactProfile = workspaceData?.contactProfile || {};
  const quickStats = workspaceData?.quickStats || {};
  const calls = workspaceData?.calls || [];
  const notes = workspaceData?.notes || [];
  const conversations = workspaceData?.conversations || [];
  const latestConversation = conversations[0] || workspaceData?.latestConversation || null;
  const latestPreview = String(
    latestConversation?.Remarks ||
      latestConversation?.remarks ||
      latestConversation?.comment ||
      latestConversation?.formTitle ||
      '',
  ).trim();
  const detailEntries = Object.entries(contactProfile)
    .filter(
      ([key, value]) =>
        !DETAIL_SKIP_KEYS.has(key) &&
        value !== undefined &&
        value !== null &&
        String(value).trim() !== '' &&
        typeof value !== 'object',
    )
    .slice(0, 8);

  const filteredHistoryRows = useMemo(
    () => calls.filter((call) => withinRange(call?.startTime || call?.createdAt || call?.updatedAt, historyDatePreset)),
    [calls, historyDatePreset],
  );
  const historyTotalPages = Math.max(1, Math.ceil(filteredHistoryRows.length / historyRowsPerPage));
  const historyRows = useMemo(
    () =>
      filteredHistoryRows.slice(
        historyPage * historyRowsPerPage,
        historyPage * historyRowsPerPage + historyRowsPerPage,
      ),
    [filteredHistoryRows, historyPage, historyRowsPerPage],
  );
  const historyRowsWithConversations = useMemo(
    () => matchConversationsToCalls(historyRows, conversations),
    [conversations, historyRows],
  );
  useEffect(() => setHistoryPage(0), [historyRowsPerPage, historyDatePreset]);
  useEffect(() => {
    if (historyPage >= historyTotalPages) setHistoryPage(Math.max(historyTotalPages - 1, 0));
  }, [historyPage, historyTotalPages]);
  useEffect(() => {
    if (!expandedHistoryId) {
      return undefined;
    }

    const frameId = window.requestAnimationFrame(() => {
      historyRowRefs.current?.[expandedHistoryId]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [expandedHistoryId]);

  if (mode === 'leads' && previewLeadMode) {
    return (
      <Card className="flex h-full min-h-0 w-full min-w-0 flex-col border border-border/70 shadow-sm rounded-none sm:rounded-xl">
        <CardHeader className="shrink-0 space-y-4 px-4 sm:px-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="text-center sm:text-left">
              <CardTitle className="text-lg sm:text-xl font-bold text-primary">Lead Preview</CardTitle>
              <p className="mt-1 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Review the next lead and dial directly from this panel.
              </p>
            </div>
            <div className="flex items-center justify-center sm:justify-end gap-2 sm:gap-3">
              <Button
                type="button"
                className="inline-flex h-9 items-center justify-center gap-2 rounded-full bg-green-600 px-4 text-xs font-bold text-white hover:bg-green-700 shadow-md transition-all active:scale-95"
                disabled={
                  !activeLeadNumber ||
                  !leadLockToken ||
                  smartLeadLoading ||
                  !['lead_locked', 'idle'].includes(agentLifecycle)
                }
                onClick={() => handleDialAction(activeLeadNumber, activeLead)}
              >
                <Phone className="h-3.5 w-3.5" />
                <span className="sm:block hidden">Dial</span>
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-full px-4 text-xs font-semibold shadow-sm"
                  disabled={
                    !activeLead?.leadId ||
                    !leadLockToken ||
                    smartLeadLoading ||
                    !['lead_locked', 'idle'].includes(agentLifecycle)
                  }
                  onClick={onSkipLead}
                >
                  <SkipForward className="h-3.5 w-3.5" />
                  <span className="sm:block hidden">Skip</span>
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  className="h-9 w-9 rounded-full shrink-0 shadow-sm"
                  onClick={onRefreshLead}
                  title="Refresh Lead"
                >
                  <RefreshCcw className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="w-full sm:w-auto mt-2 sm:mt-0">
                <Tabs mode={mode} onModeChange={onModeChange} />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex min-h-0 flex-1 flex-col space-y-4 px-4 sm:px-6 py-0 pb-6 overflow-y-auto">
          {smartLeadLoading ? (
            <SkeletonRows />
          ) : activeLead ? (
            <>
              <div className="grid gap-3 sm:gap-4 xl:grid-cols-3">
                <div className="rounded-2xl border border-border/70 bg-primary/5 px-4 py-4 xl:col-span-2 shadow-sm">
                  <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-primary/70">
                    Lead Details
                  </div>
                  <div className="mt-2 text-xl sm:text-2xl font-bold text-foreground truncate">
                    {activeLead?.name || activeLead?.fullName || activeLead?.patientName || 'Lead Ready'}
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-xs sm:text-sm text-foreground/80 font-medium">
                    <div className="flex h-7 items-center gap-2 rounded-full bg-background px-3 border border-border/50">
                      <PhoneCall className="h-3.5 w-3.5 text-primary" />
                      <span>{activeLeadNumber || 'No number'}</span>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-4 shadow-sm border-l-4 border-l-blue-500">
                  <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Last Updated
                  </div>
                  <div className="mt-2 text-sm font-bold text-foreground">
                    {formatTimestamp(activeLead?.updatedAt || activeLead?.uploadDate || activeLead?.createdAt)}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:mb-0 mb-20">
                {smartLeadDetailEntries.length > 0 ? (
                  smartLeadDetailEntries.map((entry) => (
                    <div
                      key={entry.label}
                      className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-4 transition-colors hover:bg-muted/30"
                    >
                      <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
                        {entry.label}
                      </div>
                      <div className="mt-1.5 break-words text-sm font-semibold text-foreground">
                        {entry.value || 'N/A'}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-border/60 px-4 py-8 text-center sm:text-left text-xs sm:text-sm text-muted-foreground col-span-full">
                    No additional lead fields are available for this record.
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-border/60 px-4 py-12 sm:px-6 sm:py-16 text-center">
              <div className="text-base sm:text-lg font-bold text-foreground">No leads assigned</div>
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
                {smartLeadError ||
                  'The next eligible lead will appear here when one becomes available for this campaign.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }
  const renderList = () => (
    <Card className="flex h-auto min-h-0 w-full min-w-0 flex-col border border-border/70 shadow-sm">
      <CardHeader className="shrink-0 space-y-2 px-5">
        <div className="flex flex-col gap-2.5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <CardTitle className="text-xl font-semibold">
              {mode === 'callInfo' ? 'Recent Call Logs' : 'Lead Queue'}
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {mode === 'callInfo'
                ? 'Today’s handled calls for this agent.'
                : 'Lead records available for this campaign.'}
            </p>
          </div>
          <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
            <div className="relative min-w-[220px] flex-1 xl:max-w-sm">
              <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder={
                  mode === 'callInfo' ? 'Search caller number or caller name' : 'Search lead number or lead name'
                }
                className="h-11 rounded-full border-border/70 bg-background pl-10"
              />
            </div>
            <Select value={String(rowsPerPage)} onValueChange={(value) => setRowsPerPage(Number(value))}>
              <SelectTrigger className="h-11 w-[126px] rounded-full border-border/70 bg-background text-sm">
                <SelectValue placeholder="10 rows" />
              </SelectTrigger>
              <SelectContent>
                {PAGE_OPTIONS.map((value) => (
                  <SelectItem key={value} value={String(value)}>
                    {value} rows
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={datePreset} onValueChange={(value) => onDatePresetChange?.(value)}>
              <SelectTrigger className="h-11 w-[170px] rounded-full border-border/70 bg-background text-sm">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Today" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
            <Tabs mode={mode} onModeChange={onModeChange} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex min-h-0 h-auto flex-col px-5 pb-4 pt-0">
        {workspaceErrorMessage ? (
          <div className="mb-4 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {workspaceErrorMessage}
          </div>
        ) : null}
        {isLoading ? (
          <SkeletonRows />
        ) : rows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/60 px-4 py-10 sm:px-6 sm:py-20 text-center">
            <div className="text-base sm:text-lg font-semibold text-foreground">
              {mode === 'callInfo' ? 'No calls yet today' : 'No leads assigned'}
            </div>
            <p className="mt-2 text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
              {mode === 'callInfo'
                ? 'This agent’s handled calls will appear here as soon as activity starts.'
                : 'Assigned or available leads for this campaign will appear here.'}
            </p>
          </div>
        ) : (
          <>
            <div className="min-h-0 min-w-0 h-auto overflow-hidden lg:rounded-2xl lg:border lg:border-border/70">
              <div className="flex h-auto min-h-0 flex-col">
                <div className="min-h-0 h-auto overflow-auto">
                  {isMobile ? (
                    <div className="space-y-3 pb-4">
                      {pagedRows.map((row) => (
                        <div
                          key={row.id}
                          className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-card p-4 shadow-sm active:bg-muted/40"
                          onClick={() => void handleSelectRow(row)}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-foreground truncate">
                                  {row.callerNumber || '-'}
                                </span>
                                <Badge
                                  variant={
                                    (mode === 'callInfo' ? row.type : row.status) === 'Incoming' ||
                                    row.status === 'Completed'
                                      ? 'default'
                                      : 'secondary'
                                  }
                                  className="text-[10px] h-5 px-1.5"
                                >
                                  {mode === 'callInfo' ? row.type : row.status}
                                </Badge>
                              </div>
                              <div className="mt-1 text-sm text-muted-foreground truncate">
                                {row.callerName || 'No Name'}
                              </div>
                            </div>
                            <Button
                              type="button"
                              size="icon"
                              className="h-10 w-10 shrink-0 rounded-full bg-green-600 text-white shadow-sm hover:bg-green-700"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleDialAction(row.callerNumber, row.raw);
                              }}
                            >
                              <Phone className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="flex items-center justify-between border-t border-border/40 pt-3 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                              <CalendarDays className="h-3.5 w-3.5" />
                              {formatTimestamp(row.time)}
                            </div>
                            {mode === 'callInfo' && (
                              <div className="font-medium text-foreground bg-muted/50 px-2 py-0.5 rounded">
                                {row.durationLabel}
                              </div>
                            )}
                          </div>

                          {mode === 'callInfo' && row.status && (
                            <div className="text-xs italic text-muted-foreground/80 bg-muted/20 px-3 py-1.5 rounded-lg border border-border/30">
                              {row.status}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Table className="table-fixed">
                      <colgroup>
                        <col className="w-[16%]" />
                        <col className="w-[14%]" />
                        <col className="w-[9%]" />
                        <col className="w-[24%]" />
                        <col className="w-[8%]" />
                        <col className="w-[29%]" />
                      </colgroup>
                      <TableHeader className="sticky top-0 z-10 bg-card">
                        <TableRow>
                          <TableHead className="h-11 px-3">
                            {mode === 'callInfo' ? 'Caller Number' : 'Lead Number'}
                          </TableHead>
                          <TableHead className="h-11 px-3">
                            {mode === 'callInfo' ? 'Caller Name' : 'Lead Name'}
                          </TableHead>
                          <TableHead className="h-11 px-3">{mode === 'callInfo' ? 'Type' : 'Status'}</TableHead>
                          <TableHead className="h-11 px-3">{mode === 'callInfo' ? 'Time' : 'Last Updated'}</TableHead>
                          <TableHead className="h-11 px-3">{mode === 'callInfo' ? 'Duration' : 'Preview'}</TableHead>
                          <TableHead className="h-11 px-3">
                            {mode === 'callInfo' ? 'Disposition / Status' : 'Action'}
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pagedRows.map((row) => (
                          <TableRow
                            key={row.id}
                            className="h-11 cursor-pointer hover:bg-muted/40"
                            onClick={() => void handleSelectRow(row)}
                          >
                            <TableCell className="align-middle px-3 py-1.5 font-medium">
                              {row.callerNumber || '-'}
                            </TableCell>
                            <TableCell className="align-middle px-3 py-1.5">{row.callerName || '-'}</TableCell>
                            <TableCell className="align-middle px-3 py-1.5">
                              <Badge
                                variant={
                                  (mode === 'callInfo' ? row.type : row.status) === 'Incoming' ||
                                  row.status === 'Completed'
                                    ? 'default'
                                    : 'secondary'
                                }
                              >
                                {mode === 'callInfo' ? row.type : row.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="align-middle px-3 py-1.5">{formatTimestamp(row.time)}</TableCell>
                            <TableCell className="align-middle px-3 py-1.5">{row.durationLabel}</TableCell>
                            <TableCell className="align-middle px-3 py-1.5">
                              <div className="flex min-h-[34px] items-center gap-2.5">
                                {mode === 'callInfo' ? (
                                  <span className="min-w-0 flex-1 truncate text-muted-foreground">
                                    {row.status || 'N/A'}
                                  </span>
                                ) : (
                                  <span className="flex-1" />
                                )}
                                <Button
                                  type="button"
                                  size="sm"
                                  className="ml-auto inline-flex h-9 min-w-[94px] shrink-0 items-center justify-center gap-2 rounded-full bg-green-600 px-3.5 font-medium text-white shadow-sm transition-colors hover:bg-green-700"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    handleDialAction(row.callerNumber, row.raw);
                                  }}
                                >
                                  <Phone className="h-4 w-4" />
                                  Dial
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
                <div className="flex shrink-0 items-center justify-between border-t border-border/60 px-4 py-2.5">
                  <div className="text-sm text-muted-foreground">
                    Page {pageIndex + 1} of {totalPages}
                    <span className="mx-2 text-border">|</span>
                    <span className="text-muted-foreground">{rows.length} total rows</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={pageIndex === 0}
                      onClick={() => setPageIndex((prev) => Math.max(prev - 1, 0))}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={pageIndex + 1 >= totalPages}
                      onClick={() => setPageIndex((prev) => Math.min(prev + 1, totalPages - 1))}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );

  const renderSplit = () => (
    <Card className="flex h-auto min-h-0 w-full min-w-0 flex-col border border-border/70 shadow-sm">
      <CardHeader className="shrink-0 space-y-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" variant="outline" className="rounded-full px-4" onClick={handleBackToList}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div>
              <CardTitle className="text-xl font-semibold">
                {selectedRow?.callerName || selectedRow?.callerNumber || 'Contact Workspace'}
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Contact details on the left and call history with tagging on the right.
              </p>
            </div>
          </div>
          <Tabs mode={mode} onModeChange={onModeChange} />
        </div>
      </CardHeader>
      <CardContent className="flex min-h-0 h-auto flex-col pt-0">
        <div className="grid min-h-0 h-auto gap-4 xl:grid-cols-[minmax(0,0.3fr)_minmax(0,0.7fr)]">
          <div className="min-h-0">
            <div className="flex h-auto flex-col rounded-3xl border border-border/70 bg-card shadow-sm">
              <div className="border-b border-border/60 px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xl font-semibold text-foreground">
                      {contact?.name || selectedRow?.callerName || 'Unknown Contact'}
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                      <PhoneCall className="h-4 w-4" />
                      <span>{contact?.phone || selectedRow?.callerNumber || '-'}</span>
                    </div>
                  </div>
                  {contact?.phone || selectedRow?.callerNumber ? (
                    <Button
                      type="button"
                      size="icon"
                      className="h-11 w-11 rounded-full bg-green-600 text-white hover:bg-green-700"
                      onClick={() =>
                        handleDialAction(contact?.phone || selectedRow?.callerNumber || '', selectedRow?.raw)
                      }
                    >
                      <Phone className="h-4 w-4" />
                    </Button>
                  ) : null}
                </div>
                {Array.isArray(contact?.tags) && contact.tags.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {contact.tags.map((tag, index) => (
                      <Badge key={`${tag}-${index}`} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                ) : null}
              </div>
              <div className="h-auto overflow-y-auto px-5 py-4">
                {workspaceLoading ? (
                  <SkeletonRows />
                ) : workspaceError ? (
                  <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-4 text-sm text-destructive">
                    {workspaceError}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid gap-3">
                      <div className="rounded-2xl border border-border/70 bg-background/80 px-4 py-3">
                        <div className="text-xs uppercase tracking-wide text-muted-foreground">Last Interaction</div>
                        <div className="mt-2 text-sm font-medium text-foreground">
                          {formatTimestamp(
                            contact?.lastCallTime || calls[0]?.startTime || latestConversation?.updatedAt,
                          )}
                        </div>
                      </div>
                      <div className="rounded-2xl border border-border/70 bg-background/80 px-4 py-3">
                        <div className="text-xs uppercase tracking-wide text-muted-foreground">Total Calls</div>
                        <div className="mt-2 text-sm font-medium text-foreground">
                          {quickStats.totalCalls ?? contact?.totalCalls ?? 0}
                        </div>
                      </div>
                      <div className="rounded-2xl border border-border/70 bg-background/80 px-4 py-3">
                        <div className="text-xs uppercase tracking-wide text-muted-foreground">Latest Remark</div>
                        <div className="mt-2 text-sm font-medium text-foreground">
                          {latestPreview || contact?.lastDisposition || 'No remark captured yet.'}
                        </div>
                      </div>
                    </div>
                    {detailEntries.length > 0 ? (
                      <div className="rounded-2xl border border-border/70 bg-muted/10 px-4 py-4">
                        <div className="mb-3 text-sm font-semibold text-foreground">Contact Details</div>
                        <div className="space-y-3">
                          {detailEntries.map(([key, value]) => (
                            <div key={key} className="rounded-xl border border-border/60 bg-background/80 px-3 py-3">
                              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                                {toLabel(key)}
                              </div>
                              <div className="mt-2 break-words text-sm font-medium text-foreground">
                                {String(value)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    <div className="rounded-2xl border border-border/70 bg-muted/10 px-4 py-4">
                      <div className="mb-3 text-sm font-semibold text-foreground">Notes</div>
                      {notes.length === 0 ? (
                        <div className="text-sm text-muted-foreground">No notes added for this contact yet.</div>
                      ) : (
                        <div className="space-y-3">
                          {notes.slice(0, 4).map((note) => (
                            <div
                              key={note.id || note._id}
                              className="rounded-xl border border-border/60 bg-background/80 px-3 py-3"
                            >
                              <div className="text-sm text-foreground">{note.text || note.note || '-'}</div>
                              <div className="mt-2 text-xs text-muted-foreground">
                                {formatTimestamp(note.createdAt || note.updatedAt)}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="min-h-0">
            <div className="flex h-auto flex-col rounded-3xl border border-border/70 bg-card shadow-sm">
              <div className="flex flex-col gap-3 border-b border-border/60 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="text-lg font-semibold text-foreground">Call History + Tagging</div>
                  <div className="text-sm text-muted-foreground">
                    Recent attempts for this contact with call-specific tagging preview.
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Select
                    value={String(historyRowsPerPage)}
                    onValueChange={(value) => setHistoryRowsPerPage(Number(value))}
                  >
                    <SelectTrigger className="h-10 w-[126px] rounded-full border-border/70 bg-background text-sm">
                      <SelectValue placeholder="10 rows" />
                    </SelectTrigger>
                    <SelectContent>
                      {PAGE_OPTIONS.map((value) => (
                        <SelectItem key={value} value={String(value)}>
                          {value} rows
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={historyDatePreset} onValueChange={setHistoryDatePreset}>
                    <SelectTrigger className="h-10 w-[170px] rounded-full border-border/70 bg-background text-sm">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-muted-foreground" />
                        <SelectValue placeholder="Last 7 Days" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7d">Last 7 Days</SelectItem>
                      <SelectItem value="30d">Last 30 Days</SelectItem>
                      <SelectItem value="all">All Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="h-auto overflow-y-auto px-5 py-4">
                {workspaceLoading ? (
                  <SkeletonRows />
                ) : historyRowsWithConversations.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border/60 px-4 py-8 sm:px-6 sm:py-16 text-center">
                    <div className="text-base sm:text-lg font-semibold text-foreground">No contact history found</div>
                    <p className="mt-2 text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
                      There are no call attempts for this contact in the selected range.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-2xl border border-border/70">
                    <Table>
                      <TableHeader className="sticky top-0 z-10 bg-card">
                        <TableRow>
                          <TableHead>Time</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Duration</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Tag Preview</TableHead>
                          <TableHead className="w-[110px]">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {historyRowsWithConversations.map(({ call, historyId, relatedConversation, previewText }) => {
                          const callType =
                            String(call?.Type || call?.callType || '')
                              .trim()
                              .toLowerCase() === 'incoming'
                              ? 'Incoming'
                              : 'Outgoing';
                          return (
                            <React.Fragment key={historyId}>
                              <TableRow className="hover:bg-muted/30">
                                <TableCell>
                                  {formatTimestamp(call?.startTime || call?.createdAt || call?.updatedAt)}
                                </TableCell>
                                <TableCell>
                                  <Badge variant={callType === 'Incoming' ? 'default' : 'secondary'}>
                                    {callType === 'Incoming' ? (
                                      <PhoneIncoming className="mr-1 h-3.5 w-3.5" />
                                    ) : (
                                      <PhoneOutgoing className="mr-1 h-3.5 w-3.5" />
                                    )}
                                    {callType}
                                  </Badge>
                                </TableCell>
                                <TableCell>{formatDuration(call)}</TableCell>
                                <TableCell>{String(call?.Disposition || call?.disposition || 'N/A')}</TableCell>
                                <TableCell className="max-w-[260px] truncate text-muted-foreground">
                                  {previewText}
                                </TableCell>
                                <TableCell>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 rounded-full px-3 text-primary"
                                    onClick={() =>
                                      setExpandedHistoryId((prev) => (prev === historyId ? null : historyId))
                                    }
                                  >
                                    <Eye className="mr-1.5 h-4 w-4" />
                                    {expandedHistoryId === historyId ? 'Hide' : 'View'}
                                  </Button>
                                </TableCell>
                              </TableRow>
                              {expandedHistoryId === historyId ? (
                                <TableRow>
                                  <TableCell colSpan={6} className="bg-muted/10">
                                    <div
                                      ref={(node) => {
                                        if (node) {
                                          historyRowRefs.current[historyId] = node;
                                        } else {
                                          delete historyRowRefs.current[historyId];
                                        }
                                      }}
                                      className="space-y-3 py-2"
                                    >
                                      {!relatedConversation ? (
                                        <div className="text-sm text-muted-foreground">
                                          Tagging not updated for this call.
                                        </div>
                                      ) : (
                                        <div className="rounded-xl border border-border/60 bg-background/80 px-4 py-3">
                                          <div className="flex flex-wrap items-center justify-between gap-2">
                                            <div className="text-sm font-medium text-foreground">
                                              {relatedConversation?.formTitle || 'Tagging Conversation'}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                              {formatTimestamp(
                                                relatedConversation?.updatedAt || relatedConversation?.createdAt,
                                              )}
                                            </div>
                                          </div>
                                          <div className="mt-2 text-sm text-muted-foreground">
                                            {getConversationRemark(relatedConversation) ||
                                              'Tagging updated for this call.'}
                                          </div>
                                          <div className="mt-3 grid gap-2 md:grid-cols-2">
                                            {Object.entries(relatedConversation)
                                              .filter(
                                                ([key, value]) =>
                                                  value !== undefined &&
                                                  value !== null &&
                                                  String(value).trim() !== '' &&
                                                  ![
                                                    'id',
                                                    '_id',
                                                    '__v',
                                                    'createdAt',
                                                    'updatedAt',
                                                    'contactNumber',
                                                    'agentName',
                                                    'formId',
                                                    'formID',
                                                    'formTitle',
                                                    'campaignId',
                                                    'campaignName',
                                                    'entryMode',
                                                    'callReference',
                                                  ].includes(key),
                                              )
                                              .slice(0, 8)
                                              .map(([key, value]) => (
                                                <div
                                                  key={key}
                                                  className="rounded-lg border border-border/50 bg-muted/10 px-3 py-2"
                                                >
                                                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                                                    {toLabel(key)}
                                                  </div>
                                                  <div className="mt-1 break-words text-sm font-medium text-foreground">
                                                    {String(value)}
                                                  </div>
                                                </div>
                                              ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ) : null}
                            </React.Fragment>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between border-t border-border/60 px-5 py-4">
                <div className="text-sm text-muted-foreground">
                  Page {historyPage + 1} of {historyTotalPages}
                  <span className="mx-2 text-border">|</span>
                  <span className="text-muted-foreground">{filteredHistoryRows.length} total rows</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={historyPage === 0}
                    onClick={() => setHistoryPage((prev) => Math.max(prev - 1, 0))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={historyPage + 1 >= historyTotalPages}
                    onClick={() => setHistoryPage((prev) => Math.min(prev + 1, historyTotalPages - 1))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <>
      {!selectedRow || isMobile ? renderList() : renderSplit()}
      <Dialog open={mobileDetailsOpen} onOpenChange={setMobileDetailsOpen}>
        <DialogContent className="max-h-[90vh] overflow-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedRow?.callerName || selectedRow?.callerNumber || 'Contact Workspace'}</DialogTitle>
          </DialogHeader>
          {selectedRow ? renderSplit() : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
