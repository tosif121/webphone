import dynamic from 'next/dynamic';

const SubscriptionExpired = dynamic(() => import('@/components/SubscriptionExpired'));

export default function SubscriptionExpiredPage() {
  return <SubscriptionExpired />;
}
