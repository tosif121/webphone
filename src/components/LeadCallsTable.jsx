// Add this utility at the top if not already imported
import React, { useState, useMemo, useRef, useEffect } from 'react';
import moment from 'moment';
import { ChevronDown, Phone } from 'lucide-react';
import DataTable from './DataTable';
import maskPhoneNumber from '@/utils/maskPhoneNumber';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
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
      case 2:
        mapped.status = 'Failed';
        break;
      case 0:
      default:
        mapped.status = 'Pending';
    }

    return mapped;
  });
};

export default function LeadCallsTable({ callDetails, handleCall, startDate, setStartDate, endDate, setEndDate }) {
  const [filter, setFilter] = useState('All');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
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

  const totalCalls = mappedLeads.length;
  const completeCalls = mappedLeads.filter((l) => l.status === 'Complete').length;
  const pendingCalls = mappedLeads.filter((l) => l.status === 'Pending').length;
  const failedCalls = mappedLeads.filter((l) => l.status === 'Failed').length;

  const filteredLeads = useMemo(() => {
    switch (filter) {
      case 'Complete':
        return mappedLeads.filter((l) => l.status === 'Complete');
      case 'Pending':
        return mappedLeads.filter((l) => l.status === 'Pending');
      case 'Failed':
        return mappedLeads.filter((l) => l.status === 'Failed');
      default:
        return mappedLeads;
    }
  }, [mappedLeads, filter]);

  const columns = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => <span className="font-semibold">{row.original.name || 'N/A'}</span>,
      },
      {
        accessorKey: 'email',
        header: 'Email',
        cell: ({ row }) => <span>{row.original.email || 'N/A'}</span>,
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
          const badgeClass =
            status === 'Complete'
              ? 'bg-green-100 text-green-800'
              : status === 'Failed'
              ? 'bg-red-100 text-red-800'
              : 'bg-yellow-100 text-yellow-800';
          return <span className={`px-2 py-1 text-xs font-medium rounded ${badgeClass}`}>{status}</span>;
        },
      },
      {
        accessorKey: 'phone',
        header: 'Phone',
        cell: ({ row }) => {
          const phone = row.original.phone;
          return (
            <div className="flex items-center gap-3">
              <span>{phone || 'N/A'}</span>
              {phone && (
                <Button
                  onClick={() => handleCall(phone)}
                  size="icon"
                  className="bg-green-600 text-white hover:bg-green-700 rounded-full w-8 h-8"
                >
                  <Phone size={16} />
                </Button>
              )}
            </div>
          );
        },
      },
    ],
    []
  );

  return (
    <Card>
      <CardContent>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold">Lead Calls Details</h3>
          <div className="flex items-center gap-4">
            <div ref={dropdownRef} className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="px-4 py-2 border rounded bg-background hover:bg-accent min-w-[140px] flex justify-between items-center"
              >
                {filter}
                <ChevronDown className={`ml-2 w-4 h-4 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {isDropdownOpen && (
                <div className="absolute z-10 bg-white border shadow w-full mt-1 rounded">
                  {['All', 'Complete', 'Pending', 'Failed'].map((opt) => (
                    <button
                      key={opt}
                      className={`block w-full px-4 py-2 text-left hover:bg-gray-100 ${
                        filter === opt ? 'bg-gray-100 font-semibold' : ''
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

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <StatCard label="Total Calls" value={totalCalls} color="blue" />
          <StatCard label="Complete Calls" value={completeCalls} color="green" />
          <StatCard label="Pending Calls" value={pendingCalls} color="yellow" />
          <StatCard label="Failed Calls" value={failedCalls} color="red" />
        </div>

        <DataTable data={filteredLeads} columns={columns} searchPlaceholder="Search leads..." />
      </CardContent>
    </Card>
  );
}

function StatCard({ label, value, color }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
    green: 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300',
    yellow: 'bg-yellow-50 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
    red: 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300',
  };
  return (
    <div className={`p-4 rounded shadow-sm ${colors[color]}`}>
      <div className="text-sm">{label}</div>
      <div className="text-xl font-bold">{value}</div>
    </div>
  );
}
