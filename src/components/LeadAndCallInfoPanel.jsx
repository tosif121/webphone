// LeadAndCallInfoPanel.jsx
import React, { useState, useEffect, useMemo } from 'react';
import moment from 'moment';
import { User, Info, Phone, History, UserCog, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Button } from './ui/button';
import DynamicForm from './DynamicForm';
import UserCall from './UserCall';
import DateRangePicker from './DateRangePicker';

export default function LeadAndCallInfoPanel({
  userCall,
  formConfig,
  handleCall,
  apiCallData,
  mappedLeads,
  setFormData,
  formData,
  handleSubmit,
  handleContact,
  filterStartDate,
  setFilterStartDate,
  filterEndDate,
  setFilterEndDate,
}) {
  const [activeTab, setActiveTab] = useState('contact');
  const [localFormData, setLocalFormData] = useState({});

  useEffect(() => {
    if (userCall) {
      if (formConfig && formConfig.sections && formConfig.sections.length > 0) {
        const filledState = {};
        formConfig.sections.forEach((section) => {
          section.fields.forEach((field) => {
            const fieldName = field.name;
            const lowerFieldName = fieldName.toLowerCase();
            const userCallKeys = Object.keys(userCall);
            const matchedKey = userCallKeys.find((key) => key.toLowerCase() === lowerFieldName);
            filledState[fieldName] = matchedKey !== undefined ? userCall[matchedKey] ?? '' : '';
          });
        });
        setLocalFormData(filledState);
      } else {
        setLocalFormData({
          firstName: userCall.firstName || '',
          lastName: userCall.lastName || '',
          number: userCall.contactNumber || '',
          alternateNumber: userCall.alternateNumber || '',
          address: userCall.Contactaddress || '',
          state: userCall.ContactState || '',
          district: userCall.ContactDistrict || '',
          city: userCall.ContactCity || '',
          postalCode: userCall.ContactPincode || '',
          email: userCall.emailId || '',
          comment: userCall.comment || '',
        });
      }
    }
  }, [userCall, formConfig]);

  useEffect(() => {
    if (setFormData) {
      setFormData(localFormData);
    }
  }, [localFormData, setFormData]);

  const filteredMappedLeadsForPanel = useMemo(() => {
    if (!mappedLeads || !filterStartDate || !filterEndDate || !userCall) return [];

    const normalizedContactNumber = String(userCall.contactNumber || '').replace(/^\+91/, '');
    const startOfDay = moment(filterStartDate).startOf('day');
    const endOfDay = moment(filterEndDate).endOf('day');

    return mappedLeads.filter((lead) => {
      const leadUploadTime = moment(lead.uploadDate);
      const normalizedLeadPhone = String(lead.phone || '').replace(/^\+91/, '');

      return (
        normalizedLeadPhone === normalizedContactNumber && leadUploadTime.isBetween(startOfDay, endOfDay, null, '[]')
      );
    });
  }, [mappedLeads, filterStartDate, filterEndDate, userCall]);

  const currentLead = useMemo(() => {
    if (!filteredMappedLeadsForPanel || filteredMappedLeadsForPanel.length === 0) return null;

    const sortedLeads = [...filteredMappedLeadsForPanel].sort(
      (a, b) => moment(b.uploadDate).valueOf() - moment(a.uploadDate).valueOf()
    );
    return sortedLeads[0];
  }, [filteredMappedLeadsForPanel]);

  const filteredApiCallDataForPanel = useMemo(() => {
    if (!apiCallData || !filterStartDate || !filterEndDate || !userCall) return [];

    const normalizedContactNumber = String(userCall.contactNumber || '').replace(/^\+91/, '');
    const startOfDay = moment(filterStartDate).startOf('day');
    const endOfDay = moment(filterEndDate).endOf('day');

    return apiCallData.filter((call) => {
      const callTime = moment(call.startTime);
      const normalizedCallNumber = String(call.Caller || call.dialNumber || '').replace(/^\+91/, '');

      return normalizedCallNumber === normalizedContactNumber && callTime.isBetween(startOfDay, endOfDay, null, '[]');
    });
  }, [apiCallData, filterStartDate, filterEndDate, userCall]);

  const currentApiCallRecord = useMemo(() => {
    if (!filteredApiCallDataForPanel || filteredApiCallDataForPanel.length === 0) return null;

    const sortedCalls = [...filteredApiCallDataForPanel].sort(
      (a, b) => moment(b.startTime).valueOf() - moment(a.startTime).valueOf()
    );
    return sortedCalls[0];
  }, [filteredApiCallDataForPanel]);

  const renderContactTab = () => {
    if (!userCall) return null;

    if (formConfig && formConfig.sections && formConfig.sections.length > 0) {
      return (
        <DynamicForm
          formConfig={formConfig}
          formState={localFormData}
          setFormState={setLocalFormData}
          userCall={userCall}
          userCallDialog={true}
        />
      );
    } else {
      return (
        <UserCall formData={localFormData} setFormData={setLocalFormData} userCall={userCall} userCallDialog={true} />
      );
    }
  };

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

  const renderHistoryTab = () => {
    const normalizedContactNumber = String(userCall?.contactNumber || '').replace(/^\+91/, '');

    const historyItems = [];

    const filteredLeadHistoryItems = mappedLeads.filter(
      (lead) => String(lead.phone || '').replace(/^\+91/, '') === normalizedContactNumber
    );
    if (filteredLeadHistoryItems && filteredLeadHistoryItems.length > 0) {
      filteredLeadHistoryItems.forEach((lead) => {
        if (lead.history && lead.history.length > 0) {
          lead.history.forEach((item) => {
            const itemDate = moment(item.uploadDate);
            if (
              itemDate.isBetween(moment(filterStartDate).startOf('day'), moment(filterEndDate).endOf('day'), null, '[]')
            ) {
              historyItems.push({ ...item, _isLeadHistory: true });
            }
          });
        }
      });
      const mainLeadDate = moment(currentLead?.uploadDate);
      if (
        currentLead &&
        mainLeadDate.isBetween(moment(filterStartDate).startOf('day'), moment(filterEndDate).endOf('day'), null, '[]')
      ) {
        if (!historyItems.some((h) => h.uploadDate === currentLead.uploadDate && h.phone === currentLead.phone)) {
          historyItems.push({ ...currentLead, _isLeadHistory: true });
        }
      }
    }

    if (apiCallData && apiCallData.length > 0) {
      apiCallData.forEach((call) => {
        const mainCallDate = moment(call.startTime);
        if (
          mainCallDate.isBetween(moment(filterStartDate).startOf('day'), moment(filterEndDate).endOf('day'), null, '[]')
        ) {
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
            if (
              itemDate.isBetween(moment(filterStartDate).startOf('day'), moment(filterEndDate).endOf('day'), null, '[]')
            ) {
              historyItems.push({ ...item, _isApiHistory: true });
            }
          });
        }
      });
    }

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

  return (
    <Card className="w-full max-w-full sm:max-w-2xl md:max-w-4xl lg:max-w-6xl h-max">
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
                <TabsTrigger value="lead" className="flex items-center gap-2 text-xs sm:text-sm px-2 sm:px-4">
                  <User size={16} /> <span className="hidden sm:inline">Lead Info</span>
                </TabsTrigger>
                <TabsTrigger value="callInfo" className="flex items-center gap-2 text-xs sm:text-sm px-2 sm:px-4">
                  <Clock size={16} /> <span className="hidden sm:inline">Call Info</span>
                </TabsTrigger>
                <TabsTrigger value="history" className="flex items-center gap-2 text-xs sm:text-sm px-2 sm:px-4">
                  <History size={16} /> <span className="hidden sm:inline">History</span>
                </TabsTrigger>
              </TabsList>
              <div className="w-full sm:w-auto flex justify-end">
                <DateRangePicker
                  key={`panel-date-picker-${moment(filterStartDate).format('YYYY-MM-DD')}-${moment(
                    filterEndDate
                  ).format('YYYY-MM-DD')}`}
                  onDateChange={([start, end]) => {
                    setFilterStartDate(start);
                    setFilterEndDate(end);
                  }}
                  initialStartDate={filterStartDate}
                  initialEndDate={filterEndDate}
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
