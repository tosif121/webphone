import { useEffect, useState } from 'react';

// Helper to determine signal strength level (1-4) based on thresholds
function getSignalLevel(value, thresholds) {
  if (value === null || value === undefined) return 0;
  if (value < thresholds[0]) return 4;
  if (value < thresholds[1]) return 2;
  return 1;
}

export default function WebRTCStats({ peerConnection }) {
  const [jitter, setJitter] = useState(null);
  const [latency, setLatency] = useState(null);
  const [packetLoss, setPacketLoss] = useState(null);

  useEffect(() => {
    if (!peerConnection) return;

    const interval = setInterval(async () => {
      try {
        const stats = await peerConnection.getStats();

        stats.forEach((report) => {
          if (report.type === 'inbound-rtp' && !report.isRemote) {
            if (report.jitter !== undefined) setJitter((report.jitter * 1000).toFixed(2)); // ms
            const totalPackets = report.packetsReceived + report.packetsLost;
            if (totalPackets > 0) {
              const loss = (report.packetsLost / totalPackets) * 100;
              setPacketLoss(loss.toFixed(2));
            }
          }

          if (report.type === 'candidate-pair' && report.currentRoundTripTime) {
            setLatency((report.currentRoundTripTime * 1000).toFixed(2)); // ms
          }
        });
      } catch (err) {
        // Ignore for now
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [peerConnection]);

  // Thresholds: [good, moderate]
  const latencyThresholds = [100, 200]; // ms
  const jitterThresholds = [20, 50]; // ms
  const packetLossThresholds = [1, 3]; // %

  // Calculate signal levels for each metric
  const latencyLevel = getSignalLevel(Number(latency), latencyThresholds);
  const jitterLevel = getSignalLevel(Number(jitter), jitterThresholds);
  const packetLossLevel = getSignalLevel(Number(packetLoss), packetLossThresholds);

  // Overall signal strength is the lowest of the three
  const signalStrength = Math.min(latencyLevel, jitterLevel, packetLossLevel);
  console.log(signalStrength, 'signalStrength', latency, jitter, packetLoss);
  const now = new Date();
  const time = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <div className="flex justify-between items-center w-full px-4 my-4">
      <div> {time}</div>

      <div className="flex flex-col items-center">
        <div className="flex items-end h-4 gap-1">
          {[...Array(4)].map((_, index) => (
            <div
              key={index}
              className={`w-1 rounded-sm transition-all duration-300 ${
                index < signalStrength ? 'bg-green-500' : 'bg-gray-300'
              }`}
              style={{ height: `${(index + 1) * 25}%` }}
              aria-label={`Signal bar ${index + 1} of 4 ${index < signalStrength ? 'active' : 'inactive'}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
