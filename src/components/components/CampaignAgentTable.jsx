import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CommonTable from './table/CommonTable';

const StatusBadge = ({ status }) => {
  const getStyles = (statusValue) => {
    const normalizedStatus = (statusValue || '').toLowerCase().trim();

    switch (normalizedStatus) {
      case 'approved':
        return {
          backgroundColor: '#22c55e',
          color: '#ffffff',
        };
      case 'pending':
        return {
          backgroundColor: '#eab308',
          color: '#ffffff',
        };
      case 'rejected':
        return {
          backgroundColor: '#ef4444',
          color: '#ffffff',
        };
      default:
        return {
          backgroundColor: '#6b7280',
          color: '#ffffff',
        };
    }
  };

  return (
    <div className="px-3 py-1 rounded-full text-sm font-medium inline-block" style={getStyles(status)}>
      {status ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase() : 'Unknown'}
    </div>
  );
};

const CampaignAgentTable = ({ button }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/campaign-agent');
        if (response.data.status) {
          const transformedData = response.data.data.map((item) => ({
            campaignName: item.data.campaignName,
            formDetails: Object.entries(item.data.formData)
              .filter(([key]) => key !== 'status')
              .map(([key, value]) => `${key}: ${value}`)
              .join(', '),
            status: item.data.formData.status,
          }));
          setData(transformedData);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const columns = [
    {
      label: 'Campaign Name',
      accessor: 'campaignName',
    },
    {
      label: 'Form Details',
      accessor: 'formDetails',
    },
    {
      label: 'Status',
      accessor: 'status',
      render: (value) => <StatusBadge status={value} />,
    },
  ];

  return <CommonTable data={data} columns={columns} loading={loading} button={button} />;
};

export default CampaignAgentTable;
