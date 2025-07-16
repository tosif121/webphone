import React, { useEffect, useState } from 'react';
import { Phone, PhoneOff, User, Clock, BarChart2, List, TrendingUp, Activity, Timer, Eye, X } from 'lucide-react';
import axios from 'axios';

import {
  calculateActivityDurations,
  calculateCallStatistics,
  ActivityChart,
  DispositionChart,
  generateChartData,
} from '@/utils/agent-dashboard';
import AgentCallData from './AgentCallData';
import { Dialog, DialogContent } from './ui/dialog';
import { Button } from './ui/button';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';

// Status badge color mapping using shadcn tokens
const statusColor = {
  INUSE: 'bg-emerald-500 text-white shadow-emerald-500/25',
  NOT_INUSE: 'bg-blue-500 text-white shadow-blue-500/25',
  UNAVAILABLE: 'bg-amber-500 text-white shadow-amber-500/25',
  Disposition: 'bg-indigo-500 text-white shadow-indigo-500/25',
  RINGING: 'bg-red-500 text-white shadow-red-500/25',
  default: 'bg-slate-500 text-white shadow-slate-500/25',
};

const StatusBadge = ({ status }) => (
  <div
    className={`inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-300 hover:scale-105 shadow-lg ${
      statusColor[status] || statusColor.default
    }`}
  >
    <div className="w-1.5 h-1.5 bg-white/90 rounded-full mr-2 animate-pulse"></div>
    <span className="truncate">{status}</span>
  </div>
);

const MetricCard = ({ metric, index }) => (
  <div
    className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-sm border border-border/50 shadow hover:shadow-xl transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1 animate-fade-in-up"
    style={{ animationDelay: `${index * 0.1}s` }}
  >
    <div className="relative p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
        <div className="p-2.5 sm:p-3 rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/25 group-hover:scale-110 group-hover:shadow-primary/40 transition-all duration-300">
          {metric.icon}
        </div>
        <div className="text-left sm:text-right">
          <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-primary group-hover:scale-105 transition-transform duration-300 leading-none">
            {metric.value}
          </div>
        </div>
      </div>
      <h3 className="text-xs sm:text-sm font-semibold text-muted-foreground group-hover:text-foreground transition-colors duration-300 leading-tight">
        {metric.title}
      </h3>
    </div>
  </div>
);

const TimeStatCard = ({ label, value, index }) => (
  <div
    className="flex flex-col items-center p-3 sm:p-4 bg-gradient-to-br from-muted/80 to-muted/60 rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-300 animate-fade-in-up border border-border/30"
    style={{ animationDelay: `${index * 0.05}s` }}
  >
    <div className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground mb-1 text-center">{value}</div>
    <div className="text-xs sm:text-sm text-muted-foreground text-center capitalize leading-tight">
      {label.replace(/([A-Z])/g, ' $1').trim()}
    </div>
  </div>
);

