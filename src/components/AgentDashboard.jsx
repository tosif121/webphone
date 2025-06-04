import React, { useEffect, useState } from 'react';
import { Phone, PhoneOff, User, Clock, BarChart2, List, TrendingUp, Activity, Timer, Eye } from 'lucide-react';
import axios from 'axios';

import {
  calculateActivityDurations,
  calculateCallStatistics,
  ActivityChart,
  DispositionChart,
} from '@/utils/agent-dashboard';
import AgentCallData from './AgentCallData';
import { Dialog, DialogContent } from './ui/dialog';

const statusColor = {
  INUSE: 'bg-gradient-to-r from-emerald-400 to-green-500 text-white shadow-lg shadow-green-500/25',
  NOT_INUSE: 'bg-gradient-to-r from-blue-400 to-indigo-500 text-white shadow-lg shadow-blue-500/25',
  UNAVAILABLE: 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-lg shadow-orange-500/25',
  Disposition: 'bg-gradient-to-r from-purple-400 to-pink-500 text-white shadow-lg shadow-purple-500/25',
  RINGING: 'bg-gradient-to-r from-orange-400 to-red-500 text-white shadow-lg shadow-orange-500/25',
  default: 'bg-gradient-to-r from-gray-400 to-slate-500 text-white shadow-lg shadow-gray-500/25',
};

