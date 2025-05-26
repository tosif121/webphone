import React from 'react';
import { Phone } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import maskPhoneNumber from '@/utils/maskPhoneNumber';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

const DropCallsModal = ({ usermissedCalls, setDropCalls, username }) => {
  const tokenData = localStorage.getItem('token');
  const parsedData = JSON.parse(tokenData);
  const userCampaign = parsedData?.userData?.campaign;

  const groupedCalls = React.useMemo(() => {
    const filteredCalls = Object.values(usermissedCalls || {}).filter(
      (call) => call?.campaign === userCampaign
    );

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
      acc[call.Caller].latestTime = Math.max(
        acc[call.Caller].latestTime,
        parseInt(call.startTime) || 0
      );

      return acc;
    }, {});
  }, [usermissedCalls, userCampaign]);

  const removeCountryCode = (phoneNumber, countryCode = '+91') => {
    return phoneNumber.startsWith(countryCode)
      ? phoneNumber.slice(countryCode.length)
      : phoneNumber;
  };

  const initiateCall = React.useCallback(
    async (caller) => {
      try {
        const sanitizedCaller = removeCountryCode(caller);
        await axios.post(`https://esamwad.iotcom.io/dialmissedcall`, {
          caller: username,
          receiver: sanitizedCaller,
        });
        setDropCalls(false);
        toast.success(`Calling ${maskPhoneNumber(caller)}`);
      } catch (error) {
        console.error('Error:', error);
        toast.error('Request failed. Please try again.');
      }
    },
    [username]
  );

  if (Object.entries(groupedCalls).length === 0) {
    return (
      <Card className="border-0 shadow-none">
        <CardContent className="p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
            <Phone className="h-5 w-5 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium">No missed calls</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            No missed calls found for campaign:{' '}
            <span className="font-medium">{userCampaign}</span>
          </p>
        </CardContent>
      </Card>
    );
  }

  const sortedEntries = Object.entries(groupedCalls).sort(
    (a, b) => b[1].latestTime - a[1].latestTime
  );

  return (
    <Card className="border-0 shadow-none">
      <CardHeader className="pb-3">
        <CardTitle>Missed Calls</CardTitle>
      </CardHeader>
      <ScrollArea className="h-[calc(100vh-220px)]">
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {sortedEntries.map(([caller, data]) => (
              <div
                key={caller}
                className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex min-w-0 gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {data.count}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold truncate">
                      {maskPhoneNumber(caller)}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {data.count} {data.count === 1 ? 'call' : 'calls'}
                      </Badge>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(data.latestTime), 'MMM dd, h:mm a')}
                      </p>
                    </div>
                  </div>
                </div>
                <Button
                  size="icon"
                  onClick={() => initiateCall(caller)}
                  aria-label={`Call ${maskPhoneNumber(caller)}`}
                >
                  <Phone className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </ScrollArea>
    </Card>
  );
};

export default DropCallsModal;