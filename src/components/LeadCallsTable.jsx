import React, { useState, useMemo, useRef, useEffect } from 'react';
import moment from 'moment';
import { ChevronDown, Clock, Phone, Users, X, User, History, UserCog, LayoutGrid, Info, Eye } from 'lucide-react';
import DataTable from './DataTable';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import DateRangePicker from './DateRangePicker';
import axios from 'axios';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { normalizePhone } from '@/utils/normalizePhone';

const mapLeadData = (rawData) => {
  if (!Array.isArray(rawData)) rawData = [rawData];

  return rawData.map((item, index) => {
    // Initialize mapped object with all original data
    const mapped = {
      ...item, // Keep all original fields
      name: '',
      email: '',
      phone: '',
      status: 'Pending',
      uploadDate: null,
    };

    // Handle Name: first_name + last_name OR name field
    if (item.first_name || item.last_name) {
      mapped.name = `${item.first_name || ''} ${item.last_name || ''}`.trim();
    } else if (item.name) {
      mapped.name = item.name;
    }

    // Handle Phone: number OR phone_number OR phone field
    if (item.number) {
      mapped.phone = normalizePhone(item.number);
    } else if (item.contactNumber) {
      mapped.phone = normalizePhone(item.contactNumber);
    }
    // Handle Phone: phone_number OR phone field
    if (!mapped.phone && item.phone_number) {
      mapped.phone = normalizePhone(item.phone_number);
    } else if (!mapped.phone && item.phone) {
      mapped.phone = normalizePhone(item.phone);
    }

    // Handle Start Time/Upload Date: startTime OR uploadDate
    if (item.startTime) {
      mapped.uploadDate = item.startTime;
    } else if (item.uploadDate) {
      mapped.uploadDate = item.uploadDate;
    }

    // Fallback: scan all fields for email/phone/name patterns
    Object.entries(item).forEach(([key, value]) => {
      if (!value && value !== 0) return;
      const v = String(value).trim();
      const k = key.toLowerCase();

      // Email pattern
      if (!mapped.email && v.includes('@') && v.includes('.')) {
        mapped.email = v;
      }
      // Phone pattern (10 digits) - only if not already set
      else if (!mapped.phone && /^\d{10}$/.test(v)) {
        mapped.phone = v;
      }
      // Name pattern - only if not already set
      else if (
        !mapped.name &&
        k.includes('name') &&
        !k.includes('file') &&
        !k.includes('user') &&
        !k.includes('campaign')
      ) {
        mapped.name = v;
      }
      // Date/Time pattern - only if not already set
      else if (!mapped.uploadDate && (k.includes('date') || k.includes('time'))) {
        mapped.uploadDate = value;
      }
    });

    // Map status based on lead lifecycle / lastDialedStatus
    if (item.leadState === 'locked') {
      mapped.status = 'Locked';
    } else if (item.leadState === 'assigned') {
      mapped.status = 'Assigned';
    } else if (item.leadState === 'completed' || item.lastDialedStatus === 1 || item.lastDialedStatus === 9) {
      mapped.status = 'Complete';
    } else if (item.leadState === 'failed') {
      mapped.status = 'Failed';
    } else if (item.leadState === 'skipped') {
      mapped.status = 'Skipped';
    } else if (item.lastDialedStatus === 0) {
      mapped.status = 'Pending';
    }

    return mapped;
  });
};

