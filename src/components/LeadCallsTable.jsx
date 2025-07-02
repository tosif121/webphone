import React, { useState, useMemo, useRef, useEffect } from 'react';
import DataTable from './DataTable'; // Your reusable DataTable component
import moment from 'moment';
import maskPhoneNumber from '@/utils/maskPhoneNumber';
import { Card, CardContent } from './ui/card';
import { ChevronDown, Phone } from 'lucide-react';
import { Button } from './ui/button';

export default function LeadCallsTable({ callDetails, handleCall }) {
  const [filter, setFilter] = useState('All');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const filterOptions = [
    { value: 'All', label: 'All Calls' },
    { value: 'Complete', label: 'Complete Calls' },
    { value: 'Success', label: 'Successful Calls' },
    { value: 'Failed', label: 'Failed Calls' },
    { value: 'Pending', label: 'Pending Calls' },
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
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
            <span className={getStatusBadge(row.original.status)}>{row.original.status}</span>
          </div>
        ),
      },

      {
        accessorKey: 'phone',
        header: 'Mobile Number',
        cell: ({ row }) => {
          const phone = row.original.phone;
          return (
            <div className="flex items-center justify-between gap-3 me-5">
              <span className="text-gray-800 dark:text-gray-100 select-all flex-1">{phone}</span>
              <Button
                size="icon"
                className="w-8 h-8 rounded-full text-white shadow-sm bg-green-600 hover:bg-green-700 hover:shadow-md focus-visible:ring-green-500 transition-all duration-200 hover:scale-105 flex-shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCall(phone);
                }}
                title={`Call ${phone}`}
              >
                <Phone className="h-4 w-4" />
              </Button>
            </div>
          );
        },
      },
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
