import React, { useState, useEffect, useMemo, useCallback, useRef, useContext } from 'react';
import moment from 'moment';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  Activity,
  Building2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  User,
  Info,
  Phone,
  History,
  Clock,
  MessageSquare,
  PhoneCall,
  PhoneIncoming,
  PhoneOutgoing,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Button } from './ui/button';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import DynamicForm from './DynamicForm';
import UserCall from './UserCall';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { JssipContext } from '@/context/JssipContext';

const PAGE_OPTIONS = [10, 15, 25];

const normalizeTimeValue = (value) => {
  if (value === null || value === undefined || value === '') return 0;
  if (moment.isMoment(value)) return value.valueOf();
  if (value instanceof Date) return value.getTime();
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
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return 0;
};

const formatCallDuration = (call = {}) => {
  let seconds = 0;

  const fromString = parseDurationStringToSeconds(call?.duration);
  if (fromString > 0) {
    seconds = fromString;
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
  if (!Array.isArray(conversations) || conversations.length === 0) return null;

  const callIdentityCandidates = buildCallIdentityCandidates(call);
  const directMatch = conversations.find((conversation, index) => {
    const conversationKey = getConversationMatchKey(conversation, index);
    if (usedKeys.has(conversationKey)) return false;
    const conversationCandidates = buildConversationIdentityCandidates(conversation);
    return conversationCandidates.some((candidate) => callIdentityCandidates.includes(candidate));
  });
  if (directMatch) return directMatch;

  const startMs = normalizeTimeValue(call?.startTime || call?.createdAt || call?.updatedAt);
  const hangupMs = normalizeTimeValue(call?.hanguptime);
  const effectiveEndMs = hangupMs > startMs ? hangupMs : startMs;
  if (!startMs) return null;

  const callNumber = String(call?.Caller || call?.dialNumber || call?.contactNumber || '').replace(/^\+91/, '');
  const matchingWindowEnd = effectiveEndMs + 15 * 60 * 1000;
  return (
    conversations
      .filter((conversation, index) => {
        const conversationKey = getConversationMatchKey(conversation, index);
        if (usedKeys.has(conversationKey)) return false;
        const conversationNumber = String(conversation?.contactNumber || '').replace(/^\+91/, '');
        if (callNumber && conversationNumber && conversationNumber !== callNumber) return false;
        const conversationTime = normalizeTimeValue(conversation?.updatedAt || conversation?.createdAt);
        return conversationTime >= startMs - 5 * 60 * 1000 && conversationTime <= matchingWindowEnd;
      })
      .sort((a, b) => {
        const aTime = normalizeTimeValue(a?.updatedAt || a?.createdAt);
        const bTime = normalizeTimeValue(b?.updatedAt || b?.createdAt);
        return Math.abs(aTime - effectiveEndMs) - Math.abs(bTime - effectiveEndMs);
      })[0] || null
  );
};

const matchConversationsToCalls = (calls = [], conversations = []) => {
  if (!Array.isArray(calls) || calls.length === 0) return [];

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
    };
  });
};

