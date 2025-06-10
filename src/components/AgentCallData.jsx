'use client';

import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import moment from 'moment';
import { Download, FileText, Headphones, Loader2 } from 'lucide-react';
import AudioPlayer from './AudioPlayer';
import DataTable from './DataTable';
import DateRangePicker from './DateRangePicker'; // Import the new DateRangePicker
import toast from 'react-hot-toast';
import maskPhoneNumber from '@/utils/maskPhoneNumber';

export default function AgentCallData() {
  const [callDetails, setCallDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(moment().subtract(24, 'hours').format('YYYY-MM-DD'));
  const [endDate, setEndDate] = useState(moment().format('YYYY-MM-DD'));
  const [currentAudioUrl, setCurrentAudioUrl] = useState('');
  const [currentBridgeId, setCurrentBridgeId] = useState('');
  const [isAudioPlayerOpen, setIsAudioPlayerOpen] = useState(false);
  const [isPdfLoading, setIsPdfLoading] = useState(false);

  useEffect(() => {
    if (startDate && endDate) fetchCallData();
    // eslint-disable-next-line
  }, [startDate, endDate]);

  const getTokenDetails = () => {
    try {
      const tokenData = localStorage.getItem('token');
      const parsedData = JSON.parse(tokenData);
      return {
        token: parsedData.token,
        adminUser: parsedData.userData.adminuser,
      };
    } catch (error) {
      console.error('Error parsing token:', error);
      return null;
    }
  };

  const fetchCallData = async () => {
    setLoading(true);
    try {
      const tokenDetails = getTokenDetails();
      if (!tokenDetails) return;

      const payload = {
        admin: tokenDetails.adminUser,
        startdate: startDate,
        enddate: endDate,
      };

      const { data } = await axios.post(`https://esamwad.iotcom.io/agentcallData`, payload, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenDetails.token}`,
        },
      });

      setCallDetails(data.result);
    } catch (error) {
      toast.error('Failed to fetch call details');
    } finally {
      setLoading(false);
    }
  };

  // Handle date range change from DateRangePicker
  const handleDateRangeChange = (dates) => {
    const [start, end] = dates;
    if (start && end) {
      setStartDate(moment(start).format('YYYY-MM-DD'));
      setEndDate(moment(end).format('YYYY-MM-DD'));
    }
  };

  const handleDownloadCSV = () => {
    if (callDetails.length === 0) {
      toast.error('No data available to download.');
      return;
    }
    const escapeCsvField = (field) => {
      if (field === null || field === undefined) return '""';
      const stringField = String(field);
      if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
        return `"${stringField.replace(/"/g, '""')}"`;
      }
      return stringField;
    };
    const headers = [
      'Caller',
      'Campaign',
      'Call Received',
      'Call Answered',
      'Call Disconnected',
      'Duration',
      'Type',
      'Disposition',
    ];
    const csvRows = callDetails.map((row) => [
      escapeCsvField(row.Caller),
      escapeCsvField(row.campaign),
      escapeCsvField(moment(row.startTime).format('DD-MMM-YYYY HH:mm:ss A')),
      escapeCsvField(row.anstime ? moment(row.anstime).format('DD-MMM-YYYY HH:mm:ss A') : '-'),
      escapeCsvField(row.hanguptime ? moment(row.hanguptime).format('DD-MMM-YYYY HH:mm:ss A') : '-'),
      escapeCsvField(
        row.hanguptime && row.startTime
          ? moment.utc((row.hanguptime - row.startTime) * 1000).format('HH:mm:ss')
          : '00:00:00'
      ),
      escapeCsvField(row.Type),
      escapeCsvField(row.Disposition || 'No Disposition'),
    ]);
    const BOM = '\uFEFF';
    const csvContent = BOM + [headers, ...csvRows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `call_data_${moment().format('YYYYMMDD_HHmmss')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePlayAudio = (bridgeID) => {
    const audioSource = `https://esamwad.iotcom.io/recording${bridgeID}.wav`;
    setCurrentAudioUrl(audioSource);
    setCurrentBridgeId(bridgeID);
    setIsAudioPlayerOpen(true);
  };

  const handleDownloadPDF = async () => {
    try {
      if (callDetails.length === 0) {
        toast.error('No data available to download.');
        return;
      }

      setIsPdfLoading(true);

      const sanitizeHtml = (str) => {
        if (str === null || str === undefined) return '';
        return String(str)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#039;');
      };

      const generateFirstTable = (data) => {
        const rows = data
          .map(
            (row) => `
          <tr>
            <td>${sanitizeHtml(row.Caller)}</td>
            <td>${sanitizeHtml(row.campaign)}</td>
            <td>${moment(row.startTime).format('DD-MMM-YYYY HH:mm:ss A')}</td>
            <td>${row.anstime ? moment(row.anstime).format('DD-MMM-YYYY HH:mm:ss A') : '-'}</td>
          </tr>
        `
          )
          .join('');

        return `
          <table>
            <thead>
              <tr>
                <th>Caller</th>
                <th>Campaign</th>
                <th>Call Received</th>
                <th>Call Answered</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        `;
      };

      const generateSecondTable = (data) => {
        const rows = data
          .map(
            (row) => `
          <tr>
            <td>${row.hanguptime ? moment(row.hanguptime).format('DD-MMM-YYYY HH:mm:ss A') : '-'}</td>
            <td>${
              row.hanguptime && row.startTime
                ? moment.utc((row.hanguptime - row.startTime) * 1000).format('HH:mm:ss')
                : '00:00:00'
            }</td>
            <td>${sanitizeHtml(row.Type)}</td>
            <td>${sanitizeHtml(row.Disposition || 'No Disposition')}</td>
          </tr>
        `
          )
          .join('');

        return `
          <table>
            <thead>
              <tr>
                <th>Call Disconnected</th>
                <th>Duration</th>
                <th>Type</th>
                <th>Disposition</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        `;
      };

      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <style>
              body {
                font-family: Arial, sans-serif;
                font-size: 10px;
                padding: 20px;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 20px;
                font-size: 10px;
              }
              th, td {
                border: 1px solid #ddd;
                padding: 4px;
                text-align: left;
                width: 25%;
              }
              th {
                background-color: #f2f2f2;
                font-weight: bold;
              }
              .header {
                text-align: center;
                margin-bottom: 20px;
              }
              .header h1 {
                font-size: 12px;
                margin: 0;
                padding: 0;
              }
              .date-range {
                text-align: right;
                margin-bottom: 10px;
                font-size: 10px;
              }
              .table-divider {
                margin: 20px 0;
                border-top: 1px solid #ddd;
              }
              .table-label {
                font-size: 10px;
                font-weight: bold;
                margin-bottom: 5px;
              }
              .footer {
                font-size: 10px;
                margin-top: 20px;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Call Data Report</h1>
            </div>
            <div class="date-range">
              <p>From: ${startDate} To: ${endDate}</p>
            </div>
            <div class="table-label">Basic Call Information</div>
            ${generateFirstTable(callDetails)}
            <div class="table-divider"></div>
            <div class="table-label">Call Details</div>
            ${generateSecondTable(callDetails)}
            <div class="footer">
              <p>Generated on: ${moment().format('DD-MMM-YYYY HH:mm:ss A')}</p>
            </div>
          </body>
        </html>
      `;

      const response = await axios.post(
        'https://pacsdev.iotcom.io/pdfgen/generate-pdf',
        { htmlContent },
        {
          responseType: 'blob',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `call_report_${moment().format('YYYYMMDD_HHmmss')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      if (error.response?.status === 401) {
        toast.error('Authentication failed. Please login again.');
      } else if (error.response?.status === 413) {
        toast.error('Report too large. Please try a smaller date range.');
      } else {
        toast.error('Error generating PDF. Please try again.');
      }
    } finally {
      setIsPdfLoading(false);
    }
  };

  // Define columns for the DataTable
  const columns = useMemo(
    () => [
      {
        accessorKey: 'Caller',
        header: 'Caller',
        cell: ({ row }) => (
          <span className="font-medium text-gray-800 dark:text-gray-100">{maskPhoneNumber(row.original.Caller)}</span>
        ),
      },
      {
        accessorKey: 'campaign',
        header: 'Campaign',
        cell: ({ row }) => <span className="text-gray-700 dark:text-gray-200">{row.original.campaign}</span>,
      },
      {
        accessorKey: 'startTime',
        header: 'Call Received',
        cell: ({ row }) => (
          <span className="text-gray-600 dark:text-gray-300">
            {moment(row.original.startTime).format('DD-MMM-YYYY HH:mm:ss A')}
          </span>
        ),
      },
      {
        accessorKey: 'anstime',
        header: 'Call Answered',
        cell: ({ row }) => (
          <span className="text-gray-600 dark:text-gray-300">
            {row.original.anstime ? moment(row.original.anstime).format('DD-MMM-YYYY HH:mm:ss A') : '-'}
          </span>
        ),
      },
      {
        accessorKey: 'hanguptime',
        header: 'Call Disconnected',
        cell: ({ row }) => (
          <span className="text-gray-600 dark:text-gray-300">
            {row.original.hanguptime ? moment(row.original.hanguptime).format('DD-MMM-YYYY HH:mm:ss A') : '-'}
          </span>
        ),
      },
      {
        accessorKey: 'duration',
        header: 'Duration',
        cell: ({ row }) => (
          <span className="text-gray-700 dark:text-gray-200">
            {row.original.hanguptime && row.original.startTime
              ? moment.utc((row.original.hanguptime - row.original.startTime) * 1000).format('HH:mm:ss')
              : '00:00:00'}
          </span>
        ),
      },
      {
        accessorKey: 'Type',
        header: 'Type',
        cell: ({ row }) => (
          <div>
            {row.original.Type === 'incoming' ? (
              <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs">Incoming</span>
            ) : row.original.Type === 'manualoutgoing' ? (
              <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs">Manual Outgoing</span>
            ) : (
              '-'
            )}
          </div>
        ),
      },
      {
        accessorKey: 'Disposition',
        header: 'Disposition',
        cell: ({ row }) => (
          <span className="text-gray-700 dark:text-gray-200">{row.original.Disposition || 'No Disposition'}</span>
        ),
      },
      {
        accessorKey: 'listen',
        header: 'Listen',
        disableSorting: true,
        cell: ({ row }) => (
          <button
            onClick={() => handlePlayAudio(row.original.bridgeID)}
            disabled={!row.original.bridgeID}
            className={`p-2 rounded transition-colors ${
              row.original.bridgeID
                ? 'bg-green-500 text-white hover:bg-green-600'
                : 'bg-gray-400 text-gray-200 cursor-not-allowed'
            }`}
          >
            <Headphones size={16} />
          </button>
        ),
      },
    ],
    [handlePlayAudio]
  );

  return (
    <div>
      {/* Header Controls */}
      <div className="flex justify-between flex-wrap mb-4 items-center">
        <div className="flex items-center gap-x-2">
          <button
            onClick={handleDownloadCSV}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded flex items-center gap-2 shadow"
          >
            <Download size={16} />
            <span className="hidden xs:inline">Download CSV</span>
          </button>
          <button
            onClick={handleDownloadPDF}
            disabled={isPdfLoading}
            className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded flex items-center gap-2 shadow"
          >
            <FileText size={16} />
            <span className="hidden xs:inline">
              {isPdfLoading ? <Loader2 className="animate-spin w-4 h-4" /> : 'Download PDF'}
            </span>
          </button>
        </div>

        <DateRangePicker onDateChange={handleDateRangeChange} initialStartDate={startDate} initialEndDate={endDate} />
      </div>

      {/* Audio Player */}
      <AudioPlayer
        audioUrl={currentAudioUrl}
        bridgeId={currentBridgeId}
        isOpen={isAudioPlayerOpen}
        onClose={() => setIsAudioPlayerOpen(false)}
      />

      {/* Data Table */}
      {loading ? (
        <div className="py-10 text-center">
          <Loader2 className="animate-spin w-8 h-8 mx-auto text-blue-500" />
        </div>
      ) : (
        <DataTable data={callDetails} columns={columns} searchPlaceholder="Search Calls Logs..." />
      )}
    </div>
  );
}
