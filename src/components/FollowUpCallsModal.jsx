import { useState, useEffect, useCallback } from 'react';
import { Phone, Clock, PhoneForwarded } from 'lucide-react';
import moment from 'moment';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from './ui/button';
import axios from 'axios';

const TABS = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'complete', label: 'Complete' },
];

const FollowUpCallsModal = ({ followUpDispoes, setCallAlert, username, scheduleCallsLength }) => {
  const [activeTab, setActiveTab] = useState('upcoming');
  const [upcomingCalls, setUpcomingCalls] = useState([]);
  const [completeCalls, setCompleteCalls] = useState([]);
  const [loadingCaller, setLoadingCaller] = useState(null);
  const tokenData = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const parsedData = tokenData ? JSON.parse(tokenData) : null;
  const userCampaign = parsedData?.userData?.campaign;
  const apiUrl = 'https://esamwad.iotcom.io/';

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

        const response = await axios.post(`${apiUrl}/dialmissedcall`, {
          caller: username,
          receiver: cleanPhoneNumber,
        });
        setCallAlert(false);
      } catch (error) {
        console.error('Error:', error);
        toast.error('Request failed. Please try again.');
      }
    },
    [username, userCampaign]
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
                  ${
                    activeTab === tab.key
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
                <ul className="space-y-3">
                  {upcomingCalls.map((call) => (
                    <li
                      key={call.id}
                      className={`group relative overflow-hidden rounded-xl border border-border bg-card p-4 shadow-sm transition-all duration-300 hover:bg-accent hover:border-accent
                      ${
                        call.isAlert
                          ? 'ring-2 ring-green-400 animate-pulse animate-duration-700 bg-green-50/80 dark:bg-green-900/30 dark:ring-green-500'
                          : 'dark:bg-card/80'
                      }
                    `}
                    >
                      <div className="relative flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="relative">
                              <div
                                className={`h-12 w-12 rounded-xl flex items-center justify-center shadow-md
                                ${call.isAlert ? 'bg-green-600 dark:bg-green-700' : 'bg-primary dark:bg-primary/70'}
                              `}
                              >
                                <Phone className="text-white" size={20} />
                              </div>
                            </div>
                            <div className="flex-1">
                              <div className="font-semibold text-foreground mb-1 text-base">
                                {call.comment || 'Follow-up Call'}
                              </div>
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  <span>
                                    {formatTimeAgo(call.callTime)} •{' ' + formatDateTime(call.callTime)}
                                  </span>
                                </div>
                                {call.phoneNumber && (
                                  <div className="text-xs text-muted-foreground">Phone: {call.phoneNumber}</div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        <Button
                          size="icon"
                          className={`w-10 h-10 rounded-full text-white shadow-lg
        ${
          call.isAlert
            ? 'bg-green-600 dark:bg-green-700 animate-bounce'
            : 'bg-green-600 hover:bg-green-700 focus-visible:ring-green-500 dark:bg-green-700 dark:hover:bg-green-800'
        }
      `}
                          onClick={() => initiateCall(call.phoneNumber)}
                          disabled={!call.phoneNumber}
                          aria-label={`Call ${call.phoneNumber}`}
                        >
                          <Phone className="h-8 w-8" />
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
              <ul className="space-y-3">
                {completeCalls.map((call) => (
                  <li
                    key={call.id}
                    className="group relative overflow-hidden rounded-xl border border-border bg-card p-4 shadow-sm hover:bg-accent hover:border-accent"
                  >
                    <div className="relative flex items-center justify-between">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center shadow-md">
                          <Phone className="text-accent-foreground" size={20} />
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-foreground mb-1 text-base">
                            {call.comment || 'Follow-up Call'}
                          </div>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>
                                {formatTimeAgo(call.callTime)} •{' ' + formatDateTime(call.callTime)}
                              </span>
                            </div>
                            {call.phoneNumber && (
                              <div className="text-xs text-muted-foreground">Phone: {call.phoneNumber}</div>
                            )}
                          </div>
                        </div>
                      </div>

                      <Button
                        size="icon"
                        className={`w-10 h-10 rounded-full text-white shadow-lg
                            ${
                              call.isAlert
                                ? 'bg-green-600 animate-bounce'
                                : 'bg-green-600 hover:bg-green-700 focus-visible:ring-green-500'
                            }
                          `}
                        onClick={() => initiateCall(call.phoneNumber)}
                        disabled={!call.phoneNumber}
                        aria-label={`Call ${call.phoneNumber}`}
                      >
                        <Phone className="h-8 w-8" />
                      </Button>
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
