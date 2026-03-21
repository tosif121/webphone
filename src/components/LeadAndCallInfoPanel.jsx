import React, { useState, useEffect, useMemo, useCallback } from 'react';
import moment from 'moment';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  User,
  Info,
  Phone,
  History,
  UserCog,
  Clock,
  PhoneCall,
  PhoneIncoming,
  PhoneOutgoing,
  Timer,
  Tag,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Button } from './ui/button';
import { AlertDialog, AlertDialogContent } from './ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import DynamicForm from './DynamicForm';
import UserCall from './UserCall';
import DateRangePicker from './DateRangePicker';

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
  const [activeTab, setActiveTab] = useState('contact');
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
  const [contactConversationHistory, setContactConversationHistory] = useState([]);
  const [latestConversation, setLatestConversation] = useState(null);
  const [loadingContactConversationHistory, setLoadingContactConversationHistory] = useState(false);

  const allowManualEntry = useMemo(() => {
    if (typeof window === 'undefined') return false;
    try {
      const tokenData = localStorage.getItem('token');
      if (!tokenData) return false;
      const parsedData = JSON.parse(tokenData);
      return parsedData?.userData?.allowManualEntry === true;
    } catch (error) {
      console.warn('Failed to read manual entry permission:', error);
      return false;
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
    if (userCall) {
      setRetainedUserCall(userCall);
      setManualEntryMode(false);
    }
  }, [userCall]);

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

  const resolvedCallContext = useMemo(
    () => ({
      didNumber:
        activeCallContext?.didNumber ||
        activeUserCall?.didNumber ||
        null,
      isAfterHours:
        activeCallContext?.isAfterHours === true ||
        activeUserCall?.isAfterHours === true ||
        activeUserCall?.isAfterhrs === true ||
        false,
      businessHoursSource:
        activeCallContext?.businessHoursSource ||
        activeUserCall?.businessHoursSource ||
        null,
      isSticky:
        activeCallContext?.isSticky === true ||
        activeUserCall?.isSticky === true ||
        Boolean(activeUserCall?.stickyAgent),
      stickyAgent:
        activeCallContext?.stickyAgent ||
        activeUserCall?.stickyAgent ||
        null,
    }),
    [activeCallContext, activeUserCall],
  );

  const draftStorageKey = useMemo(() => {
    if (!activeUserCall && !manualEntryMode) return null;

    const formReference = formConfig?.formId || formId || 'contact-form';
    const draftContactKey =
      manualEntryMode && (!normalizedContactNumber || normalizedContactNumber === 'no-contact' || normalizedContactNumber.length < 10)
        ? 'pending-manual'
        : normalizedContactNumber;

    return ['leadFormDraft', username || 'agent', userCampaign || 'no-campaign', manualEntryMode ? 'manual' : callType || 'unknown', formReference, draftContactKey].join(':');
  }, [activeUserCall, callType, formConfig?.formId, formId, manualEntryMode, normalizedContactNumber, userCampaign, username]);

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

          if (!savedUsername || !savedPassword) {
            throw new Error('No saved credentials found');
          }

          const refreshRes = await axios.post(`${window.location.origin}/api/applogin`, {
            username: savedUsername,
            password: savedPassword,
          });

          const newToken = refreshRes.data.token;
          const newRefreshToken = refreshRes.data.refreshToken;

          const updatedTokenData = {
            token: newToken,
            refreshToken: newRefreshToken,
          };
          localStorage.setItem('token', JSON.stringify(updatedTokenData));

          const retryRes = await axios.get(url, {
            headers: { Authorization: `Bearer ${newToken}` },
            ...config,
          });
          return retryRes;
        } catch (refreshErr) {
          console.error('Token refresh failed:', refreshErr);
          localStorage.removeItem('token');
          localStorage.removeItem('savedUsername');
          localStorage.removeItem('savedPassword');
          localStorage.removeItem('call-history');
          localStorage.removeItem('phoneShow');
          localStorage.removeItem('formNavigationState');
          localStorage.removeItem('selectedBreak');
          Object.keys(localStorage).forEach((key) => {
            if (key.startsWith('breakStartTime_')) {
              localStorage.removeItem(key);
            }
          });
          throw refreshErr;
        }
      } else {
        throw err;
      }
    }
  };

  useEffect(() => {
    if (!userCampaign) {
      setFormId(null);
      setFormConfig(null);
      return;
    }

    async function fetchFormList() {
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
          console.warn('LeadAndCallInfoPanel - No token found, will use static form');
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
        console.error('LeadAndCallInfoPanel - Error fetching form list:', err.response?.data || err.message);
        // On error, fall back to static form
        setFormId(null);
        setFormConfig(null);
      } finally {
        setLoading(false);
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
          console.warn('LeadAndCallInfoPanel - No token for form details, will use static form');
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
          console.warn('LeadAndCallInfoPanel - Form config invalid or empty, will use static form');
          setFormConfig(null);
        }
      } catch (err) {
        console.error('LeadAndCallInfoPanel - Error fetching form details:', err.response?.data || err.message);
        // On error, fall back to static form
        setFormConfig(null);
      } finally {
        setLoading(false);
      }
    }

    fetchFormDetails();
  }, [formId]);

  useEffect(() => {
    if (!token) {
      setContactConversationHistory([]);
      setLatestConversation(null);
      return undefined;
    }

    const contactNumber = normalizedContactNumber;
    if (!contactNumber || contactNumber === 'no-contact' || contactNumber.length < 10) {
      setContactConversationHistory([]);
      setLatestConversation(null);
      return undefined;
    }

    const timeoutId = setTimeout(async () => {
      try {
        setLoadingContactConversationHistory(true);
        const response = await axios.get(`${window.location.origin}/fetchConversationsByContact`, {
          params: {
            contactNumber,
            campaignId: userCampaign || undefined,
            limit: 10,
          },
          headers: authHeaders,
        });

        const result = Array.isArray(response.data?.result) ? response.data.result : [];
        setContactConversationHistory(result);
        setLatestConversation(result[0] || null);
      } catch (error) {
        console.error('Error fetching contact conversations:', error);
        setContactConversationHistory([]);
        setLatestConversation(null);
      } finally {
        setLoadingContactConversationHistory(false);
      }
    }, 350);

    return () => clearTimeout(timeoutId);
  }, [authHeaders, normalizedContactNumber, token, userCampaign]);

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
      console.error('Error fetching leads:', error.response?.data || error.message);
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
        `${window.location.origin}/callDataByAgent`,
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
      console.error('Error fetching API data for Call Info tab:', error);
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
    const initializationSignature = `${draftStorageKey || 'none'}:${latestConversation?._id || latestConversation?.id || latestConversation?.createdAt || 'none'}`;

    if ((!activeUserCall && !manualEntryMode) || !draftStorageKey || lastDraftKey === initializationSignature) {
      return;
    }

      const initialFormData = {};
      const sourceCallData = activeUserCall || {};
      const conversationSeed = latestConversation
        ? Object.fromEntries(
            Object.entries(latestConversation).filter(([key]) => {
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
            }),
          )
        : {};

      if (formConfig?.sections?.length > 0) {
        // Dynamic form initialization
        formConfig.sections.forEach((section) => {
          section.fields.forEach((field) => {
            const fieldName = field.name;
            const normalizedName = String(fieldName || '').toLowerCase();
            const normalizedLabel = String(field.label || '').toLowerCase();

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
              field.systemField === 'alternateNumber' ||
              normalizedName === 'alternatenumber' ||
              normalizedLabel.includes('alternate')
            ) {
              initialFormData[fieldName] = sourceCallData.alternateNumber || '';
              return;
            }

            const lowerFieldName = fieldName.toLowerCase();
            const userCallKeys = Object.keys(sourceCallData);
            const matchedKey = userCallKeys.find((key) => key.toLowerCase() === lowerFieldName);
            initialFormData[fieldName] = matchedKey !== undefined ? (sourceCallData[matchedKey] ?? '') : '';
          });
        });
      } else {
        // Static form initialization
        Object.assign(initialFormData, {
          firstName: sourceCallData.firstName || '',
          lastName: sourceCallData.lastName || '',
          emailId: sourceCallData.emailId || sourceCallData.Email || sourceCallData.email || '',
          contactNumber: sourceCallData.contactNumber || '',
          alternateNumber: sourceCallData.alternateNumber || '',
          Contactaddress: sourceCallData.Contactaddress || sourceCallData.address || '',
          ContactState: sourceCallData.ContactState || sourceCallData.state || '',
          ContactDistrict: sourceCallData.ContactDistrict || '',
          ContactCity: sourceCallData.ContactCity || sourceCallData.city || sourceCallData.CIty || '',
          ContactPincode: sourceCallData.ContactPincode || sourceCallData.postalCode || sourceCallData['Pincode '] || '',
          comment: sourceCallData.comment || '',
        });
      }

      Object.assign(initialFormData, conversationSeed);

      try {
        const savedDraft = localStorage.getItem(draftStorageKey);
        if (savedDraft) {
          Object.assign(initialFormData, JSON.parse(savedDraft));
        }
      } catch (error) {
        console.warn('Failed to restore saved form draft:', error);
      }

      if (manualEntryMode && localFormData && Object.keys(localFormData).length > 0) {
        Object.assign(initialFormData, localFormData);
      }

      initialFormData.contactNumber = sourceCallData.contactNumber || initialFormData.contactNumber || '';
      setLocalFormData(initialFormData);
      setLastDraftKey(initializationSignature);
      setIsFormDataInitialized(true);
  }, [activeUserCall, draftStorageKey, formConfig, lastDraftKey, latestConversation, localFormData, manualEntryMode]);

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
      setManualEntryMode(false);
    }
  }, [draftStorageKey, formSubmitted]);

  useEffect(() => {
    if (!draftStorageKey) return;

    if (localFormData && Object.keys(localFormData).length > 0) {
      localStorage.setItem(draftStorageKey, JSON.stringify(localFormData));
    }
  }, [draftStorageKey, localFormData]);

  // Update local form data handler
  const updateLocalFormData = useCallback((newData) => {
    setLocalFormData((prev) => {
      return typeof newData === 'function' ? newData(prev) : { ...prev, ...newData };
    });
  }, []);

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
    [activeUserCall?.contactNumber, callType, currentCallReference, formConfig?.formId, formConfig?.formTitle, formConfig?.formType, manualEntryMode, userCampaign, username],
  );

  // Handle form submission
  const handleContact = async (event, formDataToSubmit) => {
    event.preventDefault();

    const conversationData = buildConversationRecord(formDataToSubmit, {
      formId: 'contact-form',
      formTitle: 'Contact Form',
    });

    const payload = {
      user: username,
      isFresh: activeUserCall?.isFresh,
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
      console.error('Add/Modify contact error:', err);
    }
  };

  const handleSubmit = async (formDataToSubmit) => {
    if (!formConfig) {
      toast.error('Form configuration not loaded');
      return;
    }

    const conversationData = buildConversationRecord(formDataToSubmit);

    const payload = {
      user: username,
      isFresh: activeUserCall?.isFresh,
      formObject: conversationData,
      data: {
        ...formDataToSubmit,
        contactNumber: conversationData.contactNumber,
        formId: conversationData.formId,
        formTitle: conversationData.formTitle,
        formType: conversationData.formType,
        campaignId: conversationData.campaignId,
        callType: conversationData.callType,
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
      console.error('Add/Modify contact error:', err);
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
    if (!filteredMappedLeadsForPanel || filteredMappedLeadsForPanel.length === 0) return null;

    const sortedLeads = [...filteredMappedLeadsForPanel].sort(
      (a, b) => moment(b.uploadDate).valueOf() - moment(a.uploadDate).valueOf(),
    );
    return sortedLeads[0];
  }, [filteredMappedLeadsForPanel]);

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
    if (!filteredApiCallDataForPanel || filteredApiCallDataForPanel.length === 0) return null;

    const sortedCalls = [...filteredApiCallDataForPanel].sort(
      (a, b) => moment(b.startTime).valueOf() - moment(a.startTime).valueOf(),
    );
    return sortedCalls[0];
  }, [filteredApiCallDataForPanel]);

  // Render contact form tab
  const renderContactTab = () => {
    if (!activeUserCall) return null;

    if (formConfig && formConfig?.sections && formConfig?.sections?.length > 0) {
      return (
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
        />
      );
    } else {
      return (
        <UserCall
          localFormData={localFormData}
          setLocalFormData={updateLocalFormData}
          handleSubmit={handleContact}
          userCall={activeUserCall}
          userCallDialog={true}
          formSubmitted={formSubmitted}
          isManualEntry={isManualEntryActive}
        />
      );
    }
  };

  // Render lead information tab
  const renderLeadTab = () => {
    if (!currentLead) {
      return (
        <div className="text-center py-8">
          <UserCog size={48} className="mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            Lead Information not found for this number in the selected date range.
          </p>
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
            {resolvedCallContext.didNumber || resolvedCallContext.isAfterHours || resolvedCallContext.isSticky ? (
              <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2">
                {resolvedCallContext.didNumber ? (
                  <Badge variant="outline">Incoming via: {String(resolvedCallContext.didNumber).replace(/^\+91/, '')}</Badge>
                ) : null}
                {resolvedCallContext.isAfterHours ? (
                  <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">After Hours</Badge>
                ) : null}
                {resolvedCallContext.isSticky ? (
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

  // Fetch conversations for a contact number from the API
  const handleHistoryCardClick = async (historyItem) => {
    setSelectedHistoryItem(historyItem);
    setConversationDetails(historyItem ? [historyItem] : []);
    setLoadingConversation(false);
  };

  // Render history tab
  const renderHistoryTab = () => {
    if (loadingContactConversationHistory) {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          <span className="ml-2 text-sm text-muted-foreground">Loading recent conversations...</span>
        </div>
      );
    }

    if (contactConversationHistory.length === 0) {
      return (
        <div className="text-center py-8">
          <History size={48} className="mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No recent tagging or conversation history found for this number.</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {latestConversation && (
          <Card className="border-l-4 border-l-primary">
            <CardContent className="p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Tag size={16} className="text-primary" />
                    <span className="font-medium">Last Tagging</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {latestConversation.formTitle || 'Contact Form'} by {latestConversation.agentName || 'Unknown agent'}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">
                    {latestConversation.entryMode === 'manual' ? 'Manual Entry' : 'Call Entry'}
                  </Badge>
                  <Badge variant="outline">
                    {moment(latestConversation.createdAt).isValid()
                      ? moment(latestConversation.createdAt).format('DD MMM YYYY, hh:mm A')
                      : 'Recent'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex items-center gap-2 mb-2">
          <History size={16} className="text-muted-foreground" />
          <span className="text-sm font-medium">Recent Conversations ({contactConversationHistory.length})</span>
        </div>

        <div className="space-y-3 max-h-[32rem] overflow-y-auto pr-1">
          {contactConversationHistory.map((conversation, index) => (
            <Card
              key={conversation._id || conversation.id || index}
              className="border-l-4 border-l-primary/30 cursor-pointer hover:shadow-md hover:border-l-primary/60 transition-all duration-200"
              onClick={() => handleHistoryCardClick(conversation)}
            >
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <User size={16} className="text-muted-foreground" />
                      <span className="font-medium">{conversation.agentName || 'Unknown agent'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={conversation.entryMode === 'manual' ? 'border-amber-300 text-amber-700' : 'border-sky-300 text-sky-700'}
                      >
                        {conversation.entryMode === 'manual' ? 'Manual' : 'Call'}
                      </Badge>
                      {conversation.callType && <Badge variant="secondary">{conversation.callType}</Badge>}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock size={16} />
                      <span>{moment(conversation.createdAt).isValid() ? moment(conversation.createdAt).format('DD MMM YYYY, hh:mm A') : '-'}</span>
                    </div>
                    <span className="font-medium text-primary">{conversation.formTitle || 'Contact Form'}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone size={16} />
                    <span className="font-mono">{String(conversation.contactNumber || '').replace(/^\+91/, '') || '-'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
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
          <AlertDialogContent className="p-0 m-0 !max-w-6xl overflow-auto">
            <Card className="w-full h-full border-0 shadow-none !gap-2">
              <CardHeader>
                <CardTitle className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-lg font-semibold">Active Call Information</span>
                  {(resolvedCallContext.didNumber || resolvedCallContext.isAfterHours || resolvedCallContext.isSticky) && (
                    <div className="flex flex-wrap items-center gap-2">
                      {resolvedCallContext.didNumber ? (
                        <Badge variant="outline">DID: {String(resolvedCallContext.didNumber).replace(/^\+91/, '')}</Badge>
                      ) : null}
                      {resolvedCallContext.isAfterHours ? (
                        <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">After Hours</Badge>
                      ) : null}
                      {resolvedCallContext.isSticky ? (
                        <Badge className="bg-primary/10 text-primary hover:bg-primary/10">Sticky</Badge>
                      ) : null}
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!activeUserCall ? (
                  <div className="text-center py-8">
                    <Phone size={48} className="mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No call data available for disposition.</p>
                  </div>
                ) : (
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
                      <TabsList className="grid w-full sm:w-auto grid-cols-4 flex-grow">
                        <TabsTrigger value="contact" className="flex items-center gap-2 text-xs sm:text-sm px-2 sm:px-4">
                          <UserCog size={16} /> <span className="hidden sm:inline">Contact</span>
                        </TabsTrigger>
                        <TabsTrigger value="callInfo" className="flex items-center gap-2 text-xs sm:text-sm px-2 sm:px-4">
                          <Clock size={16} /> <span className="hidden sm:inline">Call Info</span>
                        </TabsTrigger>
                        <TabsTrigger value="lead" className="flex items-center gap-2 text-xs sm:text-sm px-2 sm:px-4">
                          <User size={16} /> <span className="hidden sm:inline">Lead Info</span>
                        </TabsTrigger>
                        <TabsTrigger value="history" className="flex items-center gap-2 text-xs sm:text-sm px-2 sm:px-4">
                          <History size={16} /> <span className="hidden sm:inline">History</span>
                        </TabsTrigger>
                      </TabsList>
                      <div className="w-auto flex justify-end">
                        <DateRangePicker
                          key={`panel-date-picker-${moment(startDate).format('YYYY-MM-DD')}-${moment(endDate).format(
                            'YYYY-MM-DD',
                          )}`}
                          onDateChange={([start, end]) => {
                            setStartDate(start);
                            setEndDate(end);
                          }}
                          initialStartDate={startDate}
                          initialEndDate={endDate}
                        />
                      </div>
                    </div>

                    <TabsContent value="contact" className="mt-4">
                      {renderContactTab()}
                    </TabsContent>
                    <TabsContent value="lead" className="mt-4">
                      {renderLeadTab()}
                    </TabsContent>
                    <TabsContent value="callInfo" className="mt-4">
                      {renderCallInfoTab()}
                    </TabsContent>
                    <TabsContent value="history" className="mt-4">
                      {renderHistoryTab()}
                    </TabsContent>
                  </Tabs>
                )}
              </CardContent>
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
      <Card className="w-full h-max !gap-2">
        <CardHeader>
          <CardTitle className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <span className="text-lg font-semibold">{isManualEntryActive ? 'Manual Entry Information' : 'Active Call Information'}</span>
            <div className="flex items-center gap-2">
              {!isManualEntryActive && (resolvedCallContext.didNumber || resolvedCallContext.isAfterHours || resolvedCallContext.isSticky) ? (
                <>
                  {resolvedCallContext.didNumber ? (
                    <Badge variant="outline">DID: {String(resolvedCallContext.didNumber).replace(/^\+91/, '')}</Badge>
                  ) : null}
                  {resolvedCallContext.isAfterHours ? (
                    <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">After Hours</Badge>
                  ) : null}
                  {resolvedCallContext.isSticky ? (
                    <Badge className="bg-primary/10 text-primary hover:bg-primary/10">Sticky</Badge>
                  ) : null}
                </>
              ) : null}
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
                    setActiveTab('contact');
                    setFormSubmitted(false);
                  }}
                >
                  Manual Entry
                </Button>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!activeUserCall ? (
            <div className="text-center py-8">
              <Phone size={48} className="mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {allowManualEntry
                  ? 'No active call to display details. You can still create a manual form entry.'
                  : 'No active call to display details.'}
              </p>
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
                <TabsList className="grid w-full sm:w-auto grid-cols-4 flex-grow">
                  <TabsTrigger value="contact" className="flex items-center gap-2 text-xs sm:text-sm px-2 sm:px-4">
                    <UserCog size={16} /> <span className="hidden sm:inline">Contact</span>
                  </TabsTrigger>
                  <TabsTrigger value="callInfo" className="flex items-center gap-2 text-xs sm:text-sm px-2 sm:px-4">
                    <Clock size={16} /> <span className="hidden sm:inline">Call Info</span>
                  </TabsTrigger>
                  <TabsTrigger value="lead" className="flex items-center gap-2 text-xs sm:text-sm px-2 sm:px-4">
                    <User size={16} /> <span className="hidden sm:inline">Lead Info</span>
                  </TabsTrigger>
                  <TabsTrigger value="history" className="flex items-center gap-2 text-xs sm:text-sm px-2 sm:px-4">
                    <History size={16} /> <span className="hidden sm:inline">History</span>
                  </TabsTrigger>
                </TabsList>
                <div className="sm:w-auto flex justify-end">
                  <DateRangePicker
                    key={`panel-date-picker-${moment(startDate).format('YYYY-MM-DD')}-${moment(endDate).format(
                      'YYYY-MM-DD',
                    )}`}
                    onDateChange={([start, end]) => {
                      setStartDate(start);
                      setEndDate(end);
                    }}
                    initialStartDate={startDate}
                    initialEndDate={endDate}
                  />
                </div>
              </div>

              <TabsContent value="contact" className="mt-4">
                {renderContactTab()}
              </TabsContent>
              <TabsContent value="lead" className="mt-4">
                {renderLeadTab()}
              </TabsContent>
              <TabsContent value="callInfo" className="mt-4">
                {renderCallInfoTab()}
              </TabsContent>
              <TabsContent value="history" className="mt-4">
                {renderHistoryTab()}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
      {renderConversationDialog()}
    </>
  );
}
