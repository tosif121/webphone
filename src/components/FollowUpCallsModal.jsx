import { useState, useEffect, useCallback } from 'react';
import { Phone, Clock, PhoneForwarded } from 'lucide-react';
import moment from 'moment';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from './ui/button';
import axios from 'axios';

const TABS = [
  { key: 'upcoming', label: 'Pending' },
  { key: 'complete', label: 'Complete' },
];

const FollowUpCallsModal = ({ followUpDispoes, setCallAlert, username, scheduleCallsLength }) => {
  const [activeTab, setActiveTab] = useState('upcoming');
  const [upcomingCalls, setUpcomingCalls] = useState([]);
  const [completeCalls, setCompleteCalls] = useState([]);
  const [loadingCaller, setLoadingCaller] = useState(null);

  useEffect(() => {
    const now = new Date();
    const processed = (followUpDispoes || [])
      .filter((item) => item.date && item.time)
      .map((item) => {
        const dateTimeStr = `${item.date} ${item.time}`;
        const callTime = moment(dateTimeStr, 'YYYY-MM-DD hh:mm A').toDate();
        const isAlert = now >= new Date(callTime.getTime() - 5 * 60 * 1000) && now <= callTime;
        return {
          ...item,
          callTime,
          id: `${item.date}-${item.time}-${item.comment || 'call'}`,
          isAlert,
        };
      });

    setUpcomingCalls(processed.filter((item) => item.callTime >= now));
    setCompleteCalls(processed.filter((item) => item.callTime < now));
  }, [followUpDispoes]);

  const formatTimeAgo = (date) => moment(date).fromNow();
  const formatDateTime = (date) => moment(date).format('MMM DD, YYYY • hh:mm A');

  const initiateCall = useCallback(
    async (caller) => {
      try {
        const cleanPhoneNumber = caller?.replace(/\s+/g, '') || '';

        const response = await axios.post(`${window.location.origin}/dialmissedcall`, {
          caller: username,
          receiver: cleanPhoneNumber,
        });
        setCallAlert(false);
      } catch (error) {
        console.error('Error:', error);
        toast.error('Request failed. Please try again.');
      }
    },
    [username]
  );

  return (
    <Dialog open={true} onOpenChange={setCallAlert}>
      <DialogContent className="max-w-lg w-full p-0 border-none bg-transparent shadow-none flex items-center justify-center">
        <div className="relative overflow-hidden rounded-2xl border border-border bg-card/95 shadow-2xl backdrop-blur-md w-full">
          <DialogHeader>
            <DialogTitle>
              <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-lg">
                      <PhoneForwarded className="text-primary-foreground" size={18} />
                    </div>
                    <div className="absolute -top-3 -right-3 flex items-center justify-center min-w-6 w-max h-6 bg-destructive text-white rounded-full text-xs font-bold shadow-md border-2 border-background">
                      {scheduleCallsLength}
                    </div>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Follow-up Calls</h2>
                  </div>
                </div>
              </div>
            </DialogTitle>
          </DialogHeader>
          {/* Tabs */}
          <div className="flex border-b border-border bg-muted/30">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                className={`flex-1 py-3 text-sm font-semibold border-b-2 transition-colors
                  ${activeTab === tab.key
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                  }
                `}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
          {/* Tab Content */}
          <div className="relative max-h-[calc(100vh-230px)] overflow-y-auto p-6 bg-card/90">
            {activeTab === 'upcoming' ? (
              upcomingCalls.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 border border-primary/20">
                    <Clock className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-foreground">All caught up!</h3>
                  <p className="text-sm text-muted-foreground">No upcoming calls scheduled</p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {upcomingCalls.map((call) => (
                    <li
                      key={call.id}
                      className={`group relative overflow-hidden rounded-lg border border-border bg-card p-3 shadow-sm transition-all duration-300 hover:bg-accent hover:border-accent
                      ${call.isAlert
                          ? 'ring-2 ring-green-400 animate-pulse animate-duration-700 bg-green-50/80 dark:bg-green-900/30 dark:ring-green-500'
                          : 'dark:bg-card/80'
                        }
                    `}
                    >
                      <div className="relative flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-foreground text-sm mb-1 truncate">
                                {call.comment || 'Follow-up Call'}
                              </div>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  <span>{formatTimeAgo(call.callTime)}</span>
                                </div>
                                <span>{formatDateTime(call.callTime)}</span>
                                {(call.user && <div>By: {call.user}</div>) || ''}
                              </div>
                              {call.phoneNumber && (
                                <div className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-xs rounded-md border border-blue-200 dark:border-blue-800">
                                  <Phone className="h-3 w-3" />
                                  <span className="font-mono">{call.phoneNumber}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <Button
                          size="icon"
                          className={`w-8 h-8 rounded-full text-white shadow-md ml-2
                          ${call.isAlert
                              ? 'bg-green-600 dark:bg-green-700 animate-bounce'
                              : 'bg-green-600 hover:bg-green-700 focus-visible:ring-green-500 dark:bg-green-700 dark:hover:bg-green-800'
                            }
                        `}
                          onClick={() => initiateCall(call.phoneNumber)}
                          disabled={!call.phoneNumber}
                          aria-label={`Call ${call.phoneNumber}`}
                        >
                          <Phone className="h-4 w-4" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )
            ) : completeCalls.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 border border-primary/20">
                  <Clock className="h-8 w-8 text-primary" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">No completed calls</h3>
              </div>
            ) : (
              <ul className="space-y-2">
                {completeCalls.map((call) => (
                  <li
                    key={call.id}
                    className="group relative overflow-hidden rounded-lg border border-border bg-card p-3 shadow-sm transition-all duration-300 hover:bg-accent hover:border-accent"
                  >
                    <div className="relative flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-foreground text-sm mb-1 truncate">
                              {call.comment || 'Follow-up Call'}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>{formatTimeAgo(call.callTime)}</span>
                              </div>
                              <span>{formatDateTime(call.callTime)}</span>
                              {(call.user && <div>By: {call.user}</div>) || ''}
                            </div>
                            {call.phoneNumber && (
                              <div className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-xs rounded-md border border-blue-200 dark:border-blue-800">
                                <Phone className="h-3 w-3" />
                                <span className="font-mono">{call.phoneNumber}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FollowUpCallsModal;