export default function LeadAndCallInfoPanel({
  userCall,
  handleCall,
  status,
  formSubmitted,
  connectionStatus,
  dispositionModal,
  userCampaign,
  username,
  token,
  callType,
  setFormSubmitted,
  activeCallContext,
}) {
  const { setWorkspaceActiveCall, setDispositionModal, finalizePostCallContext, isSticky, setIsSticky } =
    useContext(JssipContext);
  const [activeTab, setActiveTab] = useState('callerInfo');
  const [localFormData, setLocalFormData] = useState({});
  const [lastDraftKey, setLastDraftKey] = useState(null);
  const [isFormDataInitialized, setIsFormDataInitialized] = useState(false);
  const [retainedUserCall, setRetainedUserCall] = useState(null);

  // Internal state management
  const [startDate, setStartDate] = useState(moment().subtract(7, 'days').startOf('day').toDate());
  const [endDate, setEndDate] = useState(moment().endOf('day').toDate());
  const [apiCallData, setApiCallData] = useState([]);
  const [leadsData, setLeadsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formConfig, setFormConfig] = useState(null);
  const [formId, setFormId] = useState(null);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);
  const [conversationDetails, setConversationDetails] = useState([]);
  const [loadingConversation, setLoadingConversation] = useState(false);
  const [manualEntryMode, setManualEntryMode] = useState(false);
  const [isCampaignWebformEnabled, setIsCampaignWebformEnabled] = useState(false);
  const [isFormAvailabilityResolved, setIsFormAvailabilityResolved] = useState(false);
  const [contactConversationHistory, setContactConversationHistory] = useState([]);
  const [latestConversation, setLatestConversation] = useState(null);
  const [loadingContactConversationHistory, setLoadingContactConversationHistory] = useState(false);
  const [contactProfile, setContactProfile] = useState(null);
  const [loadingContactProfile, setLoadingContactProfile] = useState(false);
  const [contactWorkspace, setContactWorkspace] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [savingSticky, setSavingSticky] = useState(false);
  const [stickyOverride, setStickyOverride] = useState(null);
  const [callHistoryRowsPerPage, setCallHistoryRowsPerPage] = useState(10);
  const [callHistoryPage, setCallHistoryPage] = useState(0);
  const [callHistoryDatePreset, setCallHistoryDatePreset] = useState('7d');
  const [expandedCallHistoryId, setExpandedCallHistoryId] = useState(null);
  const callHistoryRowRefs = useRef({});

  const allowManualEntry = useMemo(() => {
    if (typeof window === 'undefined') return false;
    try {
      const tokenData = localStorage.getItem('token');
      if (!tokenData) return false;
      const parsedData = JSON.parse(tokenData);
      return parsedData?.userData?.allowManualEntry === true;
    } catch (error) {
      return false;
    }
  }, [token]);

  const isDispositionEnabled = useMemo(() => {
    if (typeof window === 'undefined') return true;
    try {
      const tokenData = localStorage.getItem('token');
      if (!tokenData) return true;
      const parsedData = JSON.parse(tokenData);
      return parsedData?.userData?.disposition !== false;
    } catch (error) {
      return true;
    }
  }, [token]);

  const stickyPreferences = useMemo(() => {
    if (typeof window === 'undefined') {
      return { enabled: false, mode: 'loose' };
    }

    try {
      const tokenData = localStorage.getItem('token');
      if (!tokenData) {
        return { enabled: false, mode: 'loose' };
      }

      const parsedData = JSON.parse(tokenData);
      return {
        enabled: parsedData?.userData?.stickyEnabled !== false,
        mode: parsedData?.userData?.stickyMode || 'loose',
      };
    } catch (error) {
      return { enabled: false, mode: 'loose' };
    }
  }, [token]);

  const manualEntryCall = useMemo(() => {
    if (!manualEntryMode) return null;
    return {
      contactNumber: localFormData?.contactNumber || '',
      alternateNumber: localFormData?.alternateNumber || '',
      comment: localFormData?.comment || '',
      isManualEntry: true,
      isFresh: false,
    };
  }, [localFormData?.alternateNumber, localFormData?.comment, localFormData?.contactNumber, manualEntryMode]);

  const isManualEntryActive = manualEntryMode && !userCall && !retainedUserCall;

  const activeUserCall = useMemo(
    () => (dispositionModal ? userCall || retainedUserCall || manualEntryCall : userCall || manualEntryCall),
    [dispositionModal, manualEntryCall, retainedUserCall, userCall],
  );

  useEffect(() => {
    if (activeUserCall) {
      setWorkspaceActiveCall(activeUserCall);
      return;
    }

    if (!dispositionModal) {
      setWorkspaceActiveCall(null);
    }
  }, [activeUserCall, dispositionModal, setWorkspaceActiveCall]);

  useEffect(
    () => () => {
      setWorkspaceActiveCall(null);
    },
    [setWorkspaceActiveCall],
  );

  useEffect(() => {
    if (userCall) {
      setRetainedUserCall(userCall);
      setWorkspaceActiveCall(userCall);
      setManualEntryMode(false);
      setActiveTab('callerInfo');
    }
  }, [setWorkspaceActiveCall, userCall]);

  useEffect(() => {
    if (!dispositionModal || status !== 'start') {
      return;
    }

    if (!isFormAvailabilityResolved) {
      return;
    }

    if (isCampaignWebformEnabled) {
      return;
    }

    if (isDispositionEnabled) {
      if (!formSubmitted) {
        setFormSubmitted(true);
      }
      return;
    }

    finalizePostCallContext?.();
    setRetainedUserCall(null);
    setWorkspaceActiveCall(null);
    setFormSubmitted(false);
    setActiveTab('callerInfo');
    setDispositionModal?.(false);
  }, [
    dispositionModal,
    finalizePostCallContext,
    formSubmitted,
    isFormAvailabilityResolved,
    isCampaignWebformEnabled,
    isDispositionEnabled,
    setDispositionModal,
    setFormSubmitted,
    setWorkspaceActiveCall,
    status,
  ]);

  const normalizedContactNumber = useMemo(() => {
    const rawNumber = String(
      activeUserCall?.contactNumber ||
        localFormData?.contactNumber ||
        activeUserCall?.contact_number ||
        activeUserCall?.callerNumber ||
        activeUserCall?.Caller ||
        activeUserCall?.number ||
        '',
    ).trim();

    if (!rawNumber) {
      return 'no-contact';
    }

    return rawNumber.replace(/^\+91/, '') || rawNumber;
  }, [activeUserCall, localFormData?.contactNumber]);

  useEffect(() => {
    setStickyOverride(null);
  }, [normalizedContactNumber]);

  const currentCallReference = useMemo(
    () =>
      String(
        (manualEntryMode && `manual:${normalizedContactNumber}`) ||
          activeUserCall?.channelIDstring ||
          activeUserCall?.channelID ||
          activeUserCall?.incomingchannel ||
          activeUserCall?.bridgeID ||
          activeUserCall?.startTime ||
          normalizedContactNumber ||
          'no-call',
      ),
    [activeUserCall, manualEntryMode, normalizedContactNumber],
  );

  const authHeaders = useMemo(
    () =>
      token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {},
    [token],
  );

  const normalizeConversationLookupKey = useCallback((value) => {
    return String(value || '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
  }, []);

  const dynamicFormFields = useMemo(() => {
    if (!Array.isArray(formConfig?.sections)) {
      return [];
    }

    return formConfig.sections.flatMap((section) => (Array.isArray(section?.fields) ? section.fields : []));
  }, [formConfig]);

  const resolveDynamicFieldStorageTarget = useCallback((field = {}) => {
    const rawStorageTarget = String(field?.storageTarget || '')
      .trim()
      .toLowerCase();

    if (rawStorageTarget === 'contact' || rawStorageTarget === 'conversation') {
      return rawStorageTarget;
    }

    const normalizedFieldName = String(field?.name || '')
      .replace(/[_\s]+/g, '')
      .trim()
      .toLowerCase();

    if (
      field?.systemField === 'callerNumber' ||
      field?.systemField === 'callerName' ||
      field?.systemField === 'alternateNumber' ||
      ['contactnumber', 'callernumber', 'number', 'callername', 'alternatenumber'].includes(normalizedFieldName)
    ) {
      return 'contact';
    }

    return 'contact';
  }, []);

  const hasMeaningfulSubmittedValue = useCallback((value) => {
    if (Array.isArray(value)) {
      return value.length > 0;
    }

    if (value === undefined || value === null) {
      return false;
    }

    if (typeof value === 'string') {
      return value.trim() !== '';
    }

    return true;
  }, []);

  const buildDynamicFormPayloads = useCallback(
    (submittedData = {}) => {
      const contactData = {};
      const conversationFields = {};

      dynamicFormFields.forEach((field) => {
        const fieldName = String(field?.name || '').trim();
        if (!fieldName || !Object.prototype.hasOwnProperty.call(submittedData, fieldName)) {
          return;
        }

        const value = submittedData[fieldName];
        if (!hasMeaningfulSubmittedValue(value)) {
          return;
        }

        if (
          field?.systemField === 'callerNumber' ||
          ['contactnumber', 'callernumber', 'number'].includes(fieldName.replace(/[_\s]+/g, '').toLowerCase())
        ) {
          return;
        }

        if (resolveDynamicFieldStorageTarget(field) === 'conversation') {
          conversationFields[fieldName] = value;
        } else {
          contactData[fieldName] = value;
        }
      });

      const contactNumber = String(submittedData.contactNumber || activeUserCall?.contactNumber || '').trim();
      if (contactNumber) {
        contactData.contactNumber = contactNumber;
      }

      return {
        contactData,
        contactNumber,
        conversationFields,
      };
    },
    [activeUserCall?.contactNumber, dynamicFormFields, hasMeaningfulSubmittedValue, resolveDynamicFieldStorageTarget],
  );

  const hasExistingConversation = useMemo(
    () => Boolean(latestConversation && Object.keys(latestConversation).length > 0),
    [latestConversation],
  );

  const workspaceContact = useMemo(() => {
    if (contactWorkspace?.contact) {
      return contactWorkspace.contact;
    }

    const fallbackName =
      latestConversation?.['Caller Name'] ||
      latestConversation?.name ||
      contactProfile?.name ||
      contactProfile?.firstName ||
      '';

    return {
      name: String(fallbackName || '').trim(),
      phone: normalizedContactNumber !== 'no-contact' ? normalizedContactNumber : '',
      tags: [],
      lastDisposition: '',
      totalCalls: 0,
      lastCampaign: '',
      lastCallTime: null,
    };
  }, [contactProfile, contactWorkspace?.contact, latestConversation, normalizedContactNumber]);

  const workspaceQuickStats = useMemo(
    () =>
      contactWorkspace?.quickStats || {
        totalCalls: contactConversationHistory.length,
        connectedCalls: 0,
        lastDisposition: workspaceContact?.lastDisposition || 'N/A',
        campaign: workspaceContact?.lastCampaign || 'N/A',
      },
    [
      contactConversationHistory.length,
      contactWorkspace?.quickStats,
      workspaceContact?.lastCampaign,
      workspaceContact?.lastDisposition,
    ],
  );

  const workspaceTimeline = useMemo(() => contactWorkspace?.timeline || [], [contactWorkspace?.timeline]);
  const workspaceNotes = useMemo(() => contactWorkspace?.notes || [], [contactWorkspace?.notes]);
  const workspaceCalls = useMemo(() => contactWorkspace?.calls || [], [contactWorkspace?.calls]);
  const workspaceCampaigns = useMemo(() => contactWorkspace?.campaigns || [], [contactWorkspace?.campaigns]);
  const contactSummaryItems = useMemo(() => workspaceTimeline.slice(0, 3), [workspaceTimeline]);
  const filteredWorkspaceCalls = useMemo(() => {
    return workspaceCalls.filter((call) => {
      const callTime = call?.startTime || call?.createdAt || call?.updatedAt;
      if (callHistoryDatePreset === 'all') return true;
      const when = moment(Number.isFinite(Number(callTime)) ? Number(callTime) : callTime);
      if (!when.isValid()) return true;
      const now = moment();
      if (callHistoryDatePreset === '7d') return when.isSameOrAfter(now.clone().subtract(6, 'days').startOf('day'));
      if (callHistoryDatePreset === '30d') return when.isSameOrAfter(now.clone().subtract(29, 'days').startOf('day'));
      return true;
    });
  }, [callHistoryDatePreset, workspaceCalls]);
  const callHistoryTotalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredWorkspaceCalls.length / callHistoryRowsPerPage)),
    [callHistoryRowsPerPage, filteredWorkspaceCalls.length],
  );
  const pagedWorkspaceCalls = useMemo(
    () =>
      filteredWorkspaceCalls.slice(
        callHistoryPage * callHistoryRowsPerPage,
        callHistoryPage * callHistoryRowsPerPage + callHistoryRowsPerPage,
      ),
    [callHistoryPage, callHistoryRowsPerPage, filteredWorkspaceCalls],
  );
  const workspaceCallsWithConversations = useMemo(
    () => matchConversationsToCalls(pagedWorkspaceCalls, contactConversationHistory),
    [contactConversationHistory, pagedWorkspaceCalls],
  );
  useEffect(() => {
    if (!expandedCallHistoryId) return undefined;

    const frameId = window.requestAnimationFrame(() => {
      callHistoryRowRefs.current?.[expandedCallHistoryId]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [expandedCallHistoryId]);

  const resolvedCallContext = useMemo(
    () => ({
      didNumber: activeCallContext?.didNumber || activeUserCall?.didNumber || null,
      isAfterHours:
        activeCallContext?.isAfterHours === true ||
        activeUserCall?.isAfterHours === true ||
        activeUserCall?.isAfterhrs === true ||
        false,
      businessHoursSource: activeCallContext?.businessHoursSource || activeUserCall?.businessHoursSource || null,
      isSticky:
        activeCallContext?.isSticky === true ||
        activeUserCall?.isSticky === true ||
        Boolean(activeUserCall?.stickyAgent) ||
        contactProfile?.isSticky === true,
      stickyAgent: activeCallContext?.stickyAgent || activeUserCall?.stickyAgent || null,
    }),
    [activeCallContext, activeUserCall, contactProfile],
  );

  const isStickyContact = stickyOverride ?? resolvedCallContext.isSticky;

  const handleStickyContact = useCallback(async () => {
    if (!stickyPreferences.enabled || !normalizedContactNumber || normalizedContactNumber === 'no-contact') {
      return;
    }

    try {
      setSavingSticky(true);
      await axios.post(
        `${window.location.origin}/contact/sticky`,
        {
          contactNumber: normalizedContactNumber,
          campaignId: userCampaign,
          enabled: !isStickyContact,
          mode: stickyPreferences.mode,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            ...authHeaders,
          },
        },
      );
      setStickyOverride(!isStickyContact);
      toast.success(!isStickyContact ? 'Customer marked sticky.' : 'Sticky removed for this customer.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update sticky preference.');
    } finally {
      setSavingSticky(false);
    }
  }, [
    authHeaders,
    isStickyContact,
    normalizedContactNumber,
    stickyPreferences.enabled,
    stickyPreferences.mode,
    userCampaign,
  ]);

  const draftStorageKey = useMemo(() => {
    if (!activeUserCall && !manualEntryMode) return null;

    const formReference = formConfig?.formId || formId || 'contact-form';
    const draftContactKey =
      manualEntryMode &&
      (!normalizedContactNumber || normalizedContactNumber === 'no-contact' || normalizedContactNumber.length < 10)
        ? 'pending-manual'
        : normalizedContactNumber;

    return [
      'leadFormDraft',
      username || 'agent',
      userCampaign || 'no-campaign',
      manualEntryMode ? 'manual' : callType || 'unknown',
      formReference,
      draftContactKey,
    ].join(':');
  }, [
    activeUserCall,
    callType,
    formConfig?.formId,
    formId,
    manualEntryMode,
    normalizedContactNumber,
    userCampaign,
    username,
  ]);

  const fetchWithTokenRetry = async (url, token, refreshToken, config = {}) => {
    // Use token if available, otherwise use refreshToken
    const authToken = token || refreshToken;

    try {
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${authToken}` },
        ...config,
      });
      return res;
    } catch (err) {
      if (err.response && err.response.status === 401) {
        try {
          const savedUsername = typeof window !== 'undefined' ? localStorage.getItem('savedUsername') : null;
          const savedPassword = typeof window !== 'undefined' ? localStorage.getItem('savedPassword') : null;
          const existingTokenData =
            typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('token') || 'null') || {} : {};

          if (!savedUsername || !savedPassword) {
            throw new Error('No saved credentials found');
          }

          const refreshRes = await axios.post(`${window.location.origin}/refresh-token-agent`, {
            userid: savedUsername,
            password: savedPassword,
          });

          const newToken = refreshRes.data?.token;
          if (!newToken) {
            throw new Error(refreshRes.data?.message || 'Unable to refresh agent token');
          }

          const updatedTokenData = {
            ...existingTokenData,
            token: newToken,
          };
          localStorage.setItem('token', JSON.stringify(updatedTokenData));
          window.dispatchEvent(new CustomEvent('auth-token-updated'));

          const retryRes = await axios.get(url, {
            headers: { Authorization: `Bearer ${newToken}` },
            ...config,
          });
          return retryRes;
        } catch (refreshErr) {
          throw refreshErr;
        }
      } else {
        throw err;
      }
    }
  };

  useEffect(() => {
    if (!userCampaign) {
      setIsCampaignWebformEnabled(false);
      setIsFormAvailabilityResolved(true);
      setFormId(null);
      setFormConfig(null);
      return;
    }

    async function fetchFormList() {
      try {
        setLoading(true);
        setIsFormAvailabilityResolved(false);

        const tokenData = localStorage.getItem('token');
        let token = null;
        let refreshToken = localStorage.getItem('refreshToken');

        if (tokenData) {
          const parsedData = JSON.parse(tokenData);
          token = parsedData.token || parsedData.accessToken;
          refreshToken = parsedData.refreshToken || refreshToken;
        }

        if (!token) {
          setFormId(null);
          setFormConfig(null);
          return;
        }

        const res = await fetchWithTokenRetry(
          `${window.location.origin}/getDynamicFormDataAgent/${userCampaign}`,
          token,
          refreshToken,
        );

        const forms = res.data.agentWebForm || [];
        const webformEnabled = res.data?.webformEnabled === true;
        setIsCampaignWebformEnabled(webformEnabled);

        if (!webformEnabled) {
          setFormId(null);
          setFormConfig(null);
          return;
        }

        if (forms.length === 0) {
          setFormId(null);
          setFormConfig(null);
          return;
        }

        let targetType = manualEntryMode ? 'incoming' : callType === 'outgoing' ? 'outgoing' : 'incoming';

        // Try multiple possible property names and values
        let matchingForm = forms.find((form) => {
          // Check different possible property names
          const formType = form.formType || form.type || form.Type || form.form_type;
          const formTypeString = formType ? String(formType).toLowerCase() : '';

          return formTypeString === targetType;
        });

        // If no match found, try fallback logic
        if (!matchingForm && forms.length > 0) {
          // Fallback 1: Use first form if only one exists
          if (forms.length === 1) {
            matchingForm = forms[0];
          }

          // Fallback 2: Check for different property patterns
          if (!matchingForm) {
            matchingForm = forms.find((form) => {
              // Check if form has different type indicators
              const hasOutgoing = JSON.stringify(form).toLowerCase().includes('outgoing');
              const hasIncoming = JSON.stringify(form).toLowerCase().includes('incoming');

              if (targetType === 'outgoing' && hasOutgoing) return true;
              if (targetType === 'incoming' && hasIncoming) return true;

              return false;
            });
          }

          // Fallback 3: Just use the first form
          if (!matchingForm) {
            matchingForm = forms[0];
          }
        }

        if (matchingForm) {
          // Try different property names for formId
          const formId = matchingForm.formId || matchingForm.id || matchingForm.Id || matchingForm.form_id;
          setFormId(formId);
        } else {
          setFormId(null);
          setFormConfig(null);
        }
      } catch (err) {
        // On error, fall back to static form
        setIsCampaignWebformEnabled(false);
        setFormId(null);
        setFormConfig(null);
      } finally {
        setLoading(false);
        setIsFormAvailabilityResolved(true);
      }
    }

    fetchFormList();
  }, [userCampaign, callType, manualEntryMode]);

  useEffect(() => {
    if (!formId) {
      setFormConfig(null);
      return;
    }

    async function fetchFormDetails() {
      try {
        setLoading(true);

        const tokenData = localStorage.getItem('token');
        let token = null;
        let refreshToken = localStorage.getItem('refreshToken');

        if (tokenData) {
          const parsedData = JSON.parse(tokenData);
          token = parsedData.token || parsedData.accessToken;
          refreshToken = parsedData.refreshToken || refreshToken;
        }

        if (!token) {
          setFormConfig(null);
          return;
        }

        const res = await fetchWithTokenRetry(
          `${window.location.origin}/getDynamicFormData/${formId}`,
          token,
          refreshToken,
        );

        const formConfigData = res.data.result;

        if (formConfigData && formConfigData.sections && formConfigData.sections.length > 0) {
          setFormConfig(formConfigData);
        } else {
          setFormConfig(null);
        }
      } catch (err) {
        // On error, fall back to static form
        setFormConfig(null);
      } finally {
        setLoading(false);
      }
    }

    fetchFormDetails();
  }, [formId]);

  // Data fetching functions
  const fetchLeadsWithDateRange = useCallback(async () => {
    if (!userCampaign || !username || !token || !startDate || !endDate) return;

    setLoading(true);
    try {
      const formattedStartDate = moment(startDate).format('YYYY-MM-DD');
      const formattedEndDate = moment(endDate).format('YYYY-MM-DD');

      const response = await axios.post(
        `${window.location.origin}/leadswithdaterange`,
        {
          startDate: formattedStartDate,
          endDate: formattedEndDate,
          campaignID: userCampaign,
          user: username,
        },
        {
          headers: authHeaders,
        },
      );

      const leads = response.data.data || [];
      setLeadsData(leads);
    } catch (error) {
      setLeadsData([]);
    } finally {
      setLoading(false);
    }
  }, [authHeaders, endDate, startDate, token, userCampaign, username]);

  const fetchCallDataByAgent = useCallback(async () => {
    if (!username || !token || !startDate || !endDate) return;

    setLoading(true);
    try {
      const formattedStartDate = moment(startDate).format('YYYY-MM-DD');
      const formattedEndDate = moment(endDate).format('YYYY-MM-DD');

      const response = await axios.post(
        `${window.location.origin}/reports/calls/byAgent`,
        {
          startDate: formattedStartDate,
          endDate: formattedEndDate,
          agentName: username,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            ...authHeaders,
          },
        },
      );

      const calls = response.data.result || [];
      setApiCallData(calls);
    } catch (error) {
      setApiCallData([]);
    } finally {
      setLoading(false);
    }
  }, [authHeaders, endDate, startDate, token, username]);

  // Map lead data function
  const mapLeadData = useCallback((rawData) => {
    if (!Array.isArray(rawData)) rawData = [rawData];

    return rawData.map((item) => {
      const mapped = {
        name: '',
        email: '',
        phone: '',
        status: 'Pending',
        uploadDate: item.uploadDate || null,
        ...item,
      };

      Object.entries(item).forEach(([key, value]) => {
        if (!value && value !== 0) return;
        const v = String(value).trim();
        const k = key.toLowerCase();

        if (v.includes('@') && v.includes('.')) mapped.email = v;
        else if (/^\d{10}$/.test(v)) mapped.phone = v;
        else if (k.includes('name') && !k.includes('file') && !k.includes('user')) mapped.name = v;
        else if (k.includes('date') || k.includes('time')) mapped.uploadDate = value;
      });

      switch (item.lastDialedStatus) {
        case 1:
        case 9:
          mapped.status = 'Complete';
          break;
        case 0:
        default:
          mapped.status = 'Pending';
      }

      return mapped;
    });
  }, []);

  // Fetch data when dependencies change
  useEffect(() => {
    fetchLeadsWithDateRange();
    fetchCallDataByAgent();
  }, [fetchLeadsWithDateRange, fetchCallDataByAgent]);

  // Get mapped leads
  const mappedLeads = useMemo(() => mapLeadData(leadsData), [leadsData, mapLeadData]);

  // Initialize form data when current call/form changes
  useEffect(() => {
    const initializationSignature = [
      draftStorageKey || 'none',
      latestConversation?._id || latestConversation?.id || latestConversation?.createdAt || 'none',
      contactProfile?.contactNumber || contactProfile?.ContactNumber || 'no-contact-profile',
      contactProfile?.updatedAt || contactProfile?.uploadDate || 'no-contact-profile-time',
    ].join(':');

    if ((!activeUserCall && !manualEntryMode) || !draftStorageKey || lastDraftKey === initializationSignature) {
      return;
    }

    const initialFormData = {};
    const sourceCallData = activeUserCall || {};
    const contactEntries = contactProfile
      ? Object.entries(contactProfile).filter(([key]) => {
          if (!key || key.startsWith('_')) return false;
          return !['id', 'isDeleted', 'adminuser', 'uploadDate'].includes(key);
        })
      : [];
    const conversationEntries = latestConversation
      ? Object.entries(latestConversation).filter(([key]) => {
          if (!key || key.startsWith('_')) return false;
          return ![
            'id',
            'adminuser',
            'userId',
            'createdAt',
            'updatedAt',
            'updatedBy',
            'editedInAdmin',
            'isDeleted',
            'formId',
            'formID',
            'formTitle',
            'formType',
            'campaignId',
            'campaignName',
            'callType',
            'callReference',
            'agentName',
            'entryMode',
            'isFresh',
          ].includes(key);
        })
      : [];
    const getConversationValue = (...candidates) => {
      for (const candidate of candidates) {
        if (!candidate) continue;
        const searchKey = String(candidate).trim().toLowerCase();

        // Exact match (ignoring case but keeping symbols like _)
        const exactMatch = conversationEntries.find(([key]) => String(key).trim().toLowerCase() === searchKey);
        if (exactMatch && exactMatch[1] !== undefined && exactMatch[1] !== null && `${exactMatch[1]}` !== '') {
          return exactMatch[1];
        }

        // Greedy normalization fallback
        const normalizedCandidate = normalizeConversationLookupKey(candidate);
        if (!normalizedCandidate) continue;

        const matchedEntry = conversationEntries.find(([entryKey]) => {
          const normalizedEntryKey = normalizeConversationLookupKey(entryKey);
          return normalizedEntryKey === normalizedCandidate;
        });

        if (matchedEntry && matchedEntry[1] !== undefined && matchedEntry[1] !== null && `${matchedEntry[1]}` !== '') {
          return matchedEntry[1];
        }
      }

      return undefined;
    };
    const getContactValue = (...candidates) => {
      for (const candidate of candidates) {
        if (!candidate) continue;
        const searchKey = String(candidate).trim().toLowerCase();

        // Exact match (ignoring case but keeping symbols like _)
        const exactMatch = contactEntries.find(([key]) => String(key).trim().toLowerCase() === searchKey);
        if (exactMatch && exactMatch[1] !== undefined && exactMatch[1] !== null && `${exactMatch[1]}` !== '') {
          return exactMatch[1];
        }

        // Greedy normalization fallback
        const normalizedCandidate = normalizeConversationLookupKey(candidate);
        if (!normalizedCandidate) continue;

        const matchedEntry = contactEntries.find(([entryKey]) => {
          const normalizedEntryKey = normalizeConversationLookupKey(entryKey);
          return normalizedEntryKey === normalizedCandidate;
        });

        if (matchedEntry && matchedEntry[1] !== undefined && matchedEntry[1] !== null && `${matchedEntry[1]}` !== '') {
          return matchedEntry[1];
        }
      }

      return undefined;
    };
    if (formConfig?.sections?.length > 0) {
      // Dynamic form initialization
      formConfig.sections.forEach((section) => {
        section.fields.forEach((field) => {
          const fieldName = field.name;
          const normalizedName = String(fieldName || '').toLowerCase();
          const normalizedLabel = String(field.label || '').toLowerCase();
          const storageTarget = resolveDynamicFieldStorageTarget(field);
          const getSourceFallbackValue = () => {
            if (
              field.systemField === 'callerNumber' ||
              normalizedName === 'contactnumber' ||
              normalizedName === 'callernumber' ||
              normalizedName === 'number' ||
              normalizedLabel.includes('caller number') ||
              normalizedLabel.includes('mobile no')
            ) {
              return sourceCallData.contactNumber || '';
            }

            if (
              field.systemField === 'callerName' ||
              normalizedName === 'caller_name' ||
              normalizedName === 'callername' ||
              normalizedLabel.includes('caller name')
            ) {
              return sourceCallData.callerName ?? sourceCallData.caller_name ?? sourceCallData.firstName ?? '';
            }

            if (
              field.systemField === 'alternateNumber' ||
              normalizedName === 'alternatenumber' ||
              normalizedLabel.includes('alternate')
            ) {
              return sourceCallData.alternateNumber || '';
            }

            const lowerFieldName = fieldName.toLowerCase();
            const userCallKeys = Object.keys(sourceCallData);

            // Exact match prioritized
            if (sourceCallData.hasOwnProperty(fieldName)) return sourceCallData[fieldName] ?? '';

            // Case-insensitive match fallback
            const matchedKey = userCallKeys.find((key) => key.toLowerCase() === lowerFieldName);
            return matchedKey !== undefined ? (sourceCallData[matchedKey] ?? '') : '';
          };

          if (
            field.systemField === 'callerNumber' ||
            normalizedName === 'contactnumber' ||
            normalizedName === 'callernumber' ||
            normalizedName === 'number' ||
            normalizedLabel.includes('caller number') ||
            normalizedLabel.includes('mobile no')
          ) {
            initialFormData[fieldName] = sourceCallData.contactNumber || '';
            return;
          }

          if (
            field.systemField === 'callerName' ||
            normalizedName === 'caller_name' ||
            normalizedName === 'callername' ||
            normalizedLabel.includes('caller name')
          ) {
            initialFormData[fieldName] =
              getContactValue(
                fieldName,
                field.label,
                field.question,
                'callerName',
                'caller_name',
                'CallerName',
                'firstName',
                'name',
              ) ??
              getSourceFallbackValue() ??
              '';
            return;
          }

          if (
            field.systemField === 'alternateNumber' ||
            normalizedName === 'alternatenumber' ||
            normalizedLabel.includes('alternate')
          ) {
            initialFormData[fieldName] =
              getContactValue(
                fieldName,
                field.label,
                field.question,
                'alternateNumber',
                'alternate number',
                'alternate contact',
              ) ||
              getSourceFallbackValue() ||
              '';
            return;
          }

          const storedValue =
            storageTarget === 'conversation'
              ? getConversationValue(fieldName, field.label, field.question)
              : getContactValue(fieldName, field.label, field.question);
          if (storedValue !== undefined) {
            initialFormData[fieldName] = storedValue;
            return;
          }

          const sourceFallbackValue = getSourceFallbackValue();
          if (sourceFallbackValue !== undefined && sourceFallbackValue !== null && `${sourceFallbackValue}` !== '') {
            initialFormData[fieldName] = sourceFallbackValue;
            return;
          }

          initialFormData[fieldName] = '';
        });
      });
    } else {
      // Static form initialization
      Object.assign(initialFormData, {
        firstName:
          getConversationValue('firstName', 'first name') ??
          getContactValue('firstName', 'first name', 'caller name', 'name') ??
          sourceCallData.firstName ??
          '',
        lastName:
          getConversationValue('lastName', 'last name') ??
          getContactValue('lastName', 'last name') ??
          sourceCallData.lastName ??
          '',
        emailId:
          getConversationValue('emailId', 'email', 'email address') ??
          getContactValue('emailId', 'email', 'email address') ??
          sourceCallData.emailId ??
          sourceCallData.Email ??
          sourceCallData.email ??
          '',
        contactNumber: sourceCallData.contactNumber || '',
        alternateNumber:
          getConversationValue('alternateNumber', 'alternate number', 'alternate contact') ??
          getContactValue('alternateNumber', 'alternate number', 'alternate contact') ??
          sourceCallData.alternateNumber ??
          '',
        Contactaddress:
          getConversationValue('Contactaddress', 'address', 'location') ??
          getContactValue('Contactaddress', 'address', 'location') ??
          sourceCallData.Contactaddress ??
          sourceCallData.address ??
          '',
        ContactState:
          getConversationValue('ContactState', 'state') ??
          getContactValue('ContactState', 'state') ??
          sourceCallData.ContactState ??
          sourceCallData.state ??
          '',
        ContactDistrict:
          getConversationValue('ContactDistrict', 'district') ??
          getContactValue('ContactDistrict', 'district') ??
          sourceCallData.ContactDistrict ??
          '',
        ContactCity:
          getConversationValue('ContactCity', 'city') ??
          getContactValue('ContactCity', 'city') ??
          sourceCallData.ContactCity ??
          sourceCallData.city ??
          sourceCallData.CIty ??
          '',
        ContactPincode:
          getConversationValue('ContactPincode', 'postal code', 'pincode', 'pin code') ??
          getContactValue('ContactPincode', 'postal code', 'pincode', 'pin code') ??
          sourceCallData.ContactPincode ??
          sourceCallData.postalCode ??
          sourceCallData['Pincode '] ??
          '',
        comment:
          getConversationValue('comment', 'remarks', 'comment', 'call remark') ??
          getContactValue('comment', 'remarks', 'comment', 'call remark') ??
          sourceCallData.comment ??
          '',
      });
    }

    try {
      const savedDraft = localStorage.getItem(draftStorageKey);
      if (savedDraft) {
        Object.assign(initialFormData, JSON.parse(savedDraft));
      }
    } catch (error) {}

    if (manualEntryMode && localFormData && Object.keys(localFormData).length > 0) {
      Object.assign(initialFormData, localFormData);
    }

    initialFormData.contactNumber = sourceCallData.contactNumber || initialFormData.contactNumber || '';
    initialFormData.isSticky = isStickyContact;
    if (isStickyContact) {
    }
    setLocalFormData(initialFormData);
    setLastDraftKey(initializationSignature);
    setIsFormDataInitialized(true);
  }, [
    activeUserCall,
    contactProfile,
    draftStorageKey,
    formConfig,
    lastDraftKey,
    latestConversation,
    localFormData,
    manualEntryMode,
    normalizeConversationLookupKey,
    resolveDynamicFieldStorageTarget,
    isStickyContact,
  ]);

  useEffect(() => {
    if (formSubmitted) {
      if (draftStorageKey) {
        localStorage.removeItem(draftStorageKey);
        localStorage.removeItem(`formNavigationState:${draftStorageKey}`);
      }
      setLocalFormData({});
      setIsFormDataInitialized(false);
      setLastDraftKey(null);
      setRetainedUserCall(null);
      setWorkspaceActiveCall(null);
      setManualEntryMode(false);
    }
  }, [draftStorageKey, formSubmitted, setWorkspaceActiveCall]);

  useEffect(() => {
    if (!draftStorageKey) return;

    if (localFormData && Object.keys(localFormData).length > 0) {
      localStorage.setItem(draftStorageKey, JSON.stringify(localFormData));
    }
  }, [draftStorageKey, localFormData]);

  // Update local form data handler
  const updateLocalFormData = useCallback(
    (newData) => {
      setLocalFormData((prev) => {
        const next = typeof newData === 'function' ? newData(prev) : { ...prev, ...newData };

        // Sync isSticky back to context if it changed in form data
        const nextIsSticky = !!next.isSticky;
        const prevIsSticky = !!prev.isSticky;
        if (nextIsSticky !== prevIsSticky) {
          setIsSticky(nextIsSticky);
        }

        return next;
      });
    },
    [setIsSticky],
  );

  // Sync context isSticky to localFormData
  useEffect(() => {
    if (localFormData?.isSticky !== isSticky) {
      setLocalFormData((prev) => ({ ...prev, isSticky }));
    }
  }, [isSticky, localFormData?.isSticky]);

  const buildConversationRecord = useCallback(
    (submittedData, overrides = {}) => ({
      ...submittedData,
      contactNumber: submittedData.contactNumber || activeUserCall?.contactNumber || '',
      agentName: username,
      campaignId: userCampaign || '',
      formId: overrides.formId ?? formConfig?.formId ?? null,
      formTitle: overrides.formTitle ?? formConfig?.formTitle ?? 'Contact Form',
      formType: overrides.formType ?? formConfig?.formType ?? (callType === 'outgoing' ? 'outgoing' : 'incoming'),
      callType: manualEntryMode ? formConfig?.formType || 'manual' : callType || '',
      entryMode: manualEntryMode ? 'manual' : 'call',
      callReference: currentCallReference,
    }),
    [
      activeUserCall?.contactNumber,
      callType,
      currentCallReference,
      formConfig?.formId,
      formConfig?.formTitle,
      formConfig?.formType,
      manualEntryMode,
      userCampaign,
      username,
    ],
  );

  // Handle form submission
  const handleContact = async (event, formDataToSubmit) => {
    event.preventDefault();

    const conversationData = buildConversationRecord(formDataToSubmit, {
      formId: 'contact-form',
      formTitle: 'Contact Form',
    });

    const isStickyContact = formDataToSubmit?.isSticky;
    console.log('[LeadAndCallInfoPanel] handleContact isSticky:', isStickyContact);

    const payload = {
      user: username,

      formObject: conversationData,
      data: {
        firstName: formDataToSubmit.firstName || '',
        lastName: formDataToSubmit.lastName || '',
        emailId: formDataToSubmit.emailId || '',
        contactNumber: formDataToSubmit.contactNumber || activeUserCall?.contactNumber || '',
        alternateNumber: formDataToSubmit.alternateNumber || '',
        comment: formDataToSubmit.comment || '',
        Contactaddress: formDataToSubmit.Contactaddress || '',
        ContactDistrict: formDataToSubmit.ContactDistrict || '',
        ContactCity: formDataToSubmit.ContactCity || '',
        ContactState: formDataToSubmit.ContactState || '',
        ContactPincode: formDataToSubmit.ContactPincode || '',
        isSticky: isStickyContact,
        agent: username,
        agentName: username,
      },
    };

    try {
      const response = await axios.post(`${window.location.origin}/addModifyContact`, payload, {
        headers: authHeaders,
      });

      if (response.data?.success) {
        toast.success(response.data.message || 'Contact saved successfully.');
        setFormSubmitted(true);
        setTimeout(() => {
          setLocalFormData({});
        }, 100);
      } else {
        toast.error(response.data.message || 'Failed to save contact.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error occurred.');
    }
  };

  const handleSubmit = async (formDataToSubmit) => {
    if (!formConfig) {
      toast.error('Form configuration not loaded');
      return;
    }

    const { contactData, contactNumber, conversationFields } = buildDynamicFormPayloads(formDataToSubmit);
    const isStickyContact = localFormData?.isSticky;
    console.log(isStickyContact, 'isStickyContact');
    const conversationData = buildConversationRecord({
      ...conversationFields,
      contactNumber,
    });

    const payload = {
      user: username,

      formObject: conversationData,
      data: {
        ...contactData,
        isSticky: isStickyContact,
        contactNumber: conversationData.contactNumber,
        agent: username,
        agentName: username,
      },
    };

    try {
      const response = await axios.post(`${window.location.origin}/addModifyContact`, payload, {
        headers: authHeaders,
      });

      if (response.data?.success) {
        toast.success(response.data.message || 'Contact saved successfully.');
        setFormSubmitted(true);
        // Clear form after successful submission
        setTimeout(() => {
          setLocalFormData({});
        }, 100);
      } else {
        toast.error(response.data.message || 'Failed to save contact.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error occurred.');
    }
  };

  // Filter mapped leads for the current contact
  const filteredMappedLeadsForPanel = useMemo(() => {
    if (!mappedLeads || !startDate || !endDate || !activeUserCall) return [];

    const normalizedContactNumber = String(activeUserCall.contactNumber || '').replace(/^\+91/, '');
    const startOfDay = moment(startDate).startOf('day');
    const endOfDay = moment(endDate).endOf('day');

    return mappedLeads.filter((lead) => {
      const leadUploadTime = moment(lead.uploadDate);
      const normalizedLeadPhone = String(lead.phone || '').replace(/^\+91/, '');

      return (
        normalizedLeadPhone === normalizedContactNumber && leadUploadTime.isBetween(startOfDay, endOfDay, null, '[]')
      );
    });
  }, [activeUserCall, mappedLeads, startDate, endDate]);

  // Get current lead (most recent)
  const currentLead = useMemo(() => {
    if (contactWorkspace?.latestLead) {
      return contactWorkspace.latestLead;
    }

    if (!filteredMappedLeadsForPanel || filteredMappedLeadsForPanel.length === 0) return null;

    const sortedLeads = [...filteredMappedLeadsForPanel].sort(
      (a, b) => moment(b.uploadDate).valueOf() - moment(a.uploadDate).valueOf(),
    );
    return sortedLeads[0];
  }, [contactWorkspace?.latestLead, filteredMappedLeadsForPanel]);

  // Filter API call data for the current contact
  const filteredApiCallDataForPanel = useMemo(() => {
    if (!apiCallData || !startDate || !endDate || !activeUserCall) return [];

    const normalizedContactNumber = String(activeUserCall.contactNumber || '').replace(/^\+91/, '');
    const startOfDay = moment(startDate).startOf('day');
    const endOfDay = moment(endDate).endOf('day');

    return apiCallData.filter((call) => {
      const callTime = moment(call.startTime);
      const normalizedCallNumber = String(call.Caller || call.dialNumber || '').replace(/^\+91/, '');

      return normalizedCallNumber === normalizedContactNumber && callTime.isBetween(startOfDay, endOfDay, null, '[]');
    });
  }, [activeUserCall, apiCallData, startDate, endDate]);

  // Get current API call record (most recent)
  const currentApiCallRecord = useMemo(() => {
    if (workspaceCalls.length > 0) {
      return workspaceCalls[0];
    }

    if (!filteredApiCallDataForPanel || filteredApiCallDataForPanel.length === 0) return null;

    const sortedCalls = [...filteredApiCallDataForPanel].sort(
      (a, b) => moment(b.startTime).valueOf() - moment(a.startTime).valueOf(),
    );
    return sortedCalls[0];
  }, [filteredApiCallDataForPanel, workspaceCalls]);

  const fetchContactWorkspace = useCallback(async () => {
    if (!token) {
      setContactWorkspace(null);
      setContactConversationHistory([]);
      setLatestConversation(null);
      setContactProfile(null);
      return;
    }

    const contactNumber = normalizedContactNumber;
    if (!contactNumber || contactNumber === 'no-contact' || contactNumber.length < 10) {
      setContactWorkspace(null);
      setContactConversationHistory([]);
      setLatestConversation(null);
      setContactProfile(null);
      return;
    }

    try {
      setLoadingContactConversationHistory(true);
      setLoadingContactProfile(true);
      const response = await axios.get(`${window.location.origin}/contact/${encodeURIComponent(contactNumber)}/full`, {
        params: {
          limit: 75,
        },
        headers: authHeaders,
      });

      const result = response.data?.result || null;

      setContactWorkspace(result);
      setContactConversationHistory(Array.isArray(result?.conversations) ? result.conversations : []);
      setLatestConversation(result?.latestConversation || null);
      setContactProfile(result?.contactProfile || null);
    } catch (error) {
      setContactWorkspace(null);
      setContactConversationHistory([]);
      setLatestConversation(null);
      setContactProfile(null);
    } finally {
      setLoadingContactConversationHistory(false);
      setLoadingContactProfile(false);
    }
  }, [authHeaders, normalizedContactNumber, token]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      void fetchContactWorkspace();
    }, 250);

    return () => clearTimeout(timeoutId);
  }, [fetchContactWorkspace]);

  useEffect(() => {
    setCallHistoryPage(0);
  }, [callHistoryDatePreset, normalizedContactNumber, callHistoryRowsPerPage]);

  useEffect(() => {
    if (callHistoryPage >= callHistoryTotalPages) {
      setCallHistoryPage(Math.max(callHistoryTotalPages - 1, 0));
    }
  }, [callHistoryPage, callHistoryTotalPages]);

  const handleSaveNote = useCallback(async () => {
    const trimmedNote = String(noteText || '').trim();
    if (!trimmedNote || !normalizedContactNumber || normalizedContactNumber === 'no-contact') {
      return;
    }

    try {
      setSavingNote(true);
      const response = await axios.post(
        `${window.location.origin}/contact/notes`,
        {
          contactNumber: normalizedContactNumber,
          text: trimmedNote,
          campaignId: userCampaign || '',
          noteType: dispositionModal ? 'disposition' : 'general',
        },
        {
          headers: {
            'Content-Type': 'application/json',
            ...authHeaders,
          },
        },
      );

      if (response.data?.success) {
        toast.success('Note saved successfully.');
        setNoteText('');
        await fetchContactWorkspace();
        setActiveTab('contactDetails');
      } else {
        toast.error(response.data?.message || 'Failed to save note.');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save note.');
    } finally {
      setSavingNote(false);
    }
  }, [authHeaders, dispositionModal, fetchContactWorkspace, normalizedContactNumber, noteText, userCampaign]);

  const renderWorkspaceHeader = () => {
    if (!activeUserCall && !isManualEntryActive) {
      return null;
    }

    const displayPhone = String(workspaceContact?.phone || activeUserCall?.contactNumber || '').replace(/^\+91/, '');
    const displayName =
      String(workspaceContact?.name || '').trim() || (displayPhone ? `Contact ${displayPhone}` : 'Unknown Contact');

    return (
      <Card className="border bg-background/95 shadow-sm">
        <CardContent className="p-4 sm:p-5 space-y-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <div>
                <div className="text-xl font-semibold text-foreground">{displayName}</div>
                <div className="text-sm text-muted-foreground">{displayPhone || 'No caller number available'}</div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {workspaceContact?.tags?.map((tag, index) => (
                  <Badge key={`${tag}-${index}`} variant="outline">
                    {tag}
                  </Badge>
                ))}
                {isStickyContact ? (
                  <Badge className="bg-primary/10 text-primary hover:bg-primary/10">
                    Sticky{resolvedCallContext.stickyAgent ? ` • ${resolvedCallContext.stickyAgent}` : ''}
                  </Badge>
                ) : null}
                {resolvedCallContext.didNumber ? (
                  <Badge variant="secondary">DID {String(resolvedCallContext.didNumber).replace(/^\+91/, '')}</Badge>
                ) : null}
                {resolvedCallContext.isAfterHours ? (
                  <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">After Hours</Badge>
                ) : null}
              </div>
            </div>

            {displayPhone ? (
              <Button
                type="button"
                onClick={() => handleCall(displayPhone)}
                className="rounded-full bg-green-600 px-5 text-white hover:bg-green-700"
              >
                <Phone className="mr-2 h-4 w-4" />
                Call
              </Button>
            ) : null}
          </div>

          {contactSummaryItems.length > 0 ? (
            <div className="rounded-xl border bg-muted/20 px-4 py-3">
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Recent activity</div>
              <div className="mt-2 flex flex-col gap-2">
                {contactSummaryItems.map((item) => (
                  <div key={item.id} className="flex items-start justify-between gap-3 text-sm">
                    <div>
                      <div className="font-medium text-foreground">{item.title}</div>
                      <div className="text-muted-foreground">{item.subtitle}</div>
                    </div>
                    <div className="shrink-0 text-xs text-muted-foreground">
                      {moment(item.timestamp).isValid() ? moment(item.timestamp).fromNow() : '-'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <div className="rounded-xl border bg-muted/15 px-4 py-3">
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Total Calls</div>
              <div className="mt-1 text-lg font-semibold text-foreground">{workspaceQuickStats.totalCalls || 0}</div>
            </div>
            <div className="rounded-xl border bg-muted/15 px-4 py-3">
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Connected</div>
              <div className="mt-1 text-lg font-semibold text-foreground">
                {workspaceQuickStats.connectedCalls || 0}
              </div>
            </div>
            <div className="rounded-xl border bg-muted/15 px-4 py-3">
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Last Disposition</div>
              <div className="mt-1 text-sm font-medium text-foreground">
                {workspaceQuickStats.lastDisposition || 'N/A'}
              </div>
            </div>
            <div className="rounded-xl border bg-muted/15 px-4 py-3">
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Campaign</div>
              <div className="mt-1 text-sm font-medium text-foreground">{workspaceQuickStats.campaign || 'N/A'}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderTimelineTab = () => {
    if (loadingContactConversationHistory || loadingContactProfile) {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          <span className="ml-2 text-sm text-muted-foreground">Loading contact timeline...</span>
        </div>
      );
    }

    if (workspaceTimeline.length === 0) {
      return (
        <div className="text-center py-8">
          <Activity size={48} className="mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No contact activity is available for this number yet.</p>
        </div>
      );
    }

    const iconMap = {
      call: PhoneCall,
      conversation: FileText,
      callback: Clock,
      note: MessageSquare,
    };

    return (
      <div className="space-y-3">
        {workspaceTimeline.map((item) => {
          const ItemIcon = iconMap[item.category] || Activity;
          return (
            <Card
              key={item.id}
              className="border-l-4 border-l-primary/30 transition-all hover:border-l-primary/60 hover:shadow-sm"
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-primary/10 p-2 text-primary">
                    <ItemIcon size={16} />
                  </div>
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="font-medium text-foreground">{item.title}</div>
                        <div className="text-sm text-muted-foreground">{item.subtitle || 'No details available'}</div>
                      </div>
                      <div className="shrink-0 text-xs text-muted-foreground">
                        {moment(item.timestamp).isValid() ? moment(item.timestamp).format('DD MMM YYYY, hh:mm A') : '-'}
                      </div>
                    </div>
                    {item.meta?.agentName || item.meta?.callType || item.meta?.scheduledAt ? (
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        {item.meta?.agentName ? <Badge variant="outline">{item.meta.agentName}</Badge> : null}
                        {item.meta?.callType ? <Badge variant="secondary">{item.meta.callType}</Badge> : null}
                        {item.meta?.scheduledAt ? (
                          <Badge variant="outline">
                            Callback{' '}
                            {moment(item.meta.scheduledAt).isValid()
                              ? moment(item.meta.scheduledAt).format('DD MMM, hh:mm A')
                              : '-'}
                          </Badge>
                        ) : null}
                      </div>
                    ) : null}
                    {item.raw ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-auto px-0 text-xs text-primary"
                        onClick={() => handleHistoryCardClick(item.raw)}
                      >
                        View details
                      </Button>
                    ) : null}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  // Render contact form tab
  const renderContactDetailsTab = () => {
    const detailEntries = Object.entries(contactProfile || {})
      .filter(([key, value]) => {
        if (!key || key.startsWith('_')) return false;
        if (['id', 'isDeleted', 'adminuser', 'uploadDate', 'formId', 'formID', 'campaignId'].includes(key))
          return false;
        return value !== undefined && value !== null && `${value}`.trim() !== '' && typeof value !== 'object';
      })
      .slice(0, 10);

    return (
      <div className="h-full overflow-y-auto pr-1">
        <div className="space-y-4">
          <Card className="border bg-background/95 shadow-sm">
            <CardContent className="space-y-4 p-4 sm:p-5">
              <div className="space-y-2">
                <div className="text-xl font-semibold text-foreground">
                  {String(workspaceContact?.name || '').trim() ||
                    `Contact ${String(workspaceContact?.phone || '').replace(/^\+91/, '')}`}
                </div>
                <div className="text-sm text-muted-foreground">
                  {String(workspaceContact?.phone || activeUserCall?.contactNumber || '').replace(/^\+91/, '') ||
                    'No caller number available'}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {workspaceContact?.tags?.map((tag, index) => (
                    <Badge key={`${tag}-${index}`} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                  {isStickyContact ? (
                    <Badge className="bg-primary/10 text-primary hover:bg-primary/10">Sticky</Badge>
                  ) : null}
                  {stickyPreferences.enabled && normalizedContactNumber !== 'no-contact' ? (
                    <Button
                      type="button"
                      variant={isStickyContact ? 'secondary' : 'outline'}
                      size="sm"
                      className="h-8 rounded-full px-3"
                      onClick={() => void handleStickyContact()}
                      disabled={savingSticky}
                    >
                      {savingSticky ? 'Saving...' : isStickyContact ? 'Sticky Saved' : 'Make Sticky'}
                    </Button>
                  ) : null}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                <div className="rounded-xl border bg-muted/15 px-4 py-3">
                  <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">First Call</div>
                  <div className="mt-1 text-sm font-medium text-foreground">
                    {moment(workspaceContact?.firstCallTime || contactProfile?.firstCallTime).isValid()
                      ? moment(workspaceContact?.firstCallTime || contactProfile?.firstCallTime).format(
                          'DD MMM YYYY, hh:mm A',
                        )
                      : '-'}
                  </div>
                </div>
                <div className="rounded-xl border bg-muted/15 px-4 py-3">
                  <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Total Calls</div>
                  <div className="mt-1 text-lg font-semibold text-foreground">
                    {workspaceQuickStats.totalCalls || 0}
                  </div>
                </div>
                <div className="rounded-xl border bg-muted/15 px-4 py-3">
                  <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Last Disposition
                  </div>
                  <div className="mt-1 text-sm font-medium text-foreground">
                    {workspaceQuickStats.lastDisposition || 'N/A'}
                  </div>
                </div>
                <div className="rounded-xl border bg-muted/15 px-4 py-3">
                  <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Campaign</div>
                  <div className="mt-1 text-sm font-medium text-foreground">
                    {workspaceQuickStats.campaign || 'N/A'}
                  </div>
                </div>
              </div>

              {detailEntries.length > 0 ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {detailEntries.map(([key, value]) => (
                    <div key={key} className="rounded-xl border border-border/60 bg-background/80 px-4 py-3">
                      <div className="text-xs uppercase tracking-wide text-muted-foreground">
                        {key
                          .replace(/([A-Z])/g, ' $1')
                          .replace(/_/g, ' ')
                          .trim()}
                      </div>
                      <div className="mt-2 break-words text-sm font-medium text-foreground">{String(value)}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border/60 px-4 py-8 text-center text-sm text-muted-foreground">
                  No additional contact details are available for this caller.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  const renderContactTab = () => {
    if (!activeUserCall) return null;

    const submitLabel = hasExistingConversation ? 'Update Data' : 'Save Data';
    if (!isCampaignWebformEnabled && !isManualEntryActive) {
      return (
        <div className="h-full overflow-y-auto pr-1">
          <div className="space-y-4">
            <div className="rounded-xl border bg-muted/30 p-4">
              <div className="text-sm font-semibold text-foreground">Campaign form is disabled</div>
              <div className="text-sm text-muted-foreground">
                No form is configured for this campaign. Contact details remain available in the next tab.
              </div>
            </div>
          </div>
        </div>
      );
    }

    const stickyCheckbox = (
      <div className="flex items-center space-x-2 rounded-lg border bg-muted/20 px-3 py-2 mb-2">
        <Checkbox
          id="isSticky"
          checked={localFormData?.isSticky || false}
          onCheckedChange={(checked) => updateLocalFormData({ isSticky: !!checked })}
        />
        <Label htmlFor="isSticky" className="text-sm font-medium leading-none cursor-pointer">
          Sticky Contact
        </Label>
        <span className="text-[10px] text-muted-foreground ml-auto">Pin this contact to you for future calls</span>
      </div>
    );

    if (formConfig && formConfig?.sections && formConfig?.sections?.length > 0) {
      return (
        <div className="flex flex-col h-full min-h-0 overflow-hidden">
          {stickyCheckbox && <div className="shrink-0">{stickyCheckbox}</div>}
          <div className="flex-1 min-h-0 overflow-hidden">
            <DynamicForm
              key={formConfig.formId}
              formConfig={formConfig}
              formState={localFormData}
              setFormState={updateLocalFormData}
              userCall={activeUserCall}
              userCallDialog={true}
              formSubmitted={formSubmitted}
              handleSubmit={handleSubmit}
              localFormData={localFormData}
              status={status}
              connectionStatus={connectionStatus}
              setLocalFormData={updateLocalFormData}
              draftStorageKey={draftStorageKey}
              isManualEntry={isManualEntryActive}
              submitLabel={submitLabel}
            />
          </div>
        </div>
      );
    } else {
      return (
        <div className="h-full overflow-hidden">
          <div className="h-full space-y-4">
            {stickyCheckbox}
            <UserCall
              localFormData={localFormData}
              setLocalFormData={updateLocalFormData}
              handleSubmit={handleContact}
              userCall={activeUserCall}
              userCallDialog={true}
              formSubmitted={formSubmitted}
              isManualEntry={isManualEntryActive}
              submitLabel={submitLabel}
            />
          </div>
        </div>
      );
    }
  };

  // Render lead information tab
  const renderLeadTab = () => {
    if (!currentLead) {
      return (
        <div className="text-center py-8">
          <Building2 size={48} className="mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No campaign lead context is available for this contact.</p>
        </div>
      );
    }

    const detailFields = [];
    if (formConfig && Array.isArray(formConfig.sections) && formConfig.sections.length > 0) {
      formConfig.sections.forEach((section) => {
        section.fields.forEach((field) => {
          const fieldName = field.name;
          const label = field.label || field.name;
          const value = currentLead[fieldName] ?? '-';
          detailFields.push({ label, value: value?.toString().trim() || '-', key: fieldName });
        });
      });
    } else {
      detailFields.push(
        { label: 'Name', value: currentLead.name || '-', key: 'name' },
        { label: 'Email Address', value: currentLead.email || '-', key: 'email' },
        { label: 'Phone', value: currentLead.phone || '-', key: 'phone' },
        { label: 'Address 1', value: currentLead.address1 || '-', key: 'address1' },
        { label: 'Address 2', value: currentLead.address2 || '-', key: 'address2' },
        { label: 'City', value: currentLead.city || '-', key: 'city' },
        { label: 'State', value: currentLead.state || '-', key: 'state' },
        { label: 'Postal Code', value: currentLead.postalCode || '-', key: 'postalCode' },
        { label: 'Country', value: currentLead.country || '-', key: 'country' },
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {workspaceCampaigns.map((campaign) => (
            <Badge key={campaign} variant="outline">
              {campaign}
            </Badge>
          ))}
        </div>
        {detailFields.map((field, index) => (
          <div key={field.key}>
            <div className="flex justify-between items-start">
              <span className="text-sm font-medium text-muted-foreground">{field.label}:</span>
              <span className="text-sm text-right max-w-[200px] break-words">{field.value}</span>
            </div>
            {index < detailFields.length - 1 && <Separator className="mt-4" />}
          </div>
        ))}

        <div className="border-t pt-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Upload Date:</span>
            <span className="text-sm">
              {currentLead.uploadDate ? moment(currentLead.uploadDate).format('DD MMM YYYY, hh:mm A') : '-'}
            </span>
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Status:</span>
            <Badge
              variant={currentLead.status === 'Complete' ? 'default' : 'secondary'}
              className={
                currentLead.status === 'Complete'
                  ? 'bg-green-100 text-green-800 hover:bg-green-200'
                  : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
              }
            >
              {currentLead.status}
            </Badge>
          </div>
        </div>

        {currentLead.phone && (
          <div className="border-t pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Call {currentLead.name || 'Lead'}:</span>
              <Button
                onClick={() => handleCall(currentLead.phone)}
                size="sm"
                className="bg-green-600 text-white hover:bg-green-700 rounded-full px-4"
              >
                <Phone size={16} className="mr-2" /> Call {currentLead.phone}
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render call information tab
  const renderCallInfoTab = () => {
    if (!currentApiCallRecord) {
      return (
        <div className="text-center py-8">
          <Info size={48} className="mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No call information found for this number in the selected date range.</p>
        </div>
      );
    }

    const dataToDisplay = currentApiCallRecord._originalData || currentApiCallRecord;
    const specificKeysConfig = [
      { key: 'hangupcause', label: 'Hangup Cause' },
      { key: 'hanguptime', label: 'Hangup Time' },
      { key: 'dialNumber', label: 'Dial Number' },
      { key: 'anstime', label: 'Answer Time' },
      { key: 'startTime', label: 'Start Time' },
      { key: 'Disposition', label: 'Disposition' },
      { key: 'Type', label: 'Status' },
    ];

    return (
      <div className="space-y-4">
        {resolvedCallContext.didNumber || resolvedCallContext.isAfterHours || isStickyContact ? (
          <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2">
            {resolvedCallContext.didNumber ? (
              <Badge variant="outline">
                Incoming via: {String(resolvedCallContext.didNumber).replace(/^\+91/, '')}
              </Badge>
            ) : null}
            {resolvedCallContext.isAfterHours ? (
              <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">After Hours</Badge>
            ) : null}
            {isStickyContact ? (
              <Badge className="bg-primary/10 text-primary hover:bg-primary/10">
                Sticky{resolvedCallContext.stickyAgent ? ` • ${resolvedCallContext.stickyAgent}` : ''}
              </Badge>
            ) : null}
            {resolvedCallContext.businessHoursSource ? (
              <Badge variant="secondary" className="capitalize">
                {resolvedCallContext.businessHoursSource}
              </Badge>
            ) : null}
          </div>
        ) : null}
        {specificKeysConfig.map((fieldConfig, index) => {
          const key = fieldConfig.key;
          const label = fieldConfig.label;
          let value = dataToDisplay[key];
          let displayContent;

          if (typeof value === 'number' && (key.toLowerCase().includes('time') || key.toLowerCase().includes('date'))) {
            if (String(value).length === 10) {
              displayContent = moment.unix(value).format('DD MMM YYYY, hh:mm:ss A');
            } else if (String(value).length === 13) {
              displayContent = moment(value).format('DD MMM YYYY, hh:mm:ss A');
            } else {
              displayContent = String(value);
            }
          } else if (key === 'Type') {
            const isIncoming = value?.toLowerCase() === 'incoming';
            displayContent = (
              <Badge
                variant={isIncoming ? 'default' : 'secondary'}
                className={
                  isIncoming
                    ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                    : 'bg-purple-100 text-purple-800 hover:bg-purple-200'
                }
              >
                {isIncoming ? 'Incoming' : 'Outgoing'}
              </Badge>
            );
          } else if (key === 'Caller' || key === 'dialNumber') {
            displayContent = String(value || '-').replace(/^\+91/, '');
          } else {
            displayContent = String(value || '-');
          }

          return (
            <div key={key}>
              <div className="flex justify-between items-start">
                <span className="text-sm font-medium text-muted-foreground">{label}:</span>
                {key === 'Type' ? (
                  displayContent
                ) : (
                  <span className="text-sm text-right max-w-[200px] break-words whitespace-pre-wrap">
                    {displayContent}
                  </span>
                )}
              </div>
              {index < specificKeysConfig.length - 1 && <Separator className="mt-4" />}
            </div>
          );
        })}

        {currentApiCallRecord.Caller && (
          <div className="border-t pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Call Caller:</span>
              <Button
                onClick={() => handleCall(currentApiCallRecord.Caller)}
                size="sm"
                className="bg-green-600 text-white hover:bg-green-700 rounded-full px-4"
              >
                <Phone size={16} className="mr-2" /> Call {String(currentApiCallRecord.Caller).replace(/^\+91/, '')}
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderCallHistoryTab = () => {
    if (workspaceCalls.length === 0) {
      return (
        <div className="text-center py-8">
          <History size={48} className="mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No call history was found for this contact.</p>
        </div>
      );
    }

    return (
      <div className="flex h-full min-h-0 flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-sm text-muted-foreground">Showing call attempts for the last selected range.</div>
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={String(callHistoryRowsPerPage)}
              onValueChange={(value) => setCallHistoryRowsPerPage(Number(value))}
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
            <Select value={callHistoryDatePreset} onValueChange={setCallHistoryDatePreset}>
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

        <div className="min-h-0 flex-1 rounded-2xl border border-border/70">
          <div className="h-full overflow-auto">
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
                {workspaceCallsWithConversations.map(({ call, historyId, relatedConversation }) => {
                  const isIncoming =
                    String(call?.Type || '')
                      .trim()
                      .toLowerCase() === 'incoming';
                  const previewText =
                    getConversationRemark(relatedConversation) || 'Tagging not updated for this call.';
                  return (
                    <React.Fragment key={historyId}>
                      <TableRow className="hover:bg-muted/30">
                        <TableCell>
                          {moment(call?.startTime).isValid()
                            ? moment(call.startTime).format('DD MMM YYYY, hh:mm A')
                            : '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={isIncoming ? 'default' : 'secondary'}>
                            {isIncoming ? (
                              <PhoneIncoming size={14} className="mr-1" />
                            ) : (
                              <PhoneOutgoing size={14} className="mr-1" />
                            )}
                            {isIncoming ? 'Incoming' : 'Outgoing'}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatCallDuration(call)}</TableCell>
                        <TableCell>{String(call?.Disposition || 'N/A')}</TableCell>
                        <TableCell className="max-w-[260px] truncate text-muted-foreground">{previewText}</TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 rounded-full px-3 text-primary"
                            onClick={() => setExpandedCallHistoryId((prev) => (prev === historyId ? null : historyId))}
                          >
                            <Eye className="mr-1.5 h-4 w-4" />
                            {expandedCallHistoryId === historyId ? 'Hide' : 'View'}
                          </Button>
                        </TableCell>
                      </TableRow>
                      {expandedCallHistoryId === historyId ? (
                        <TableRow>
                          <TableCell colSpan={6} className="bg-muted/10">
                            <div
                              ref={(node) => {
                                if (node) {
                                  callHistoryRowRefs.current[historyId] = node;
                                } else {
                                  delete callHistoryRowRefs.current[historyId];
                                }
                              }}
                              className="space-y-3 py-2"
                            >
                              {!relatedConversation ? (
                                <div className="text-sm text-muted-foreground">Tagging not updated for this call.</div>
                              ) : (
                                <div className="rounded-xl border border-border/60 bg-background/80 px-4 py-3">
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="text-sm font-medium text-foreground">
                                      {relatedConversation?.formTitle || 'Tagging Conversation'}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {moment(
                                        relatedConversation?.updatedAt || relatedConversation?.createdAt,
                                      ).isValid()
                                        ? moment(
                                            relatedConversation?.updatedAt || relatedConversation?.createdAt,
                                          ).format('DD MMM YYYY, hh:mm A')
                                        : '-'}
                                    </div>
                                  </div>
                                  <div className="mt-2 text-sm text-muted-foreground">
                                    {getConversationRemark(relatedConversation) || 'Tagging updated for this call.'}
                                  </div>
                                  <div className="mt-3 grid gap-2 md:grid-cols-2">
                                    {Object.entries(relatedConversation)
                                      .filter(([key, value]) => {
                                        if (value === undefined || value === null || `${value}`.trim() === '')
                                          return false;
                                        return ![
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
                                        ].includes(key);
                                      })
                                      .slice(0, 8)
                                      .map(([key, value]) => (
                                        <div
                                          key={key}
                                          className="rounded-lg border border-border/50 bg-muted/10 px-3 py-2"
                                        >
                                          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                                            {key
                                              .replace(/([A-Z])/g, ' $1')
                                              .replace(/_/g, ' ')
                                              .trim()}
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
        </div>

        <div className="flex shrink-0 items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Page {callHistoryPage + 1} of {callHistoryTotalPages}
            <span className="mx-2 text-border">|</span>
            <span className="text-muted-foreground">{filteredWorkspaceCalls.length} total rows</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={callHistoryPage === 0}
              onClick={() => setCallHistoryPage((prev) => Math.max(prev - 1, 0))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={callHistoryPage + 1 >= callHistoryTotalPages}
              onClick={() => setCallHistoryPage((prev) => Math.min(prev + 1, callHistoryTotalPages - 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderNotesTab = () => (
    <div className="space-y-4">
      <Card className="border bg-muted/10">
        <CardContent className="p-4 space-y-3">
          <div className="text-sm font-medium text-foreground">Add a note for this contact</div>
          <Textarea
            value={noteText}
            onChange={(event) => setNoteText(event.target.value)}
            placeholder="Add follow-up guidance, visit notes, or context for the next agent..."
            className="min-h-[96px]"
          />
          <div className="flex justify-end">
            <Button
              type="button"
              onClick={() => void handleSaveNote()}
              disabled={savingNote || !String(noteText || '').trim()}
            >
              {savingNote ? 'Saving...' : 'Save Note'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {workspaceNotes.length === 0 ? (
        <div className="text-center py-8">
          <MessageSquare size={48} className="mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No notes have been added for this contact yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {workspaceNotes.map((note, index) => (
            <Card key={note.id || note._id || index} className="border-l-4 border-l-primary/25">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium text-foreground">{note.text}</div>
                    <div className="mt-2 text-xs text-muted-foreground">{note.createdBy || 'Unknown agent'}</div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {moment(note.createdAt).isValid() ? moment(note.createdAt).format('DD MMM YYYY, hh:mm A') : '-'}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  // Fetch conversations for a contact number from the API
  const handleHistoryCardClick = async (historyItem) => {
    setSelectedHistoryItem(historyItem);
    setConversationDetails(historyItem ? [historyItem] : []);
    setLoadingConversation(false);
  };

  // Render timeline tab
  const renderHistoryTab = () => {
    if (loadingContactConversationHistory) {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          <span className="ml-2 text-sm text-muted-foreground">Loading recent contact activity...</span>
        </div>
      );
    }

    if (workspaceTimeline.length === 0) {
      return (
        <div className="text-center py-8">
          <Activity size={48} className="mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No contact activity is available for this number yet.</p>
        </div>
      );
    }

    const iconMap = {
      call: PhoneCall,
      conversation: FileText,
      callback: Clock,
      note: MessageSquare,
    };

    return (
      <div className="space-y-3">
        {workspaceTimeline.map((item) => {
          const ItemIcon = iconMap[item.category] || Activity;
          return (
            <Card
              key={item.id}
              className="border-l-4 border-l-primary/30 transition-all hover:border-l-primary/60 hover:shadow-sm"
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-primary/10 p-2 text-primary">
                    <ItemIcon size={16} />
                  </div>
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="font-medium text-foreground">{item.title}</div>
                        <div className="text-sm text-muted-foreground">{item.subtitle || 'No details available'}</div>
                      </div>
                      <div className="shrink-0 text-xs text-muted-foreground">
                        {moment(item.timestamp).isValid() ? moment(item.timestamp).format('DD MMM YYYY, hh:mm A') : '-'}
                      </div>
                    </div>
                    {item.meta?.agentName || item.meta?.callType || item.meta?.scheduledAt ? (
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        {item.meta?.agentName ? <Badge variant="outline">{item.meta.agentName}</Badge> : null}
                        {item.meta?.callType ? <Badge variant="secondary">{item.meta.callType}</Badge> : null}
                        {item.meta?.scheduledAt ? (
                          <Badge variant="outline">
                            Callback{' '}
                            {moment(item.meta.scheduledAt).isValid()
                              ? moment(item.meta.scheduledAt).format('DD MMM, hh:mm A')
                              : '-'}
                          </Badge>
                        ) : null}
                      </div>
                    ) : null}
                    {item.raw ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-auto px-0 text-xs text-primary"
                        onClick={() => handleHistoryCardClick(item.raw)}
                      >
                        View details
                      </Button>
                    ) : null}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  const renderConversationDialog = () => (
    <Dialog
      open={!!selectedHistoryItem}
      onOpenChange={(open) => {
        if (!open) {
          setSelectedHistoryItem(null);
          setConversationDetails([]);
        }
      }}
    >
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Info size={18} />
            Conversation Details
          </DialogTitle>
        </DialogHeader>
        {loadingConversation ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            <span className="ml-2 text-sm text-muted-foreground">Loading conversations...</span>
          </div>
        ) : conversationDetails.length > 0 ? (
          <div className="space-y-4">
            {conversationDetails.map((conv, idx) => {
              const skipKeys = new Set([
                '_id',
                'id',
                '__v',
                'formId',
                'formID',
                'userId',
                'adminuser',
                'isDeleted',
                'isFresh',
              ]);

              const formatLabel = (key) =>
                key
                  .replace(/([A-Z])/g, ' $1')
                  .replace(/_/g, ' ')
                  .replace(/^./, (s) => s.toUpperCase())
                  .trim();

              const formatValue = (key, value) => {
                if (value === null || value === undefined || value === '') return null;
                const normalizedKey = key.toLowerCase();
                if (normalizedKey === 'createdat' || normalizedKey.includes('date') || normalizedKey.includes('time')) {
                  const parsedMoment = moment(value);
                  if (parsedMoment.isValid()) return parsedMoment.format('DD MMM YYYY, hh:mm:ss A');
                }
                if (typeof value === 'object') return JSON.stringify(value);
                return String(value);
              };

              const entries = Object.entries(conv)
                .filter(([key, value]) => {
                  if (skipKeys.has(key) || key.startsWith('_')) return false;
                  if (value === null || value === undefined || value === '') return false;
                  return typeof value !== 'object';
                })
                .map(([key, value]) => ({
                  key,
                  label: formatLabel(key),
                  value: formatValue(key, value),
                }))
                .filter((entry) => entry.value !== null);

              return (
                <div key={conv._id || conv.id || idx}>
                  {conversationDetails.length > 1 && (
                    <div className="text-xs font-semibold text-muted-foreground mb-2 bg-muted/50 px-2 py-1 rounded">
                      Conversation {idx + 1}
                    </div>
                  )}
                  <div className="space-y-0">
                    {entries.map((entry) => (
                      <div
                        key={entry.key}
                        className="flex items-start justify-between py-2 border-b border-border/30 last:border-0"
                      >
                        <span className="text-sm text-muted-foreground min-w-[120px] shrink-0">{entry.label}</span>
                        <span className="text-sm font-medium text-right break-all max-w-[60%]">{entry.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">No conversation data found for this contact.</p>
        )}
      </DialogContent>
    </Dialog>
  );

  // Disposition modal view
  if (!formSubmitted && dispositionModal) {
    return (
      <>
        <AlertDialog open={true}>
          <AlertDialogContent className="!max-w-7xl w-full max-h-[85vh] overflow-hidden p-0 rounded-xl">
            <AlertDialogHeader className="sr-only">
              <AlertDialogTitle>Active call workspace</AlertDialogTitle>
              <AlertDialogDescription>
                Review the current caller information, contact details, history, and any required post-call updates.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <Card
              className="flex h-full min-h-0 w-full flex-col border-0 shadow-none !gap-0"
              style={{ maxHeight: '85vh' }}
            >
              {!activeUserCall ? (
                <CardContent className="flex flex-1 items-center justify-center">
                  <div className="text-center py-8">
                    <Phone size={48} className="mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No call data available for disposition.</p>
                  </div>
                </CardContent>
              ) : (
                <Tabs
                  value={activeTab}
                  onValueChange={setActiveTab}
                  className="flex h-full min-h-0 w-full flex-col gap-0 overflow-hidden"
                >
                  <CardHeader className="flex shrink-0 flex-wrap items-center justify-between gap-3 pb-3">
                    <div className="flex min-w-0 flex-wrap items-center gap-3">
                      <span className="text-lg font-semibold">Active Call</span>
                      {(resolvedCallContext.didNumber || resolvedCallContext.isAfterHours || isStickyContact) && (
                        <div className="flex flex-wrap items-center gap-2">
                          {resolvedCallContext.didNumber ? (
                            <Badge variant="outline">
                              DID: {String(resolvedCallContext.didNumber).replace(/^\+91/, '')}
                            </Badge>
                          ) : null}
                          {resolvedCallContext.isAfterHours ? (
                            <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">After Hours</Badge>
                          ) : null}
                          {isStickyContact ? (
                            <Badge className="bg-primary/10 text-primary hover:bg-primary/10">Sticky</Badge>
                          ) : null}
                        </div>
                      )}
                    </div>
                    <TabsList className="grid min-w-0 flex-1 grid-cols-3 gap-2 rounded-xl bg-muted/40 p-1 lg:max-w-[760px]">
                      <TabsTrigger
                        value="callerInfo"
                        className="flex items-center gap-2 text-xs sm:text-sm px-2 sm:px-4"
                      >
                        <PhoneCall size={16} /> <span>Caller Information</span>
                      </TabsTrigger>
                      <TabsTrigger
                        value="contactDetails"
                        className="flex items-center gap-2 text-xs sm:text-sm px-2 sm:px-4"
                      >
                        <User size={16} /> <span>Contact Details</span>
                      </TabsTrigger>
                      <TabsTrigger value="history" className="flex items-center gap-2 text-xs sm:text-sm px-2 sm:px-4">
                        <History size={16} /> <span>History</span>
                        <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-primary/10 px-1.5 py-0.5 text-[11px] font-semibold text-primary">
                          {filteredWorkspaceCalls.length}
                        </span>
                      </TabsTrigger>
                    </TabsList>
                  </CardHeader>
                  <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden pt-0">
                    <TabsContent value="callerInfo" className="mt-0 h-full min-h-0 flex-1 overflow-hidden">
                      {renderContactTab()}
                    </TabsContent>
                    <TabsContent value="contactDetails" className="mt-0 h-full min-h-0 flex-1 overflow-hidden">
                      {renderContactDetailsTab()}
                    </TabsContent>
                    <TabsContent value="history" className="mt-0 h-full min-h-0 flex-1 overflow-hidden">
                      {renderCallHistoryTab()}
                    </TabsContent>
                  </CardContent>
                </Tabs>
              )}
            </Card>
          </AlertDialogContent>
        </AlertDialog>
        {renderConversationDialog()}
      </>
    );
  }

  // Normal panel view
  return (
    <>
      <Card className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden !gap-0">
        {!activeUserCall ? (
          <>
            <CardHeader className="flex shrink-0 flex-wrap items-center justify-between gap-3 pb-2">
              <div className="flex min-w-0 flex-wrap items-center gap-3">
                <span className="text-lg font-semibold">{isManualEntryActive ? 'Manual Entry' : 'Active Call'}</span>
              </div>
              <div className="flex items-center gap-2">
                {isManualEntryActive && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (draftStorageKey) {
                        localStorage.removeItem(draftStorageKey);
                        localStorage.removeItem(`formNavigationState:${draftStorageKey}`);
                      }
                      setManualEntryMode(false);
                      setLocalFormData({});
                      setSelectedHistoryItem(null);
                      setConversationDetails([]);
                    }}
                  >
                    Cancel
                  </Button>
                )}
                {!activeUserCall && allowManualEntry && (
                  <Button
                    type="button"
                    onClick={() => {
                      setManualEntryMode(true);
                      setActiveTab('callerInfo');
                      setFormSubmitted(false);
                    }}
                  >
                    Manual Entry
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 overflow-hidden pt-0">
              <div className="rounded-2xl border border-dashed border-border/60 px-4 py-8 sm:px-6 sm:py-16 text-center">
                <Phone
                  size={48}
                  className="mx-auto text-muted-foreground mb-4 opacity-50 transition-opacity group-hover:opacity-100"
                />
                <p className="text-muted-foreground text-sm sm:text-base max-w-md mx-auto">
                  {allowManualEntry
                    ? 'No active call to display details. You can still create a manual form entry.'
                    : 'No active call to display details.'}
                </p>
              </div>
            </CardContent>
          </>
        ) : (
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex h-full min-h-0 w-full flex-col gap-0 overflow-hidden"
          >
            <CardHeader className="flex shrink-0 flex-wrap items-center justify-between gap-3 pb-3">
              <div className="flex min-w-0 flex-wrap items-center gap-3">
                <span className="text-lg font-semibold">{isManualEntryActive ? 'Manual Entry' : 'Active Call'}</span>
                {!isManualEntryActive &&
                (resolvedCallContext.didNumber || resolvedCallContext.isAfterHours || isStickyContact) ? (
                  <div className="flex flex-wrap items-center gap-2">
                    {resolvedCallContext.didNumber ? (
                      <Badge variant="outline">DID: {String(resolvedCallContext.didNumber).replace(/^\+91/, '')}</Badge>
                    ) : null}
                    {resolvedCallContext.isAfterHours ? (
                      <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">After Hours</Badge>
                    ) : null}
                    {isStickyContact ? (
                      <Badge className="bg-primary/10 text-primary hover:bg-primary/10">Sticky</Badge>
                    ) : null}
                  </div>
                ) : null}
              </div>
              <TabsList className="grid min-w-0 flex-1 grid-cols-3 gap-2 rounded-xl bg-muted/40 p-1 lg:max-w-[760px]">
                <TabsTrigger value="callerInfo" className="flex items-center gap-2 text-xs sm:text-sm px-2 sm:px-4">
                  <PhoneCall size={16} /> <span>Caller Information</span>
                </TabsTrigger>
                <TabsTrigger value="contactDetails" className="flex items-center gap-2 text-xs sm:text-sm px-2 sm:px-4">
                  <User size={16} /> <span>Contact Details</span>
                </TabsTrigger>
                <TabsTrigger value="history" className="flex items-center gap-2 text-xs sm:text-sm px-2 sm:px-4">
                  <History size={16} /> <span>History</span>
                  <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-primary/10 px-1.5 py-0.5 text-[11px] font-semibold text-primary">
                    {filteredWorkspaceCalls.length}
                  </span>
                </TabsTrigger>
              </TabsList>
            </CardHeader>
            <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden pt-0">
              <TabsContent value="callerInfo" className="mt-0 h-full min-h-0 flex-1 overflow-hidden">
                {renderContactTab()}
              </TabsContent>
              <TabsContent value="contactDetails" className="mt-0 h-full min-h-0 flex-1 overflow-hidden">
                {renderContactDetailsTab()}
              </TabsContent>
              <TabsContent value="history" className="mt-0 h-full min-h-0 flex-1 overflow-hidden">
                {renderCallHistoryTab()}
              </TabsContent>
            </CardContent>
          </Tabs>
        )}
      </Card>
      {renderConversationDialog()}
    </>
  );
}
