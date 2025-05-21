import React, { useEffect, useState } from 'react';
import axios from 'axios';
import moment from 'moment';
import { FiDownload, FiFileText, FiHeadphones } from 'react-icons/fi';
import CommonTable from './table/CommonTable';
import AudioPlayer from './AudioPlayer';
import 'rsuite/dist/rsuite.min.css';
import toast from 'react-hot-toast';
import maskPhoneNumber from '../hooks/maskPhoneNumber';

const AgentCallData = () => {
  const [callDetails, setCallDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(moment().subtract(24, 'hours').format('YYYY-MM-DD'));
  const [endDate, setEndDate] = useState(moment().format('YYYY-MM-DD'));
  const [currentAudioUrl, setCurrentAudioUrl] = useState('');
  const [currentBridgeId, setCurrentBridgeId] = useState('');
  const [isAudioPlayerOpen, setIsAudioPlayerOpen] = useState(false);
  const [isPdfLoading, setIsPdfLoading] = useState(false);

  useEffect(() => {
    if (startDate && endDate) {
      fetchCallData();
    }
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
    try {
      const tokenDetails = getTokenDetails();
      if (!tokenDetails) return;

      const payload = {
        admin: tokenDetails.adminUser,
        startdate: startDate,
        enddate: endDate,
      };

      const { data } = await axios.post(`${window.location.origin}/agentcallData`, payload, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenDetails.token}`,
        },
      });

      setCallDetails(data.result);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching call details:', error);
      setLoading(false);
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

  const columns = [
    {
      label: 'Caller',
      accessor: 'Caller',
      render: (value) => maskPhoneNumber(value),
    },
    {
      label: 'Campaign',
      accessor: 'campaign',
    },
    {
      label: 'Call Received',
      accessor: 'startTime',
      render: (value) => moment(value).format('DD-MMM-YYYY HH:mm:ss A'),
    },
    {
      label: 'Call Answered',
      accessor: 'anstime',
      render: (value) => (value ? moment(value).format('DD-MMM-YYYY HH:mm:ss A') : '-'),
    },
    {
      label: 'Call Disconnected',
      accessor: 'hanguptime',
      render: (value) => (value ? moment(value).format('DD-MMM-YYYY HH:mm:ss A') : '-'),
    },
    {
      label: 'Duration',
      accessor: 'duration',
      render: (value, row) => {
        if (!row?.hanguptime || !row?.startTime) return '-';
        const duration = Math.floor((row.hanguptime - row.startTime) / 1000);
        return duration > 0 ? moment.utc(duration * 1000).format('HH:mm:ss') : '00:00:00';
      },
    },
    {
      label: 'Type',
      accessor: 'Type',
      render: (value) => {
        if (value === 'incoming') {
          return <span className="bg-primary text-white px-3 py-1 rounded-full text-sm">Incoming</span>;
        } else if (value === 'manualoutgoing') {
          return (
            <div className="flex space-x-2">
              <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm">Manual Outgoing</span>
            </div>
          );
        } else {
          return '-';
        }
      },
    },
    {
      label: 'Disposition',
      accessor: 'Disposition',
      render: (value) => value || 'No Disposition',
    },
    {
      label: 'Listen',
      accessor: 'bridgeID',
      render: (value) => (
        <button
          onClick={() => handlePlayAudio(value)}
          disabled={!value}
          className={`p-2 rounded transition-colors ${
            value ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-gray-400 text-gray-200 cursor-not-allowed'
          }`}
        >
          <FiHeadphones />
        </button>
      ),
    },
  ];

  const handlePlayAudio = (bridgeID) => {
    const audioSource = `${window.location.origin}/recording${bridgeID}.wav`;
    setCurrentAudioUrl(audioSource);
    setCurrentBridgeId(bridgeID);
    setIsAudioPlayerOpen(true);
  };

  return (
    <div className="overflow-x-auto mt-4">
      <div className="flex justify-end gap-4 mb-2">
        <button
          onClick={handleDownloadCSV}
          className="bg-blue-500 text-white px-4 py-2 rounded flex items-center gap-2"
        >
          <FiDownload /> Download CSV
        </button>
        <button
          onClick={handleDownloadPDF}
          disabled={isPdfLoading}
          className="bg-red-500 text-white px-4 py-2 rounded flex items-center gap-2"
        >
          <FiFileText /> {isPdfLoading ? 'Generating...' : 'Download PDF'}
        </button>
      </div>

      <AudioPlayer
        audioUrl={currentAudioUrl}
        bridgeId={currentBridgeId}
        isOpen={isAudioPlayerOpen}
        onClose={() => setIsAudioPlayerOpen(false)}
      />
      <CommonTable
        data={callDetails}
        columns={columns}
        loading={loading}
        setStartDate={setStartDate}
        setEndDate={setEndDate}
      />
    </div>
  );
};

export default AgentCallData;
