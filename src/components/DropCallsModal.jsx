import { useCallback, useMemo, useState } from 'react';
import { Phone, Clock, PhoneMissed, Calendar } from 'lucide-react';
import moment from 'moment';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import axios from 'axios';
import { Button } from './ui/button';

const DropCallsModal = ({ usermissedCalls, setDropCalls, username, campaignMissedCallsLength }) => {
  const [loadingCaller, setLoadingCaller] = useState(null);

  const tokenData = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const parsedData = tokenData ? JSON.parse(tokenData) : null;
  const userCampaign = parsedData?.userData?.campaign;

  const groupedCalls = useMemo(() => {
    const filteredCalls = Object.values(usermissedCalls || {}).filter((call) => call?.campaign === userCampaign);
    return filteredCalls.reduce((acc, call) => {
      if (!call?.Caller) return acc;
      if (!acc[call.Caller]) {
        acc[call.Caller] = {
          count: 0,
          calls: [],
          latestTime: 0,
          campaign: call.campaign,
        };
      }
      acc[call.Caller].count += 1;
      acc[call.Caller].calls.push(call);
      acc[call.Caller].latestTime = Math.max(acc[call.Caller].latestTime, parseInt(call.startTime) || 0);
      return acc;
    }, {});
  }, [usermissedCalls, userCampaign]);

  const maskPhoneNumber = (phoneNumber) => {
    if (!phoneNumber || phoneNumber.length < 4) return phoneNumber;
    const visible = phoneNumber.slice(-4);
    const masked = '*'.repeat(Math.max(0, phoneNumber.length - 4));
    return masked + visible;
  };

  const removeCountryCode = (phoneNumber, countryCode = '+91') => {
    return phoneNumber.startsWith(countryCode) ? phoneNumber.slice(countryCode.length) : phoneNumber;
  };

  const initiateCall = useCallback(
    async (caller) => {
      try {
        const sanitizedCaller = removeCountryCode(caller);
        const response = await axios.post(`https://samwad.iotcom.io/dialmissedcall`, {
          caller: username,
          receiver: sanitizedCaller,
        });
        setDropCalls(false);
      } catch (error) {
        console.error('Error:', error);
        toast.error('Request failed. Please try again.');
      }
    },
    [username, userCampaign]
  );

  const sortedEntries = Object.entries(groupedCalls).sort((a, b) => b[1].latestTime - a[1].latestTime);

  const formatTimeAgo = (timestamp) => moment(timestamp).fromNow();
  const formatDateTime = (timestamp) => moment(timestamp).format('MMM DD, YYYY • hh:mm A');

  return (
    <Dialog open={true} onOpenChange={setDropCalls}>
      <DialogContent className="max-w-lg w-full p-0 border-none bg-transparent shadow-none flex items-center justify-center">
        <div className="relative overflow-hidden rounded-2xl border border-border bg-card/95 shadow-2xl backdrop-blur-md w-full">
          {/* Header */}
          <DialogHeader>
            <DialogTitle>
              <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-lg">
                      <PhoneMissed className="text-primary-foreground" size={18} aria-hidden="true" />
                    </div>
                    <div className="absolute -top-3 -right-3 flex items-center justify-center min-w-6 w-max h-6 bg-destructive text-white rounded-full text-xs font-bold shadow-md border-2 border-background">
                      {campaignMissedCallsLength}
                    </div>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Missed Calls</h2>
                  </div>
                </div>
              </div>
            </DialogTitle>
          </DialogHeader>
          {/* Content */}
          <div className="relative max-h-96 overflow-y-auto p-6 bg-card/90">
            {sortedEntries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 border border-primary/20">
                  <Clock className="h-8 w-8 text-primary" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">All caught up!</h3>
                <p className="text-muted-foreground">No missed calls for {userCampaign}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sortedEntries.map(([caller, data], index) => (
                  <div
                    key={caller}
                    className="group relative overflow-hidden rounded-lg border border-border bg-card p-3 shadow-sm hover:shadow-md transition-all duration-300 hover:bg-accent hover:border-accent"
                    style={{
                      animationDelay: `${index * 100}ms`,
                      animation: 'fadeInUp 0.5s ease-out forwards',
                    }}
                  >
                    <div className="relative flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shadow-sm">
                              <Phone className="text-primary-foreground" size={16} aria-hidden="true" />
                            </div>
                            {data.count > 1 && (
                              <div className="absolute -top-1 -right-1 flex items-center justify-center min-w-5 w-max h-5 bg-destructive text-white rounded-full text-[10px] font-bold shadow-sm border border-background">
                                {data.count}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-foreground text-sm truncate">{caller}</div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>{formatTimeAgo(data.latestTime)}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>{formatDateTime(data.latestTime)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <Button
                        size="icon"
                        className="w-8 h-8 cursor-pointer rounded-full text-white shadow-md bg-green-600 hover:bg-green-700 focus-visible:ring-green-500 ml-2"
                        onClick={() => initiateCall(caller)}
                        disabled={loadingCaller === caller}
                        aria-label={`Call ${caller}`}
                      >
                        <Phone className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DropCallsModal;