export default function AgentDashboard() {
  const [incomingCallData, setIncomingCallData] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    summary: { totalCalls: 0, dropCalls: 0, myCalls: 0, avgDuration: 0 },
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
          `https://esamwad.iotcom.io/agentDashboardData`,
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
      icon: <Phone className="w-5 h-5 sm:w-6 sm:h-6" />,
    },
    {
      title: 'Drop Calls',
      value: dashboardData.summary.dropCalls,
      icon: <PhoneOff className="w-5 h-5 sm:w-6 sm:h-6" />,
    },
    {
      title: 'My Calls',
      value: dashboardData.summary.myCalls,
      icon: <User className="w-5 h-5 sm:w-6 sm:h-6" />,
    },
    {
      title: 'Avg Duration',
      value: `${dashboardData.summary.avgDuration}s`,
      icon: <Clock className="w-5 h-5 sm:w-6 sm:h-6" />,
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="relative">
          <div className="w-16 h-16 sm:w-20 sm:h-20 border-4 border-muted rounded-full animate-spin"></div>
          <div className="absolute top-0 left-0 w-16 h-16 sm:w-20 sm:h-20 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Activity className="w-6 h-6 sm:w-8 sm:h-8 text-primary animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-8">
        <div className="text-center md:text-start">
          <h1 className="text-2xl font-bold text-primary mb-2">Agent Dashboard</h1>
          <p className="text-sm text-muted-foreground">Real-time performance metrics and activity tracking</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((metric, index) => (
            <MetricCard key={index} metric={metric} index={index} />
          ))}
        </div>

        <div className="bg-card/90 rounded-2xl border border-border/50 shadow overflow-hidden">
          <div className="bg-muted/80 p-4">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-xl border border-primary/20">
                  <Activity className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">
                    {incomingCallData ? 'Call Logs' : 'Activity Statistics'}
                  </h2>
                  <p className="text-xs text-muted-foreground">Track your daily performance</p>
                </div>
              </div>
              <Button
                onClick={() => setIncomingCallData(!incomingCallData)}
                variant="default"
                className="flex items-center gap-2 hover:scale-105 transition-all duration-300 shadow-md justify-center"
              >
                {incomingCallData ? (
                  <>
                    <List className="w-4 h-4" />
                    <span className="text-sm">Activity Stats</span>
                  </>
                ) : (
                  <>
                    <BarChart2 className="w-4 h-4" />
                    <span className="text-sm">Call Logs</span>
                  </>
                )}
              </Button>
            </div>
          </div>
          <div className="p-4">
            {incomingCallData ? (
              <AgentCallData />
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                  {Object.entries(dashboardData.timeStats)
                    .slice(0, -1)
                    .map(([key, value], index) => (
                      <TimeStatCard key={key} label={key} value={value} index={index} />
                    ))}
                </div>
                <div className="bg-secondary/80 rounded-xl p-4 border border-secondary/30 shadow">
                  <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-secondary-foreground/10 rounded-xl">
                        <Timer className="w-5 h-5 text-secondary-foreground" />
                      </div>
                      <span className="font-semibold text-secondary-foreground text-sm">Total Login Time</span>
                    </div>
                    <div className="text-xl font-bold text-secondary-foreground">
                      {dashboardData.timeStats.totalLoginTime}
                    </div>
                    <Button
                      onClick={() => setShowActivityModal(true)}
                      variant="default"
                      size="sm"
                      className="flex items-center gap-2 hover:scale-105 transition-all duration-300 shadow-md justify-center"
                    >
                      <Eye className="w-4 h-4" />
                      <span className="text-sm">View Details</span>
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {!incomingCallData && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="bg-card/90 rounded-2xl border border-border/50 shadow overflow-hidden">
              <div className="bg-muted/80 p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-xl border border-primary/20">
                    <BarChart2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">Activity Distribution</h3>
                    <p className="text-xs text-muted-foreground">Daily activity breakdown</p>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <div className="h-64">
                  <ActivityChart data={dashboardData.chartData} />
                </div>
              </div>
            </div>
            <div className="bg-card/90 rounded-2xl border border-border/50 shadow overflow-hidden">
              <div className="bg-muted/80 p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-xl border border-primary/20">
                    <TrendingUp className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">Disposition Chart</h3>
                    <p className="text-xs text-muted-foreground">Call outcome analysis</p>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <div className="h-64">
                  <DispositionChart callsData={dashboardData.summaryCalls} />
                </div>
              </div>
            </div>
          </div>
        )}

        <Dialog open={showActivityModal} onOpenChange={setShowActivityModal}>
          <DialogContent className="max-w-4xl w-full p-0 overflow-hidden rounded-2xl border-0">
            <div className="bg-card/95 rounded-2xl shadow-2xl">
              <div className="bg-muted/80 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-xl border border-primary/20">
                      <List className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-foreground">Detailed Activity Log</h2>
                      <p className="text-xs text-muted-foreground">Complete activity timeline</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-4 max-h-[60vh] overflow-y-auto">
                <div className="space-y-3">
                  {dashboardData.activityData.map((activity, index) => (
                    <div
                      key={index}
                      className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 p-3 bg-muted/60 rounded-xl hover:bg-accent/60 transition-all duration-300 hover:scale-[1.02] border border-border/30"
                    >
                      <div className="flex items-center gap-3 min-w-0 w-full">
                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg">
                          <Activity className="w-4 h-4 text-primary-foreground" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-foreground text-sm truncate">{activity.Type}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(activity.Time).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="w-full lg:w-auto flex justify-end">
                        <StatusBadge status={activity.Status} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
