import React from 'react';
import { Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// Helper function to convert milliseconds to "h:m:s" format
export const msToHMS = (duration) => {
  const seconds = Math.floor((duration / 1000) % 60);
  const minutes = Math.floor((duration / (1000 * 60)) % 60);
  const hours = Math.floor((duration / (1000 * 60 * 60)) % 24);
  return `${hours}h ${minutes}m ${seconds}s`;
};

// Calculate activity durations from filtered data
export const calculateActivityDurations = (filterData) => {
  const summary = {
    waitingForCall: 0,
    onCall: 0,
    break: 0,
    disposition: 0,
    totalLoginTime: 0,
  };

  // Process the time differences between consecutive events
  for (let i = 0; i < filterData.length - 1; i++) {
    const startTime = new Date(filterData[i].Time).getTime();
    const endTime = new Date(filterData[i + 1].Time).getTime();
    const duration = endTime - startTime;

    // Determine the activity type based on status
    const status = filterData[i].Status;
    if (status === 'NOT_INUSE') {
      summary.waitingForCall += duration;
    } else if (status === 'INUSE') {
      summary.onCall += duration;
    } else if (status === 'Disposition') {
      summary.disposition += duration;
    } else if (status === 'UNAVAILABLE') {
      summary.break += duration;
    }
  }

  // Calculate total login time
  summary.totalLoginTime = summary.waitingForCall + summary.onCall + summary.disposition;

  // Convert all durations to HMS format
  return {
    waitingForCall: msToHMS(summary.waitingForCall),
    onCall: msToHMS(summary.onCall),
    break: msToHMS(summary.break),
    disposition: msToHMS(summary.disposition),
    totalLoginTime: msToHMS(summary.totalLoginTime),
  };
};

// Calculate call statistics
export const calculateCallStatistics = (todayCalls) => {
  const user = JSON.parse(localStorage.getItem('token'))?.userData?.userid;

  const stats = {
    totalCalls: todayCalls.length,
    dropCalls: todayCalls.filter((call) => call.Type === 'incoming' && !call.anstime).length,
    myCalls: todayCalls.filter((call) => call.agent === user).length,
    avgDuration: 0,
  };

  // Calculate average duration for answered calls
  const answeredCalls = todayCalls.filter((call) => call.Type === 'incoming' && call.anstime && call.hanguptime);

  if (answeredCalls.length > 0) {
    const totalDuration = answeredCalls.reduce((sum, call) => sum + (call.hanguptime - call.anstime), 0);
    stats.avgDuration = Math.round(totalDuration / (1000 * answeredCalls.length));
  }

  return stats;
};

// Generate chart data
export const generateChartData = (filterData) => {
  // Activity Distribution Chart Data
  const activityDistribution = filterData.reduce((acc, curr) => {
    const hour = new Date(curr.Time).getHours();
    if (!acc[hour]) {
      acc[hour] = { INUSE: 0, NOT_INUSE: 0, Disposition: 0, UNAVAILABLE: 0 };
    }
    acc[hour][curr.Status] = (acc[hour][curr.Status] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(activityDistribution).map(([hour, stats]) => ({
    name: `${hour}:00`,
    onCall: stats.INUSE || 0,
    waiting: stats.NOT_INUSE || 0,
    disposition: stats.Disposition || 0,
    break: stats.UNAVAILABLE || 0,
  }));
};

// COLORS for pie slices
const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#a28fd0', '#f98d8d'];

// 📊 1. ACTIVITY DISTRIBUTION PIE CHART
export const ActivityChart = ({ data, className = '' }) => {
  const summary = {
    INUSE: 0,
    NOT_INUSE: 0,
    Disposition: 0,
    UNAVAILABLE: 0,
  };

  // Aggregate all status counts
  data.forEach((item) => {
    summary.INUSE += item.onCall || 0;
    summary.NOT_INUSE += item.waiting || 0;
    summary.Disposition += item.disposition || 0;
    summary.UNAVAILABLE += item.break || 0;
  });

  const pieData = [
    { name: 'On Call', value: summary.INUSE },
    { name: 'Waiting', value: summary.NOT_INUSE },
    { name: 'Disposition', value: summary.Disposition },
    { name: 'Break', value: summary.UNAVAILABLE },
  ];

  return (
    <div className={`w-full h-80 ${className}`}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={pieData} cx="50%" cy="50%" outerRadius={100} label dataKey="value" nameKey="name">
            {pieData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={10} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export const DispositionChart = ({ callsData }) => {
  const dispositionCounts = callsData.reduce((acc, call) => {
    const disposition = call.Disposition || 'Unknown';
    acc[disposition] = (acc[disposition] || 0) + 1;
    return acc;
  }, {});

  const chartData = Object.entries(dispositionCounts).map(([name, value]) => ({
    name,
    value,
  }));

  const formatTooltip = (value, name) => [`${value}`, `${name}`];
  const renderLabel = ({ name, value }) => `${name}: ${value}`;

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={chartData} cx="50%" cy="50%" outerRadius={100} label={renderLabel} dataKey="value" nameKey="name">
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={formatTooltip} />
          <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={10} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
