import React, { useState, useMemo } from 'react';
import DataTable from './DataTable'; // Your reusable DataTable component
import moment from 'moment';
import maskPhoneNumber from '@/utils/maskPhoneNumber';
import { Headphones, CheckCircle, XCircle, AlertCircle, ChevronDown } from 'lucide-react';
import { Card, CardContent } from './ui/card';

export default function LeadCallsTable({ callDetails }) {
  const [filter, setFilter] = useState('All');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = React.useRef(null);

  const filterOptions = [
    { value: 'All', label: 'All Calls' },
    { value: 'Complete', label: 'Complete Calls' },
    { value: 'Success', label: 'Successful Calls' },
    { value: 'Failed', label: 'Failed Calls' },
    { value: 'Pending', label: 'Pending Calls' },
  ];

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Define columns for DataTable
  const columns = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => <span className="font-medium text-gray-800 dark:text-gray-100">{row.original.name}</span>,
      },
      {
        accessorKey: 'email',
        header: 'Email',
        cell: ({ row }) => <span className="text-gray-700 dark:text-gray-200">{row.original.email}</span>,
      },
      {
        accessorKey: 'startTime',
        header: 'Start Time',
        cell: ({ row }) => (
          <span className="text-gray-600 dark:text-gray-300">
            {row.original.startTime ? moment(row.original.startTime).format('DD-MMM-YYYY HH:mm:ss A') : '-'}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            {getStatusIcon(row.original.status)}
            <span className={getStatusBadge(row.original.status)}>{row.original.status}</span>
          </div>
        ),
      },
      // Add more columns as needed
    ],
    []
  );

  // Filter calls based on filter select
  const filteredData = useMemo(() => {
    if (!callDetails) return [];

    switch (filter) {
      case 'Complete':
        return callDetails.filter((call) => call.status === 'Success' || call.status === 'Failed');
      case 'Success':
        return callDetails.filter((call) => call.status === 'Success');
      case 'Failed':
        return callDetails.filter((call) => call.status === 'Failed');
      case 'Pending':
        return callDetails.filter((call) => call.status === 'Pending');
      case 'All':
      default:
        return callDetails;
    }
  }, [callDetails, filter]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'Failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'Pending':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status) => {
    const baseClasses = 'px-2 py-1 rounded-full text-xs font-medium';
    switch (status) {
      case 'Success':
        return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400`;
      case 'Failed':
        return `${baseClasses} bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400`;
      case 'Pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400`;
      default:
        return baseClasses;
    }
  };

  return (
    <Card>
      <CardContent className="w-full">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold">Lead Calls Details</h3>
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 px-4 py-2 border border-input bg-background rounded-md text-sm hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent min-w-[140px] justify-between"
            >
              <span>{filterOptions.find((option) => option.value === filter)?.label}</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {isDropdownOpen && (
              <div className="absolute right-0 mt-1 w-full bg-background border border-border rounded-md shadow-lg z-10">
                {filterOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setFilter(option.value);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground first:rounded-t-md last:rounded-b-md ${
                      filter === option.value ? 'bg-primary text-primary-foreground' : 'text-foreground'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <DataTable data={filteredData} columns={columns} searchPlaceholder="Search Lead Calls..." />
      </CardContent>
    </Card>
  );
}
