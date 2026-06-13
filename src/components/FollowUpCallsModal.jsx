import React, { useCallback, useMemo, useState, useContext } from 'react';
import { Phone, Clock, PhoneForwarded } from 'lucide-react';
import moment from 'moment';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from './ui/button';
import axios from 'axios';
import toast from 'react-hot-toast';
import { JssipContext } from '@/context/JssipContext';

const ACTIVE_CALLBACK_STORAGE_KEY = 'activeFollowUpCallback';

const TABS = [
  { key: 'pending', label: 'Pending' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'active', label: 'Active' },
];

const resolveScheduledAt = (item = {}) => {
  const numericValue = Number(item.scheduledAt);
  if (Number.isFinite(numericValue) && numericValue > 0) {
    return String(Math.trunc(Math.abs(numericValue))).length <= 10 ? numericValue * 1000 : numericValue;
  }

  const parsedMoment = moment(
    `${item.date || ''} ${item.time || ''}`,
    ['YYYY-MM-DD hh:mm A', 'YYYY-MM-DD HH:mm'],
    true,
  );
  return parsedMoment.isValid() ? parsedMoment.valueOf() : null;
};

const FollowUpCallsModal = ({ followUpDispoes, setCallAlert, username, scheduleCallsLength, token }) => {
  const [activeTab, setActiveTab] = useState('pending');
  const [loadingCaller, setLoadingCaller] = useState(null);
  const [updatingCallbackId, setUpdatingCallbackId] = useState(null);
  const { activeFollowUpData, setActiveFollowUpData } = useContext(JssipContext);

  const authHeaders = useMemo(
    () =>
      token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {},
    [token],
  );

  const callbackBuckets = useMemo(() => {
    const now = new Date();
    return (followUpDispoes || []).reduce(
      (accumulator, item, index) => {
        let scheduledAt = resolveScheduledAt(item);
        if (!scheduledAt) {
          scheduledAt = Date.now();
        }

        const callTime = new Date(scheduledAt);
        const startOfToday = moment().startOf('day');
        const endOfToday = moment().endOf('day');
        const normalizedStatus = String(item.status || item.computedStatus || '')
          .trim()
          .toLowerCase();

        const isActive = activeFollowUpData && (item._id === activeFollowUpData.callbackId || item.id === activeFollowUpData.callbackId);

        let tab = null;

        if (isActive) {
          tab = 'active';
        } else if (normalizedStatus === 'completed') {
          return accumulator;
        } else if (moment(callTime).isBefore(startOfToday)) {
          // On the next day, only that day's scheduled follow-ups should be shown.
          return accumulator;
        } else if (moment(callTime).isBetween(startOfToday, endOfToday, null, '[]')) {
          tab = 'pending';
        } else if (moment(callTime).isAfter(endOfToday)) {
          tab = 'upcoming';
        }

        if (!tab) {
          return accumulator;
        }

        const isAlert =
          (tab === 'pending' || tab === 'upcoming') &&
          now >= new Date(callTime.getTime() - 10 * 60 * 1000) &&
          now <= callTime;

        const normalized = {
          ...item,
          id: item._id || item.id || `${scheduledAt}-${item.phoneNumber || item.contactNumber || 'callback'}-${index}`,
          callTime,
          tab,
          isAlert,
          phoneNumber: item.phoneNumber || item.contactNumber || '',
        };

        if (tab === 'pending') accumulator.pending.push(normalized);
        else if (tab === 'upcoming') accumulator.upcoming.push(normalized);
        else if (tab === 'active') accumulator.active.push(normalized);

        return accumulator;
      },
      {
        pending: [],
        upcoming: [],
        active: [],
      },
    );
  }, [followUpDispoes, activeFollowUpData]);

  const formatTimeAgo = (date) => moment(date).fromNow();
  const formatDateTime = (date) => moment(date).format('MMM DD, YYYY • hh:mm A');

  const activeCalls = callbackBuckets[activeTab] || [];
  const tabCounts = useMemo(
    () => ({
      pending: callbackBuckets.pending.length,
      upcoming: callbackBuckets.upcoming.length,
      active: callbackBuckets.active.length,
    }),
    [callbackBuckets],
  );

  const initiateCall = useCallback(
    async (callbackRecord) => {
      try {
        const cleanPhoneNumber = String(callbackRecord?.phoneNumber || '').replace(/\s+/g, '');

        if (!cleanPhoneNumber) {
          toast.error('No callback number available.');
          return;
        }

        const callbackId = callbackRecord?._id || callbackRecord?.id || null;

        setActiveFollowUpData({
          callbackId,
          phoneNumber: cleanPhoneNumber,
          startedAt: Date.now(),
          comment: callbackRecord?.comment || '',
          scheduledAt: callbackRecord?.scheduledAt || '',
        });

        // Set in localStorage so Disposition.jsx can read and complete it
        localStorage.setItem(
          ACTIVE_CALLBACK_STORAGE_KEY,
          JSON.stringify({
            callbackId,
            phoneNumber: cleanPhoneNumber,
            startedAt: Date.now(),
          }),
        );

        await axios.post(
          `https://devapp.iotcom.io/dialmissedcall`,
          {
            receiver: cleanPhoneNumber,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              ...authHeaders,
            },
          },
        );
        setCallAlert(false);
      } catch (error) {
        localStorage.removeItem(ACTIVE_CALLBACK_STORAGE_KEY);
        setActiveFollowUpData(null);
        console.error('Error:', error);
        toast.error('Request failed. Please try again.');
      }
    },
    [authHeaders, setCallAlert, setActiveFollowUpData],
  );

  const updateCallbackStatus = useCallback(
    async (callbackId, status) => {
      if (!callbackId) {
        return;
      }

      try {
        setUpdatingCallbackId(callbackId);
        await axios.post(
          `https://devapp.iotcom.io/callback/update-status`,
          {
            callbackId,
            status,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              ...authHeaders,
            },
          },
        );
        toast.success(`Callback marked ${status}.`);
        window.dispatchEvent(new CustomEvent('refreshFollowUps'));
        setCallAlert(false);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to update callback status.');
      } finally {
        setUpdatingCallbackId(null);
      }
    },
    [authHeaders, setCallAlert],
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
                <span>{tab.label}</span>
                {tabCounts[tab.key] > 0 ? (
                  <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-primary/10 px-1.5 py-0.5 text-[11px] font-semibold text-primary">
                    {tabCounts[tab.key]}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
          {/* Tab Content */}
          <div className="relative max-h-[calc(100vh-230px)] overflow-y-auto p-6 bg-card/90">
            {activeCalls.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 border border-primary/20">
                  <Clock className="h-8 w-8 text-primary" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">All caught up!</h3>
                <p className="text-sm text-muted-foreground">No callbacks available for this tab.</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {activeCalls.map((call) => (
                  <li
                    key={call.id}
                    className={`group relative overflow-hidden rounded-lg border border-border bg-card p-3 shadow-sm transition-all duration-300 hover:bg-accent hover:border-accent
                      ${
                        call.isAlert
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

                      <div className="flex items-center gap-2 ml-2">
                        {(activeTab === 'pending' || activeTab === 'upcoming' || activeTab === 'active') && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-full"
                            onClick={() => updateCallbackStatus(call._id || call.id, 'completed')}
                            disabled={updatingCallbackId === (call._id || call.id)}
                          >
                            Done
                          </Button>
                        )}
                        {(activeTab === 'pending' || activeTab === 'upcoming' || activeTab === 'active') && (
                          <Button
                            size="icon"
                            className={`w-8 h-8 rounded-full text-white shadow-md
                          ${
                            call.isAlert
                              ? 'bg-green-600 dark:bg-green-700 animate-bounce'
                              : 'bg-green-600 hover:bg-green-700 focus-visible:ring-green-500 dark:bg-green-700 dark:hover:bg-green-800'
                          }
                        `}
                            onClick={() => initiateCall(call)}
                            disabled={!call.phoneNumber}
                            aria-label={`Call ${call.phoneNumber}`}
                          >
                            <Phone className="h-4 w-4" />
                          </Button>
                        )}
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
