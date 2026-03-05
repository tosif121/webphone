import dynamic from 'next/dynamic';

const SystemFailureMonitor = dynamic(() => import('@/components/SystemFailureMonitor'), {
  ssr: false,
});

export default function SystemFailureMonitorPage() {
  return (
    <>
      <SystemFailureMonitor />
    </>
  );
}