function LeadCallsTable({
  callDetails,
  formConfig,
  handleCall,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  apiCallData,
  activeMainTab,
  setActiveMainTab,
  username,
  token,
}) {
  const [filter, setFilter] = useState('All');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [expand, setExpand] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [activeSidebarTab, setActiveSidebarTab] = useState('details');
  const dropdownRef = useRef(null);
  const [callTypeFilter, setCallTypeFilter] = useState('All');
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);
  const [conversationDetails, setConversationDetails] = useState([]);
  const [loadingConversation, setLoadingConversation] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    // This correctly resets the panel when the main tab changes
    setExpand(false);
    setSelectedRow(null);
  }, [activeMainTab]);

  const handleDateRangeChange = ([start, end]) => {
    if (start && end) {
      setStartDate(moment(start).format('YYYY-MM-DD'));
      setEndDate(moment(end).format('YYYY-MM-DD'));
    }
  };

  const mappedLeads = useMemo(() => mapLeadData(callDetails), [callDetails]);

  const groupedLeads = useMemo(() => {
    // Return all leads without grouping, sorted by uploadDate (newest first)
    return mappedLeads
      .map((lead) => ({
        ...lead,
        history: [],
        _originalData: lead,
      }))
      .sort((a, b) => {
        // Sort by uploadDate descending (newest first)
        const dateA = a.uploadDate ? new Date(a.uploadDate).getTime() : 0;
        const dateB = b.uploadDate ? new Date(b.uploadDate).getTime() : 0;
        return dateB - dateA;
      });
  }, [mappedLeads]);

  const filteredLeads = useMemo(() => {
    switch (filter) {
      case 'Complete':
        return groupedLeads.filter((l) => l.status === 'Complete');
      case 'Pending':
        return groupedLeads.filter((l) => l.status === 'Pending');
      default:
        return groupedLeads;
    }
  }, [groupedLeads, filter]);

  const groupedApiCallData = useMemo(() => {
    const grouped = {};
    if (!apiCallData) return [];

    apiCallData.forEach((call) => {
      if (!call.Caller) return;

      const normalizedCaller = normalizePhone(call.Caller);

      if (!grouped[normalizedCaller]) {
        grouped[normalizedCaller] = {
          ...call,
          history: [],
          _originalData: call,
          _isApiCallData: true,
        };
      } else {
        grouped[normalizedCaller].history.push(call);
      }
    });

    return Object.values(grouped);
  }, [apiCallData]);

  const filteredApiData = useMemo(() => {
    if (!apiCallData) return [];

    let dataToFilter = groupedApiCallData;

    if (callTypeFilter === 'Incoming') {
      return dataToFilter.filter((call) => call.Type?.toLowerCase() === 'incoming');
    } else if (callTypeFilter === 'Outgoing') {
      return dataToFilter.filter((call) => call.Type?.toLowerCase() !== 'incoming');
    }
    return dataToFilter;
  }, [groupedApiCallData, callTypeFilter]);

  const allLeadsColumns = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => {
          // Try multiple sources for name
          const name =
            row.original.name ||
            (row.original.first_name && row.original.last_name
              ? `${row.original.first_name} ${row.original.last_name}`.trim()
              : row.original.first_name || row.original.last_name) ||
            '-';
          return <span className="font-semibold capitalize text-primary">{name}</span>;
        },
      },
      {
        accessorKey: 'phone',
        header: 'Phone',
        cell: ({ row }) => {
          // Try multiple sources for phone
          const phone =
            row.original.phone ||
            (row.original.phone_number ? String(row.original.phone_number).replace(/^\+91/, '') : null) ||
            '-';
          return <>{phone}</>;
        },
      },
      {
        accessorKey: 'uploadDate',
        header: 'Start Time',
        cell: ({ row }) => {
          // Try multiple sources for date
          const date = row.original.uploadDate || row.original.startTime;
          return <>{date ? moment(date).format('DD MMM YYYY, hh:mm A') : '-'}</>;
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const status = row.original.status;
          return (
            <Badge
              variant={status === 'Complete' ? 'default' : 'secondary'}
              className={
                status === 'Complete'
                  ? 'bg-green-100 text-green-800 hover:bg-green-200'
                  : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
              }
            >
              {status}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const phone =
            row.original.phone ||
            (row.original.phone_number ? String(row.original.phone_number).replace(/^\+91/, '') : null);
          return (
            <div className="flex items-center gap-2">
              {/* Eye icon for mobile to view details */}
              <Button
                onClick={() => handleRowExpand(row.original)}
                size="sm"
                className="lg:hidden bg-blue-600 text-white hover:bg-blue-700 rounded-full h-8 w-8 p-0"
                title="View details"
              >
                <Eye size={16} />
              </Button>
              {phone && (
                <Button
                  onClick={() => handleCall(phone, row.original)}
                  size="sm"
                  className="bg-green-600 text-white hover:bg-green-700 rounded-full h-8 w-8 p-0"
                  title="Make call"
                >
                  <Phone size={16} />
                </Button>
              )}
            </div>
          );
        },
      },
    ],
    [handleCall],
  );

  const apiInfoColumns = useMemo(() => {
    return [
      {
        accessorKey: 'startTime',
        header: 'Start Time',
        cell: ({ row }) => (
          <span>{row.original.startTime ? moment(row.original.startTime).format('DD MMM YYYY, hh:mm A') : '-'}</span>
        ),
      },
      {
        accessorKey: 'Type',
        header: 'Type',
        cell: ({ row }) => {
          const type = row.original.Type;
          const isIncoming = type?.toLowerCase() === 'incoming';

          return (
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
        },
      },
      {
        accessorKey: 'Caller',
        header: 'Phone',
        cell: ({ row }) => {
          let phone = row.original.Caller;
          if (phone && typeof phone === 'string' && phone.startsWith('+91')) {
            phone = phone.substring(3);
          }

          return (
            <div className="flex items-center gap-2">
              <span className="font-mono">{phone || '-'}</span>
              {/* Eye icon for mobile to view details */}
              <Button
                onClick={() => handleRowExpand(row.original)}
                size="sm"
                className="lg:hidden bg-blue-600 text-white hover:bg-blue-700 rounded-full h-8 w-8 p-0"
                title="View details"
              >
                <Eye size={16} />
              </Button>
              {phone && (
                <Button
                  onClick={() => handleCall(row.original.Caller, row.original)}
                  size="sm"
                  className="bg-green-600 text-white hover:bg-green-700 rounded-full h-8 w-8 p-0"
                >
                  <Phone size={16} />
                </Button>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'Disposition',
        header: 'Disposition',
        cell: ({ row }) => {
          const disposition = row.original.Disposition;
          if (!disposition) return <span className="text-muted-foreground text-xs">-</span>;
          return (
            <Badge variant="outline" className="text-xs font-medium">
              {disposition}
            </Badge>
          );
        },
      },
    ];
  }, [handleCall]);

  const handleRowExpand = (rowData) => {
    setSelectedRow(rowData);
    setExpand(true);
    setActiveSidebarTab('details');
  };

  const renderDetailsTab = () => {
    if (!selectedRow) return null;

    const isLeadData = 'lastDialedStatus' in selectedRow;
    const isApiCallRecord = selectedRow._isApiCallData;

    if (isLeadData) {
      const dynamicFields = formConfig?.sections?.flatMap((section) => section.fields?.map((f) => f.name)) || [];
      const hasMeaningfulData = dynamicFields.some((fieldName) => {
        const value = selectedRow[fieldName];
        return value !== undefined && value !== null && String(value).trim() !== '';
      });

      if (!hasMeaningfulData && !selectedRow.name && !selectedRow.email && !selectedRow.phone) {
        return (
          <div className="text-center py-8">
            <User size={48} className="mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Lead Information not found for this number.</p>
          </div>
        );
      }

      const detailFields = [];
      if (Array.isArray(formConfig?.sections) && formConfig.sections.length > 0) {
        formConfig.sections.forEach((section) => {
          section.fields.forEach((field) => {
            const fieldName = field.name;
            const label = field.label || field.name;
            const value = selectedRow[fieldName] ?? '-';
            detailFields.push({ label, value: value?.toString().trim() || '-', key: fieldName });
          });
        });
      } else {
        detailFields.push(
          { label: 'Name', value: selectedRow.name || '-', key: 'name' },
          { label: 'Email Address', value: selectedRow.email || '-', key: 'email' },
          { label: 'Phone', value: selectedRow.phone || '-', key: 'phone' },
          { label: 'Address 1', value: selectedRow.address1 || '-', key: 'address1' },
          { label: 'Address 2', value: selectedRow.address2 || '-', key: 'address2' },
          { label: 'City', value: selectedRow.city || '-', key: 'city' },
          { label: 'State', value: selectedRow.state || '-', key: 'state' },
          { label: 'Postal Code', value: selectedRow.postalCode || '-', key: 'postalCode' },
          { label: 'Country', value: selectedRow.country || '-', key: 'country' },
        );
      }

      return (
        <div className="space-y-4">
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
          </div>

          <div className="border-t pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Upload Date:</span>
              <span className="text-sm">
                {selectedRow.uploadDate ? moment(selectedRow.uploadDate).format('DD MMM YYYY, hh:mm A') : '-'}
              </span>
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Status:</span>
              <Badge
                variant={selectedRow.status === 'Complete' ? 'default' : 'secondary'}
                className={
                  selectedRow.status === 'Complete'
                    ? 'bg-green-100 text-green-800 hover:bg-green-200'
                    : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                }
              >
                {selectedRow.status}
              </Badge>
            </div>
          </div>

          {selectedRow.phone && (
            <div className="border-t pt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Call {selectedRow.name || 'Lead'}:</span>
                <Button
                  onClick={() => handleCall(selectedRow.phone, selectedRow)}
                  size="sm"
                  className="bg-green-600 text-white hover:bg-green-700 rounded-full px-4"
                >
                  <Phone size={16} className="mr-2" /> Call {selectedRow.phone}
                </Button>
              </div>
            </div>
          )}
        </div>
      );
    } else if (isApiCallRecord) {
      const dataToDisplay = selectedRow._originalData || selectedRow;
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
        <>
          <div className="space-y-4">
            <div className="space-y-4">
              {specificKeysConfig.map((fieldConfig, index) => {
                const key = fieldConfig.key;
                const label = fieldConfig.label;
                let value = dataToDisplay[key];
                let displayContent;

                if (
                  typeof value === 'number' &&
                  (key.toLowerCase().includes('time') || key.toLowerCase().includes('date'))
                ) {
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
            </div>

            {selectedRow.Caller && (
              <div className="border-t pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Call Caller:</span>
                  <Button
                    onClick={() => handleCall(selectedRow.Caller, selectedRow)}
                    size="sm"
                    className="bg-green-600 text-white hover:bg-green-700 rounded-full px-4"
                  >
                    <Phone size={16} className="mr-2" /> Call {String(selectedRow.Caller).replace(/^\+91/, '')}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </>
      );
    }
    return null;
  };

  const renderHistoryTab = () => {
    if (!selectedRow || !selectedRow.history || selectedRow.history.length === 0) {
      return (
        <div className="text-center py-8">
          <History size={48} className="mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No call history available for this entry.</p>
        </div>
      );
    }

    const isLeadDataHistory = 'lastDialedStatus' in selectedRow.history[0];

    const handleHistoryCardClick = async (historyItem) => {
      setSelectedHistoryItem(historyItem);
      setConversationDetails([]);
      setLoadingConversation(true);

      const contactNumber = normalizePhone(
        historyItem.phone_number ||
          historyItem.phone ||
          historyItem.Caller ||
          historyItem.dialNumber ||
          historyItem.contactNumber ||
          '',
      );

      if (!contactNumber) {
        setLoadingConversation(false);
        return;
      }

      try {
        if (!token) {
          setLoadingConversation(false);
          return;
        }

        const formattedStartDate = moment(startDate).format('YYYY-MM-DD');
        const formattedEndDate = moment(endDate).format('YYYY-MM-DD');

        const response = await axios.get(`${window.location.origin}/fetchConversationsAgent`, {
          params: { startDate: formattedStartDate, endDate: formattedEndDate, agentName: username },
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data?.success && response.data.result) {
          const matched = [...response.data.result];
          matched.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
          setConversationDetails(matched);
        }
      } catch (err) {
        console.error('Error fetching conversations:', err);
      } finally {
        setLoadingConversation(false);
      }
    };

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <History size={16} className="text-muted-foreground" />
          <span className="text-sm font-medium">Call History ({selectedRow.history.length})</span>
        </div>

        <div className="space-y-3 max-h-[32rem] overflow-y-auto">
          {selectedRow.history.map((historyItem, index) => (
            <Card
              key={index}
              className="border-l-4 border-l-primary/30 cursor-pointer hover:shadow-md hover:border-l-primary/60 transition-all duration-200"
              onClick={() => handleHistoryCardClick(historyItem)}
            >
              <CardContent className="p-4">
                <div className="space-y-3">
                  {isLeadDataHistory ? (
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

                      {historyItem.Caller && (
                        <div className="flex items-center gap-2">
                          <Phone size={16} className="text-muted-foreground" />
                          <span className="text-sm font-mono">{String(historyItem.Caller).replace(/^\+91/, '')}</span>
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
    <div className="flex flex-col lg:flex-row transition-all duration-300 ease-in-out gap-4 lg:gap-0">
      <Card
        className={`transition-all duration-300 ease-in-out ${
          expand
            ? 'lg:w-1/3 w-full h-max opacity-100 translate-x-0 block'
            : 'w-0 h-0 opacity-0 lg:-translate-x-full overflow-hidden hidden lg:block'
        }`}
      >
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <span className="text-lg font-semibold">
              {selectedRow?._isApiCallData ? 'Call Information' : 'Lead Information'}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setExpand(false);
                setSelectedRow(null);
              }}
              className="hover:bg-accent rounded-full h-8 w-8 p-0"
            >
              <X size={16} />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!selectedRow ? (
            <div className="text-center py-8">
              <User size={48} className="mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Select an entry to view details.</p>
            </div>
          ) : (
            <Tabs value={activeSidebarTab} onValueChange={setActiveSidebarTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="details" className="flex items-center gap-2">
                  {selectedRow?._isApiCallData ? <Info size={16} /> : <UserCog size={16} />}
                  {selectedRow?._isApiCallData ? 'Call Details' : 'Leads Details'}
                </TabsTrigger>
                <TabsTrigger value="history" className="flex items-center gap-2">
                  <History size={16} />
                  History
                  {selectedRow?.history?.length > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                    >
                      {selectedRow.history.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
              <TabsContent value="details" className="mt-4">
                {renderDetailsTab()}
              </TabsContent>
              <TabsContent value="history" className="mt-4">
                {renderHistoryTab()}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      <Card
        className={`transition-all duration-500 ease-in-out h-max ${expand ? 'lg:w-2/3 w-full lg:ms-5' : 'w-full'}`}
      >
        <CardContent>
          <Tabs
            value={activeMainTab}
            onValueChange={(value) => {
              setActiveMainTab(value);
              setStartDate(moment().subtract(24, 'hours').format('YYYY-MM-DD'));
              setEndDate(moment().format('YYYY-MM-DD'));
              setFilter('All');
              setCallTypeFilter('All');
            }}
            className="w-full"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center md:mb-6 gap-4">
              <TabsList className="grid grid-cols-2 w-full sm:w-fit">
                <TabsTrigger value="callInfo" className="flex items-center gap-2">
                  <Clock size={16} />
                  <span className="hidden sm:inline">Call Info</span>
                  <span className="sm:hidden">Calls</span>
                </TabsTrigger>
                <TabsTrigger value="allLeads" className="flex items-center gap-2">
                  <LayoutGrid size={16} />
                  <span className="hidden sm:inline">All Leads</span>
                  <span className="sm:hidden">Leads</span>
                </TabsTrigger>
              </TabsList>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                {activeMainTab === 'allLeads' && (
                  <div ref={dropdownRef} className="relative w-full sm:w-auto">
                    <Button
                      variant="outline"
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="w-full sm:min-w-[140px] justify-between"
                    >
                      {filter}
                      <ChevronDown
                        className={`ml-2 w-4 h-4 transition-transform duration-200 ${
                          isDropdownOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </Button>
                    {isDropdownOpen && (
                      <div className="absolute z-10 bg-background border rounded-md shadow-md w-full mt-1">
                        {['All', 'Complete', 'Pending'].map((opt) => (
                          <button
                            key={opt}
                            className={`block w-full px-4 py-2 text-left hover:bg-accent rounded-md ${
                              filter === opt ? 'bg-accent font-medium' : ''
                            }`}
                            onClick={() => {
                              setFilter(opt);
                              setIsDropdownOpen(false);
                            }}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {activeMainTab === 'callInfo' && (
                  <div ref={dropdownRef} className="relative w-full sm:w-auto">
                    <Button
                      variant="outline"
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="w-full sm:min-w-[140px] justify-between"
                    >
                      {callTypeFilter}
                      <ChevronDown
                        className={`ml-2 w-4 h-4 transition-transform duration-200 ${
                          isDropdownOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </Button>
                    {isDropdownOpen && (
                      <div className="absolute z-10 bg-background border rounded-md shadow-md w-full mt-1">
                        {['All', 'Incoming', 'Outgoing'].map((opt) => (
                          <button
                            key={opt}
                            className={`block w-full px-4 py-2 text-left hover:bg-accent rounded-md ${
                              callTypeFilter === opt ? 'bg-accent font-medium' : ''
                            }`}
                            onClick={() => {
                              setCallTypeFilter(opt);
                              setIsDropdownOpen(false);
                            }}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                <div className="w-full sm:w-auto">
                  <DateRangePicker
                    key={`${startDate}-${endDate}`}
                    onDateChange={handleDateRangeChange}
                    initialStartDate={startDate ? moment(startDate).toDate() : null}
                    initialEndDate={endDate ? moment(endDate).toDate() : null}
                  />
                </div>
              </div>
            </div>

            <TabsContent value="allLeads" className="mt-4">
              <DataTable
                data={filteredLeads}
                columns={allLeadsColumns}
                searchPlaceholder="Search Leads Details..."
                expand={expand}
                setExpand={setExpand}
                expandRow={true}
                onRowExpand={handleRowExpand}
              />
            </TabsContent>

            <TabsContent value="callInfo" className="mt-4">
              <DataTable
                data={filteredApiData}
                columns={apiInfoColumns}
                searchPlaceholder="Search Call Details..."
                expand={expand}
                setExpand={setExpand}
                expandRow={true}
                onRowExpand={handleRowExpand}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Conversations Detail Dialog */}
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

                const formatLabel = (key) => {
                  return key
                    .replace(/([A-Z])/g, ' $1')
                    .replace(/_/g, ' ')
                    .replace(/^./, (s) => s.toUpperCase())
                    .trim();
                };

                const formatValue = (key, value) => {
                  if (value === null || value === undefined || value === '') return null;
                  const k = key.toLowerCase();
                  if (k === 'createdat' || k.includes('date') || k.includes('time')) {
                    const m = moment(value);
                    if (m.isValid()) return m.format('DD MMM YYYY, hh:mm:ss A');
                  }
                  if (typeof value === 'object') return JSON.stringify(value);
                  return String(value);
                };

                const entries = Object.entries(conv)
                  .filter(([key, value]) => {
                    if (skipKeys.has(key)) return false;
                    if (key.startsWith('_')) return false;
                    if (value === null || value === undefined || value === '') return false;
                    if (typeof value === 'object') return false;
                    return true;
                  })
                  .map(([key, value]) => ({
                    key,
                    label: formatLabel(key),
                    value: formatValue(key, value),
                  }))
                  .filter((entry) => entry.value !== null);

                return (
                  <div key={conv._id || idx}>
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
                    {idx < conversationDetails.length - 1 && <Separator className="my-3" />}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No conversation data found for this contact.
            </p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default React.memo(LeadCallsTable);
