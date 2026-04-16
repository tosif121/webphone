import React, { useEffect, useState, useMemo } from 'react';

// Unified Network Quality indicator
const NetworkIndicator = ({ timeoutArray = [], peerConnection = null, timeWindow = 30000, showTime = false }) => {
  // WebRTC Stats
  const [jitter, setJitter] = useState(null);
  const [latency, setLatency] = useState(null);
  const [packetLoss, setPacketLoss] = useState(null);
  const [icmp, setIcmp] = useState(null);

  // Time for display
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    if (!showTime) return;
    const updateTime = () => {
      setCurrentTime(
        new Date().toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        }),
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 10000);
    return () => clearInterval(timer);
  }, [showTime]);

  // 1. ICMP/General Ping Check (Always runs)
  useEffect(() => {
    const checkPing = async () => {
      try {
        const start = performance.now();
        await fetch('https://esamwad.iotcom.io', {
          method: 'GET',
          mode: 'no-cors',
          cache: 'no-store',
        });
        const duration = performance.now() - start;
        setIcmp(duration.toFixed(0));
      } catch (error) {
        // Fallback to browser's RTT if available
        const rtt = navigator.connection?.rtt;
        setIcmp(rtt || null);
      }
    };

    const interval = setInterval(checkPing, 5000);
    checkPing();
    return () => clearInterval(interval);
  }, []);

  // 2. WebRTC Real-time Stats (Only if peerConnection exists)
  useEffect(() => {
    if (!peerConnection) {
      setJitter(null);
      setLatency(null);
      setPacketLoss(null);
      return;
    }

    const interval = setInterval(async () => {
      try {
        const stats = await peerConnection.getStats();
        stats.forEach((report) => {
          if (report.type === 'inbound-rtp' && !report.isRemote) {
            if (report.jitter !== undefined) setJitter((report.jitter * 1000).toFixed(1));
            const totalPackets = report.packetsReceived + report.packetsLost;
            if (totalPackets > 0) {
              setPacketLoss(((report.packetsLost / totalPackets) * 100).toFixed(1));
            }
          }
          if (report.type === 'candidate-pair' && report.currentRoundTripTime) {
            setLatency((report.currentRoundTripTime * 1000).toFixed(1));
          }
        });
      } catch (err) {
        // Stats not available yet
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [peerConnection]);

  // 3. Logic to determine Signal Bars (Merging both strategies)
  const signalStrength = useMemo(() => {
    // Priority 1: Call Mode (WebRTC Stats)
    if (peerConnection && (latency !== null || jitter !== null || packetLoss !== null)) {
      const getLevel = (val, thresholds) => {
        if (val === null || isNaN(val)) return 4;
        if (val < thresholds[0]) return 4;
        if (val < thresholds[1]) return 2;
        return 1;
      };

      const lLevel = getLevel(Number(latency), [150, 300]);
      const jLevel = getLevel(Number(jitter), [30, 60]);
      const pLevel = getLevel(Number(packetLoss), [1.5, 4]);

      return Math.min(lLevel, jLevel, pLevel);
    }

    // Priority 2: Idle Mode (Timeout Array)
    const recentTimeouts = (timeoutArray || []).filter((t) => {
      if (!t.timestamp) return false;
      return new Date(t.timestamp) > new Date(Date.now() - timeWindow);
    });

    const count = recentTimeouts.length;
    if (count >= 3) return 1;
    if (count === 2) return 2;
    if (count === 1) return 3;
    return 4;
  }, [peerConnection, latency, jitter, packetLoss, timeoutArray, timeWindow]);

  return (
    <div className="flex items-center w-full">
      {showTime && currentTime && (
        <span className="text-sm font-medium text-primary/80 tabular-nums shrink-0">{currentTime}</span>
      )}

      {showTime && <div className="flex-1" />}

      <div className="group relative flex flex-col items-center me-3">
        <div className="flex items-end h-3.5 gap-1">
          {[...Array(4)].map((_, index) => (
            <div
              key={index}
              className={`w-1 rounded-full transition-all duration-300 ${
                index < signalStrength ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-muted/40'
              }`}
              style={{ height: `${(index + 1) * 25}%` }}
            />
          ))}
        </div>

        {/* Unified Tooltip */}
        <div className="absolute mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-[100]">
          <div className="bg-popover/95 backdrop-blur-sm border border-border text-popover-foreground text-[10px] rounded-lg px-2.5 py-1.5 shadow-xl min-w-[90px]">
            <div className="flex flex-col gap-1">
              <div className="flex justify-between gap-3">
                <span className="font-semibold text-muted-foreground">Status:</span>
                <span className={peerConnection ? 'text-primary' : 'text-blue-500'}>
                  {peerConnection ? 'In-Call' : 'Monitored'}
                </span>
              </div>
              <div className="h-px bg-border/50 my-0.5" />
              <div className="flex justify-between gap-3 italic">
                <span>ICMP</span>
                <span>{icmp ? `${icmp}ms` : '---'}</span>
              </div>
              {peerConnection && (
                <>
                  <div className="flex justify-between gap-3">
                    <span>Latency</span>
                    <span>{latency ? `${latency}ms` : '---'}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span>Jitter</span>
                    <span>{jitter ? `${jitter}ms` : '---'}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span>Packet Loss</span>
                    <span>{packetLoss ? `${packetLoss}%` : '0%'}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NetworkIndicator;
