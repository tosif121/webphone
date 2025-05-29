import { useCallback, useMemo, useState } from 'react';
import { Phone, Clock, PhoneCall, Calendar } from 'lucide-react';
import moment from 'moment';
import { Dialog, DialogContent } from '@/components/ui/dialog';

const DropCallsModal = ({ usermissedCalls, setDropCalls, username, campaignMissedCallsLength }) => {
  const [loadingCaller, setLoadingCaller] = useState(null);

  const tokenData = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const parsedData = tokenData ? JSON.parse(tokenData) : null;
  const userCampaign = parsedData?.userData?.campaign;
  const apiUrl = 'https://esamwad.iotcom.io/';

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
        const response = await axios.post(`${apiUrl }/dialmissedcall`, {
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
      <DialogContent
        className="
          max-w-lg w-full p-0 border-none bg-transparent shadow-none
          flex items-center justify-center
        "
      >
        <div
          className="
            relative overflow-hidden rounded-2xl
            border border-slate-200/80 dark:border-slate-700/30
            bg-white/95 dark:bg-slate-900/80
            shadow-2xl shadow-slate-900/20 dark:shadow-blue-500/10
            backdrop-blur-md
            w-full
          "
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/60 dark:border-slate-700/20 bg-gradient-to-r from-blue-50/80 to-indigo-50/60 dark:from-slate-800/40 dark:to-slate-900/40">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <PhoneCall className="text-white" size={18} aria-hidden="true" />
                </div>
                <div className="absolute -top-2 -right-2 flex items-center justify-center w-max h-6 bg-red-500 text-white rounded-full text-xs font-bold shadow-md border-2 border-white dark:border-slate-900">
                  {campaignMissedCallsLength}
                </div>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-800 dark:text-blue-200">Missed Calls</h2>
              </div>
            </div>
          </div>
          {/* Content */}
          <div className="relative max-h-96 overflow-y-auto p-6 bg-gradient-to-b from-slate-50/30 to-white/90 dark:from-slate-900/20 dark:to-slate-900/60">
            {sortedEntries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 border border-blue-200 dark:border-blue-800">
                  <Clock className="h-8 w-8 text-blue-600 dark:text-blue-300" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-slate-800 dark:text-blue-100">All caught up!</h3>
                <p className="text-slate-600 dark:text-blue-300">No missed calls for {userCampaign}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sortedEntries.map(([caller, data], index) => (
                  <div
                    key={caller}
                    className="group relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700/20 bg-white dark:bg-slate-900/70 p-4 shadow-sm hover:shadow-md dark:shadow-blue-500/5 transition-all duration-300 hover:bg-blue-50 dark:hover:bg-blue-900/40 hover:border-blue-200 dark:hover:border-blue-700"
                    style={{
                      animationDelay: `${index * 100}ms`,
                      animation: 'fadeInUp 0.5s ease-out forwards',
                    }}
                  >
                    <div className="relative flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="relative">
                            <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center shadow-md">
                              <Phone className="text-white" size={20} aria-hidden="true" />
                            </div>
                            {data.count > 1 && (
                              <div className="absolute -top-2 -right-2 flex items-center justify-center w-6 h-6 bg-red-500 text-white rounded-full text-xs font-bold shadow-md border-2 border-white dark:border-slate-900">
                                {data.count}
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-slate-800 dark:text-white mb-1 text-base">{caller}</div>
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1 text-sm text-slate-600 dark:text-blue-300">
                                <Clock className="h-3 w-3" />
                                <span>{formatTimeAgo(data.latestTime)}</span>
                              </div>
                              <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                                <Calendar className="h-3 w-3" />
                                <span>{formatDateTime(data.latestTime)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => initiateCall(caller)}
                        disabled={loadingCaller === caller}
                        className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all disabled:opacity-60 disabled:cursor-not-allowed border border-emerald-400/30 hover:scale-105 active:scale-95"
                        aria-label={`Call ${caller}`}
                      >
                        <Phone className="h-4 w-4" />
                        <span className="text-sm">{loadingCaller === caller ? 'Calling...' : 'Call Back'}</span>
                      </button>
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