const StatusBadge = ({ status }) => (
  <div
    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-300 hover:scale-105 ${
      statusColor[status] || statusColor.default
    }`}
  >
    <div className="w-2 h-2 bg-white/80 rounded-full mr-2 animate-pulse"></div>
    {status}
  </div>
);

const MetricCard = ({ metric, index }) => (
  <div
    className="group relative overflow-hidden rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-white/20 dark:border-slate-700/30 shadow-xl hover:shadow transition-all duration-500 hover:scale-105 hover:-translate-y-1"
    style={{ animationDelay: `${index * 0.1}s` }}
  >
    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent dark:from-slate-900/30 dark:to-slate-900/0 pointer-events-none"></div>
    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-purple-500/10 dark:from-blue-900/10 dark:to-purple-900/10 rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-700"></div>
    <div className="relative p-6">
      <div className="flex items-center justify-between mb-4">
        <div
          className={`p-3 rounded-xl bg-gradient-to-br ${metric.bgGradient} shadow-lg group-hover:scale-110 transition-transform duration-300`}
        >
          {metric.icon}
        </div>
        <div className="text-right">
          <div
            className={`text-2xl font-bold bg-gradient-to-r ${metric.textGradient} bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-300`}
          >
            {metric.value}
          </div>
        </div>
      </div>
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-white transition-colors duration-300">
        {metric.title}
      </h3>
    </div>
  </div>
);

export default function AgentDashboard() {
  const [incomingCallData, setIncomingCallData] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    summary: {
      totalCalls: 0,
      dropCalls: 0,
      myCalls: 0,
      avgDuration: 0,
    },
    activityData: [],
    timeStats: {
      waitingForCall: '0h 0m 0s',
      onCall: '0h 0m 0s',
      break: '0h 0m 0s',
      disposition: '0h 0m 0s',
      totalLoginTime: '0h 0m 0s',
    },
    chartData: [],
    summaryCalls: [],
  });
  const [loading, setLoading] = useState(true);
  const [showActivityModal, setShowActivityModal] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const fetchData = async () => {
      try {
        const tokenData = JSON.parse(localStorage.getItem('token'));
        const response = await axios.post(
          'https://esamwad.iotcom.io/agentDashboardData',
          { user: tokenData.userData.userid },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${tokenData.token}`,
            },
          }
        );
        if (isMounted && response.data) {
          processData(response.data);
        }
      } catch (err) {
        // toast.error('Failed to fetch dashboard data');
        console.error(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    return () => {
      isMounted = false;
    };
  }, []);

  const processData = (rawData) => {
    if (!rawData.DataArray?.length) return;

    const filterData = rawData.DataArray.filter((a) => a.Status !== 'RINGING' && a.Status !== 'RINGINUSE');
    const activityDurations = calculateActivityDurations(filterData);
    const callStats = calculateCallStatistics(rawData.todayCalls || []);

    setDashboardData({
      summary: callStats,
      activityData: filterData,
      timeStats: activityDurations,
      chartData: generateChartData(filterData),
      summaryCalls: rawData.todayCalls || [],
    });
  };

  const metrics = [
    {
      title: 'Total Calls',
      value: dashboardData.summary.totalCalls,
      icon: <Phone className="w-6 h-6 text-white" />,
      bgGradient: 'from-blue-500 to-cyan-500',
      textGradient: 'from-blue-600 to-cyan-600',
    },
    {
      title: 'Drop Calls',
      value: dashboardData.summary.dropCalls,
      icon: <PhoneOff className="w-6 h-6 text-white" />,
      bgGradient: 'from-red-500 to-pink-500',
      textGradient: 'from-red-600 to-pink-600',
    },
    {
      title: 'My Calls',
      value: dashboardData.summary.myCalls,
      icon: <User className="w-6 h-6 text-white" />,
      bgGradient: 'from-emerald-500 to-green-500',
      textGradient: 'from-emerald-600 to-green-600',
    },
    {
      title: 'Avg Duration',
      value: `${dashboardData.summary.avgDuration}s`,
      icon: <Clock className="w-6 h-6 text-white" />,
      bgGradient: 'from-purple-500 to-indigo-500',
      textGradient: 'from-purple-600 to-indigo-600',
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-blue-200 dark:border-slate-700 rounded-full animate-spin"></div>
          <div className="absolute top-0 left-0 w-20 h-20 border-4 border-blue-600 dark:border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto space-y-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Agent Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-300">Real-time performance metrics and activity tracking</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <MetricCard key={index} metric={metric} index={index} />
        ))}
      </div>

      {/* Activity Stats Section */}
      <div className="bg-white/70 dark:bg-slate-800/80 backdrop-blur-sm rounded-3xl border border-white/20 dark:border-slate-700/30 shadow overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 dark:from-indigo-800 dark:to-purple-900 p-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 dark:bg-slate-700/40 rounded-xl">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  {incomingCallData ? 'Call Logs' : 'Activity Statistics'}
                </h2>
                <p className="text-indigo-100 dark:text-indigo-200 text-sm">Track your daily performance</p>
              </div>
            </div>
            <button
              onClick={() => setIncomingCallData(!incomingCallData)}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 dark:bg-slate-700/40 hover:bg-white/30 dark:hover:bg-slate-700/60 text-white rounded-xl transition-all duration-300 hover:scale-105"
            >
              {incomingCallData ? (
                <>
                  <List className="w-4 h-4" />
                  Activity Stats
                </>
              ) : (
                <>
                  <BarChart2 className="w-4 h-4" />
                  Call Logs
                </>
              )}
            </button>
          </div>
        </div>

        <div className="p-6">
          {incomingCallData ? (
            <AgentCallData />
          ) : (
            <div className="overflow-x-auto">
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6">
                {Object.entries(dashboardData.timeStats)
                  .slice(0, -1)
                  .map(([key, value], index) => (
                    <div
                      key={key}
                      className="text-center p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-800 dark:to-slate-900 rounded-xl hover:shadow-lg transition-all duration-300"
                    >
                      <div className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-1">{value}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-300 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </div>
                    </div>
                  ))}
              </div>

              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-emerald-900 dark:to-green-900 rounded-xl p-4 border border-green-200 dark:border-emerald-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Timer className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <span className="font-semibold text-green-800 dark:text-green-200">Total Login Time</span>
                  </div>
                  <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                    {dashboardData.timeStats.totalLoginTime}
                  </div>
                  <button
                    onClick={() => setShowActivityModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 dark:bg-emerald-700 hover:bg-green-700 dark:hover:bg-emerald-800 text-white rounded-lg transition-all duration-300 hover:scale-105"
                  >
                    <Eye className="w-4 h-4" />
                    View Details
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {!incomingCallData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white/70 dark:bg-slate-800/80 backdrop-blur-sm rounded-3xl border border-white/20 dark:border-slate-700/30 shadow overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 dark:from-blue-900 dark:to-cyan-900 p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 dark:bg-slate-700/40 rounded-xl">
                  <BarChart2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Activity Distribution</h3>
                  <p className="text-blue-100 dark:text-cyan-200 text-sm">Daily activity breakdown</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <ActivityChart data={dashboardData.chartData} />
            </div>
          </div>

          <div className="bg-white/70 dark:bg-slate-800/80 backdrop-blur-sm rounded-3xl border border-white/20 dark:border-slate-700/30 shadow overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 dark:from-purple-900 dark:to-pink-900 p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 dark:bg-slate-700/40 rounded-xl">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Disposition Chart</h3>
                  <p className="text-purple-100 dark:text-pink-200 text-sm">Call outcome analysis</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <DispositionChart callsData={dashboardData.summaryCalls} />
            </div>
          </div>
        </div>
      )}

      {/* Activity Modal */}
      <Dialog open={showActivityModal} onOpenChange={setShowActivityModal}>
        <DialogContent className="max-w-4xl w-full p-0 overflow-hidden rounded-2xl border-0">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 dark:from-indigo-800 dark:to-purple-900 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 dark:bg-slate-700/40 rounded-xl">
                    <List className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Detailed Activity Log</h2>
                    <p className="text-indigo-100 dark:text-indigo-200">Complete activity timeline</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <div className="space-y-4">
                {dashboardData.activityData.map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors duration-200"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 dark:from-blue-900 dark:to-purple-900 rounded-full flex items-center justify-center">
                        <Activity className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-800 dark:text-gray-100">{activity.Type}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-300">
                          {new Date(activity.Time).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <StatusBadge status={activity.Status} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
