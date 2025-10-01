import React, { useState, useEffect, useMemo, useCallback } from 'react';
import moment from 'moment';
import axios from 'axios';
import toast from 'react-hot-toast';
import { User, Info, Phone, History, UserCog, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Button } from './ui/button';
import { AlertDialog, AlertDialogContent } from './ui/alert-dialog';
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
}) {
  const [activeTab, setActiveTab] = useState('contact');
  const [localFormData, setLocalFormData] = useState({});
  const [lastUserCall, setLastUserCall] = useState(null);

  // Internal state management
  const [startDate, setStartDate] = useState(moment().subtract(7, 'days').startOf('day').toDate());
  const [endDate, setEndDate] = useState(moment().endOf('day').toDate());
  const [apiCallData, setApiCallData] = useState([]);
  const [leadsData, setLeadsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formConfig, setFormConfig] = useState(null);
  const [formId, setFormId] = useState(null);

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

          const refreshRes = await axios.post('${window.location.origin}/api/applogin', {
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
          throw refreshErr;
        }
      } else {
        throw err;
      }
    }
  };

  useEffect(() => {
    if (!userCampaign) return;

    async function fetchFormList() {
      try {
        setLoading(true);

        const tokenData = localStorage.getItem('token');
        let token = null;
        let refreshToken = localStorage.getItem('refreshToken'); // Direct access, no JSON.parse needed

        if (tokenData) {
          const parsedData = JSON.parse(tokenData);
          token = parsedData.token;
          refreshToken = parsedData.refreshToken || refreshToken;
        }

        const res = await fetchWithTokenRetry(
          `${window.location.origin}/getDynamicFormDataAgent/${userCampaign}`,
          token,
          refreshToken
        );

        const forms = res.data.agentWebForm || [];
        let targetType = callType === 'outgoing' ? 'outgoing' : 'incoming';
        let matchingForm = forms.find((form) => form.formType?.toLowerCase() === targetType);

        if (matchingForm) {
          setFormId(matchingForm.formId);
        }
      } catch (err) {
        console.error('❌ Error fetching form list:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchFormList();
  }, [userCampaign, callType]);

  useEffect(() => {
    if (!formId || status === 'start') return;

    async function fetchFormDetails() {
      try {
        setLoading(true);

        const tokenData = localStorage.getItem('token');
        let token = null;
        let refreshToken = localStorage.getItem('refreshToken'); // Direct access, no JSON.parse needed

        if (tokenData) {
          const parsedData = JSON.parse(tokenData);
          token = parsedData.token;
          refreshToken = parsedData.refreshToken || refreshToken;
        }

        const res = await fetchWithTokenRetry(
          `${window.location.origin}/getDynamicFormData/${formId}`,
          token,
          refreshToken
        );

        setFormConfig(res.data.result);
      } catch (err) {
        console.error('Error fetching form details:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchFormDetails();
  }, [formId, status]);

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
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const leads = response.data.data || [];
      setLeadsData(leads);
    } catch (error) {
      console.error('Error fetching leads:', error.response?.data || error.message);
      setLeadsData([]);
    } finally {
      setLoading(false);
    }
  }, [userCampaign, username, token, startDate, endDate]);

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
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const calls = response.data.result || [];
      setApiCallData(calls);
    } catch (error) {
      console.error('Error fetching API data for Call Info tab:', error);
      setApiCallData([]);
    } finally {
      setLoading(false);
    }
  }, [username, token, startDate, endDate]);

  // Fetch data when dependencies change
  useEffect(() => {
    fetchLeadsWithDateRange();
    fetchCallDataByAgent();
  }, [fetchLeadsWithDateRange, fetchCallDataByAgent]);

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

  // Get mapped leads
  const mappedLeads = useMemo(() => mapLeadData(leadsData), [leadsData, mapLeadData]);

  // Initialize form data when userCall changes
  useEffect(() => {
    if (userCall && (!lastUserCall || lastUserCall.contactNumber !== userCall.contactNumber)) {
      const initialFormData = {};

      if (formConfig && formConfig.sections && formConfig.sections.length > 0) {
        // Dynamic form initialization
        formConfig.sections.forEach((section) => {
          section.fields.forEach((field) => {
            const fieldName = field.name;
            const lowerFieldName = fieldName.toLowerCase();
            const userCallKeys = Object.keys(userCall);
            const matchedKey = userCallKeys.find((key) => key.toLowerCase() === lowerFieldName);
            initialFormData[fieldName] = matchedKey !== undefined ? userCall[matchedKey] ?? '' : '';
          });
        });
      } else {
        // Static form initialization
        Object.assign(initialFormData, {
          firstName: userCall.firstName || '',
          lastName: userCall.lastName || '',
          number: userCall.contactNumber || '',
          alternateNumber: userCall.alternateNumber || '',
          address: userCall.Contactaddress || '', // Note: Capital 'C' in Contact
          state: userCall.ContactState || '', // Note: Capital 'C' and 'S'
          district: userCall.ContactDistrict || '', // Note: Capital 'C' and 'D'
          city: userCall.ContactCity || '', // Note: Capital 'C'
          postalCode: userCall.ContactPincode || '', // Note: Capital 'C' and 'P'
          email: userCall.emailId || '',
          comment: userCall.comment || '',
        });
      }

      setLocalFormData(initialFormData);
      setLastUserCall(userCall);
    }
  }, [userCall, formConfig]);

  // Clear form data when submission is successful
  useEffect(() => {
    if (formSubmitted) {
      setLocalFormData({});
    }
  }, [formSubmitted]);

  // Update local form data handler
  const updateLocalFormData = useCallback((newData) => {
    setLocalFormData((prev) => {
      return typeof newData === 'function' ? newData(prev) : { ...prev, ...newData };
    });
  }, []);

  // Handle form submission
  const handleContact = async (event, formDataToSubmit) => {
    event.preventDefault();
    const payload = {
      user: username,
      isFresh: userCall?.isFresh,
      data: {
        firstName: formDataToSubmit.firstName || '',
        lastName: formDataToSubmit.lastName || '',
        emailId: formDataToSubmit.email || '',
        contactNumber: formDataToSubmit.number || userCall?.contactNumber || '',
        alternateNumber: formDataToSubmit.alternateNumber || '',
        comment: formDataToSubmit.comment || '',
        Contactaddress: formDataToSubmit.address || '',
        ContactDistrict: formDataToSubmit.district || '',
        ContactCity: formDataToSubmit.city || '',
        ContactState: formDataToSubmit.state || '',
        ContactPincode: formDataToSubmit.postalCode || '',
        agentName: username,
      },
    };

    try {
      const response = await axios.post(`${window.location.origin}/addModifyContact`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
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

    // Create the new object to be passed as 'formObject'
    const formObject = {};
    for (const key in formDataToSubmit) {
      if (formDataToSubmit.hasOwnProperty(key)) {
        if (
          key !== 'firstName' &&
          key !== 'lastName' &&
          key !== 'email' &&
          key !== 'number' &&
          key !== 'alternateNumber' &&
          key !== 'comment' &&
          key !== 'address' &&
          key !== 'district' &&
          key !== 'city' &&
          key !== 'state' &&
          key !== 'postalCode'
        ) {
          formObject[key] = formDataToSubmit[key];
        }
      }
    }

    // Add agentName to the formObject
    formObject.agentName = username;

    const payload = {
      user: username,
      isFresh: userCall?.isFresh,
      formObject: formObject,
      data: {
        ...formDataToSubmit,
        contactNumber: userCall?.contactNumber || '',
        formId: formConfig.formId,
        agentName: username,
      },
    };

    try {
      const response = await axios.post(`${window.location.origin}/addModifyContact`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
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
    if (!mappedLeads || !startDate || !endDate || !userCall) return [];

    const normalizedContactNumber = String(userCall.contactNumber || '').replace(/^\+91/, '');
    const startOfDay = moment(startDate).startOf('day');
    const endOfDay = moment(endDate).endOf('day');

    return mappedLeads.filter((lead) => {
      const leadUploadTime = moment(lead.uploadDate);
      const normalizedLeadPhone = String(lead.phone || '').replace(/^\+91/, '');

      return (
        normalizedLeadPhone === normalizedContactNumber && leadUploadTime.isBetween(startOfDay, endOfDay, null, '[]')
      );
    });
  }, [mappedLeads, startDate, endDate, userCall]);

  // Get current lead (most recent)
  const currentLead = useMemo(() => {
    if (!filteredMappedLeadsForPanel || filteredMappedLeadsForPanel.length === 0) return null;

    const sortedLeads = [...filteredMappedLeadsForPanel].sort(
      (a, b) => moment(b.uploadDate).valueOf() - moment(a.uploadDate).valueOf()
    );
    return sortedLeads[0];
  }, [filteredMappedLeadsForPanel]);

  // Filter API call data for the current contact
  const filteredApiCallDataForPanel = useMemo(() => {
    if (!apiCallData || !startDate || !endDate || !userCall) return [];

    const normalizedContactNumber = String(userCall.contactNumber || '').replace(/^\+91/, '');
    const startOfDay = moment(startDate).startOf('day');
    const endOfDay = moment(endDate).endOf('day');

    return apiCallData.filter((call) => {
      const callTime = moment(call.startTime);
      const normalizedCallNumber = String(call.Caller || call.dialNumber || '').replace(/^\+91/, '');

      return normalizedCallNumber === normalizedContactNumber && callTime.isBetween(startOfDay, endOfDay, null, '[]');
    });
  }, [apiCallData, startDate, endDate, userCall]);

  // Get current API call record (most recent)
  const currentApiCallRecord = useMemo(() => {
    if (!filteredApiCallDataForPanel || filteredApiCallDataForPanel.length === 0) return null;

    const sortedCalls = [...filteredApiCallDataForPanel].sort(
      (a, b) => moment(b.startTime).valueOf() - moment(a.startTime).valueOf()
    );
    return sortedCalls[0];
  }, [filteredApiCallDataForPanel]);

  // Render contact form tab
  const renderContactTab = () => {
    if (!userCall) return null;

    if (formConfig && formConfig.sections && formConfig.sections.length > 0) {
      return (
        <DynamicForm
          key={formConfig.formId}
          formConfig={formConfig}
          formState={localFormData}
          setFormState={updateLocalFormData}
          userCall={userCall}
          userCallDialog={true}
          formSubmitted={formSubmitted}
          handleSubmit={handleSubmit}
          localFormData={localFormData}
          status={status}
          setLocalFormData={updateLocalFormData}
        />
      );
    } else {
      return (
        <UserCall
          formData={localFormData}
          handleSubmit={handleContact}
          setFormData={updateLocalFormData}
          userCall={userCall}
          userCallDialog={true}
          formSubmitted={formSubmitted}
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
        { label: 'Country', value: currentLead.country || '-', key: 'country' }
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

  // Render history tab
  const renderHistoryTab = () => {
    const normalizedContactNumber = String(userCall?.contactNumber || '').replace(/^\+91/, '');
    const historyItems = [];

    // Collect lead history
    const filteredLeadHistoryItems = mappedLeads.filter(
      (lead) => String(lead.phone || '').replace(/^\+91/, '') === normalizedContactNumber
    );

    if (filteredLeadHistoryItems && filteredLeadHistoryItems.length > 0) {
      filteredLeadHistoryItems.forEach((lead) => {
        if (lead.history && lead.history.length > 0) {
          lead.history.forEach((item) => {
            const itemDate = moment(item.uploadDate);
            if (itemDate.isBetween(moment(startDate).startOf('day'), moment(endDate).endOf('day'), null, '[]')) {
              historyItems.push({ ...item, _isLeadHistory: true });
            }
          });
        }
      });

      const mainLeadDate = moment(currentLead?.uploadDate);
      if (
        currentLead &&
        mainLeadDate.isBetween(moment(startDate).startOf('day'), moment(endDate).endOf('day'), null, '[]')
      ) {
        if (!historyItems.some((h) => h.uploadDate === currentLead.uploadDate && h.phone === currentLead.phone)) {
          historyItems.push({ ...currentLead, _isLeadHistory: true });
        }
      }
    }

    // Collect API call history
    if (apiCallData && apiCallData.length > 0) {
      apiCallData.forEach((call) => {
        const mainCallDate = moment(call.startTime);
        if (mainCallDate.isBetween(moment(startDate).startOf('day'), moment(endDate).endOf('day'), null, '[]')) {
          if (
            !historyItems.some(
              (h) => h.startTime === call.startTime && (h.Caller === call.Caller || h.dialNumber === call.dialNumber)
            )
          ) {
            historyItems.push({ ...call, _isApiHistory: true });
          }
        }

        if (call.history && call.history.length > 0) {
          call.history.forEach((item) => {
            const itemDate = moment(item.startTime);
            if (itemDate.isBetween(moment(startDate).startOf('day'), moment(endDate).endOf('day'), null, '[]')) {
              historyItems.push({ ...item, _isApiHistory: true });
            }
          });
        }
      });
    }

    // Remove duplicates and sort
    const uniqueHistory = [];
    const seen = new Set();
    historyItems.forEach((item) => {
      const key = item._isLeadHistory
        ? `lead-${item.phone}-${item.uploadDate}`
        : `api-${item.Caller || item.dialNumber}-${item.startTime}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueHistory.push(item);
      }
    });

    uniqueHistory.sort((a, b) => {
      const timeA = a.uploadDate || a.startTime;
      const timeB = b.uploadDate || b.startTime;
      return moment(timeB).valueOf() - moment(timeA).valueOf();
    });

    if (uniqueHistory.length === 0) {
      return (
        <div className="text-center py-8">
          <History size={48} className="mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No call history available for this entry in the selected date range.</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <History size={16} className="text-muted-foreground" />
          <span className="text-sm font-medium">Call History ({uniqueHistory.length})</span>
        </div>

        <div className="space-y-3 max-h-[32rem] overflow-y-auto">
          {uniqueHistory.map((historyItem, index) => (
            <Card key={index} className="border-l-4 border-l-primary/30">
              <CardContent className="p-4">
                <div className="space-y-3">
                  {historyItem._isLeadHistory ? (
                    <>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <User size={16} className="text-muted-foreground" />
                          <span className="font-medium">{historyItem.name || '-'}</span>
                        </div>
                        <Badge
                          variant={historyItem.status === 'Complete' ? 'default' : 'secondary'}
                          className={
                            historyItem.status === 'Complete'
                              ? 'bg-green-100 text-green-800 hover:bg-green-200'
                              : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                          }
                        >
                          {historyItem.status}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2">
                        <Clock size={16} className="text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {historyItem.uploadDate ? moment(historyItem.uploadDate).format('DD MMM YYYY, hh:mm A') : '-'}
                        </span>
                      </div>

                      {historyItem.phone && (
                        <div className="flex items-center gap-2">
                          <Phone size={16} className="text-muted-foreground" />
                          <span className="text-sm font-mono">{historyItem.phone}</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <User size={16} className="text-muted-foreground" />
                          <span className="font-medium">{historyItem.agent || '-'}</span>
                        </div>
                        <Badge
                          variant={historyItem.Type?.toLowerCase() === 'incoming' ? 'default' : 'secondary'}
                          className={
                            historyItem.Type?.toLowerCase() === 'incoming'
                              ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                              : 'bg-purple-100 text-purple-800 hover:bg-purple-200'
                          }
                        >
                          {(historyItem.Type === 'incoming' && 'Incoming') || 'Outgoing'}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2">
                        <Clock size={16} className="text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {historyItem.startTime
                            ? moment(historyItem.startTime).format('DD MMM YYYY, hh:mm:ss A')
                            : '-'}
                        </span>
                      </div>

                      {(historyItem.Caller || historyItem.dialNumber) && (
                        <div className="flex items-center gap-2">
                          <Phone size={16} className="text-muted-foreground" />
                          <span className="text-sm font-mono">
                            {String(historyItem.Caller || historyItem.dialNumber).replace(/^\+91/, '')}
                          </span>
                        </div>
                      )}

                      {historyItem.Disposition && (
                        <div className="flex items-center gap-2">
                          <Info size={16} className="text-muted-foreground" />
                          <span className="text-sm">{historyItem.Disposition}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  // Disposition modal view
  if (!formSubmitted && dispositionModal) {
    return (
      <AlertDialog open={true}>
        <AlertDialogContent className="p-0 m-0 !max-w-6xl overflow-auto">
          <Card className="w-full h-full border-0 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <span className="text-lg font-semibold">Active Call Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!userCall && !lastUserCall ? (
                <div className="text-center py-8">
                  <Phone size={48} className="mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No call data available for disposition.</p>
                </div>
              ) : (
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
                    <TabsList className="grid w-full grid-cols-2 sm:w-auto sm:grid-cols-4 flex-grow">
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
                    <div className="w-full sm:w-auto flex justify-end">
                      <DateRangePicker
                        key={`panel-date-picker-${moment(startDate).format('YYYY-MM-DD')}-${moment(endDate).format(
                          'YYYY-MM-DD'
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
    );
  }

  // Normal panel view
  return (
    <Card className="w-full h-max">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span className="text-lg font-semibold">Active Call Information</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!userCall ? (
          <div className="text-center py-8">
            <Phone size={48} className="mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No active call to display details.</p>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
              <TabsList className="grid w-full grid-cols-2 sm:w-auto sm:grid-cols-4 flex-grow">
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
              <div className="w-full sm:w-auto flex justify-end">
                <DateRangePicker
                  key={`panel-date-picker-${moment(startDate).format('YYYY-MM-DD')}-${moment(endDate).format(
                    'YYYY-MM-DD'
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
  );
}
