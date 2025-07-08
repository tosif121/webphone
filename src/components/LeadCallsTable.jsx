import React, { useState, useMemo, useRef, useEffect } from 'react';
import moment from 'moment';
import { ChevronDown, ChevronRight, Clock, Phone, Users, X, Calendar, Mail, User, History } from 'lucide-react';
import DataTable from './DataTable';
import maskPhoneNumber from '@/utils/maskPhoneNumber';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import DateRangePicker from './DateRangePicker';

// Map raw API lead data into normalized display data
const mapLeadData = (rawData) => {
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
};

export default function LeadCallsTable({
  callDetails,
  formConfig,
  handleCall,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
}) {
  const [filter, setFilter] = useState('All');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [expand, setExpand] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [activeTab, setActiveTab] = useState('details');
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleDateRangeChange = ([start, end]) => {
    if (start && end) {
      setStartDate(moment(start).format('YYYY-MM-DD'));
      setEndDate(moment(end).format('YYYY-MM-DD'));
    }
  };

  const mappedLeads = useMemo(() => mapLeadData(callDetails), [callDetails]);

  // Group leads by phone number to handle duplicates
  const groupedLeads = useMemo(() => {
    const grouped = {};
    mappedLeads.forEach((lead) => {
      if (!lead.phone) return;

      if (!grouped[lead.phone]) {
        grouped[lead.phone] = {
          ...lead,
          history: [],
        };
      } else {
        grouped[lead.phone].history.push(lead);
      }
    });

    return Object.values(grouped);
  }, [mappedLeads]);

  const totalCalls = groupedLeads.length;
  const completeCalls = groupedLeads.filter((l) => l.status === 'Complete').length;
  const pendingCalls = groupedLeads.filter((l) => l.status === 'Pending').length;

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

  const columns = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => <span className="font-semibold">{row.original.name || 'N/A'}</span>,
      },
      {
        accessorKey: 'uploadDate',
        header: 'Start Time',
        cell: ({ row }) => (
          <span>{row.original.uploadDate ? moment(row.original.uploadDate).format('DD MMM YYYY, hh:mm A') : '-'}</span>
        ),
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
        accessorKey: 'phone',
        header: 'Phone',
        cell: ({ row }) => {
          const phone = row.original.phone;
          return (
            <div className="flex items-center gap-3">
              <span className="font-mono">{phone || 'N/A'}</span>
              {phone && (
                <Button
                  onClick={() => handleCall(phone)}
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
    ],
    [handleCall]
  );

  const handleRowExpand = (rowData) => {
    setSelectedRow(rowData);
    setExpand(true);
    setActiveTab('details');
  };

  const renderDetailsTab = () => {
    if (!selectedRow) return null;

    const detailFields = [];

    // Use formConfig if available
    if (Array.isArray(formConfig?.sections) && formConfig.sections.length > 0) {
      formConfig.sections.forEach((section) => {
        section.fields.forEach((field) => {
          const fieldName = field.name;
          const label = field.label || field.name;
          const value = selectedRow[fieldName] ?? 'N/A';

          detailFields.push({
            label,
            value: value?.toString().trim() || 'N/A',
            key: fieldName,
          });
        });
      });
    } else {
      // Default fields if no formConfig
      detailFields.push(
        { label: 'Name', value: selectedRow.name || 'N/A', key: 'name' },
        { label: 'Email Address', value: selectedRow.email || 'N/A', key: 'email' },
        { label: 'Phone', value: selectedRow.phone || 'N/A', key: 'phone' },
        { label: 'Address 1', value: selectedRow.address1 || 'N/A', key: 'address1' },
        { label: 'Address 2', value: selectedRow.address2 || 'N/A', key: 'address2' },
        { label: 'City', value: selectedRow.city || 'N/A', key: 'city' },
        { label: 'State', value: selectedRow.state || 'N/A', key: 'state' },
        { label: 'Postal Code', value: selectedRow.postalCode || 'N/A', key: 'postalCode' },
        { label: 'Country', value: selectedRow.country || 'N/A', key: 'country' }
      );
    }

    return (
      <div className="space-y-4">
        <div className="grid gap-4">
          {detailFields.map((field, index) => (
            <div key={field.key} className="space-y-1">
              <div className="flex justify-between items-start">
                <span className="text-sm font-medium text-muted-foreground">{field.label}:</span>
                <span className="text-sm text-right max-w-[200px] break-words">{field.value}</span>
              </div>
              {index < detailFields.length - 1 && <Separator />}
            </div>
          ))}
        </div>

        <div className="pt-4 border-t">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-muted-foreground">Upload Date:</span>
            <span className="text-sm">
              {selectedRow.uploadDate ? moment(selectedRow.uploadDate).format('DD MMM YYYY, hh:mm A') : 'N/A'}
            </span>
          </div>
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
      </div>
    );
  };

  const renderHistoryTab = () => {
    if (!selectedRow || !selectedRow.history || selectedRow.history.length === 0) {
      return (
        <div className="text-center py-8">
          <History size={48} className="mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No call history available</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <History size={16} className="text-muted-foreground" />
          <span className="text-sm font-medium">Call History ({selectedRow.history.length})</span>
        </div>

        <div className="space-y-3 max-h-[32rem] overflow-y-auto">
          {selectedRow.history.map((historyItem, index) => (
            <Card key={index} className="border-l-4 border-l-primary/30">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User size={16} className="text-muted-foreground" />
                      <span className="font-medium">{historyItem.name || 'N/A'}</span>
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
                    <Calendar size={16} className="text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {historyItem.uploadDate ? moment(historyItem.uploadDate).format('DD MMM YYYY, hh:mm A') : 'N/A'}
                    </span>
                  </div>

                  {historyItem.phone && (
                    <div className="flex items-center gap-2">
                      <Phone size={16} className="text-muted-foreground" />
                      <span className="text-sm font-mono">{historyItem.phone}</span>
                    </div>
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
    <div className="flex gap-5 transition-all duration-300 ease-in-out">
      <Card className={`transition-all duration-300 ease-in-out ${expand ? 'w-2/3' : 'w-full'}`}>
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold">Lead Calls Details</h3>
            <div className="flex items-center gap-4">
              <div ref={dropdownRef} className="relative">
                <Button
                  variant="outline"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="min-w-[140px] justify-between"
                >
                  {filter}
                  <ChevronDown
                    className={`ml-2 w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
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
              <DateRangePicker
                onDateChange={handleDateRangeChange}
                initialStartDate={startDate}
                initialEndDate={endDate}
              />
            </div>
          </div>

          <DataTable
            data={filteredLeads}
            columns={columns}
            searchPlaceholder="Search leads..."
            expand={expand}
            setExpand={setExpand}
            expandRow={true}
            onRowExpand={handleRowExpand}
          />
        </CardContent>
      </Card>

      {expand && selectedRow && (
        <Card className="w-1/3 transition-all duration-300 ease-in-out">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <span className="text-lg font-semibold">Lead Information</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpand(false)}
                className="hover:bg-accent rounded-full h-8 w-8 p-0"
              >
                <X size={16} />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="details" className="flex items-center gap-2">
                  <User size={16} />
                  Details
                </TabsTrigger>
                <TabsTrigger value="history" className="flex items-center gap-2">
                  <History size={16} />
                  History
                  {selectedRow.history && selectedRow.history.length > 0 && (
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

            <div className="pt-4 border-t">
              <Button
                onClick={() => handleCall(selectedRow.phone)}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                disabled={!selectedRow.phone}
              >
                <Phone size={16} className="mr-2" />
                Call Now
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
