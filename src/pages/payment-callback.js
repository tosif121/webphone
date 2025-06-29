// pages/payment-callback.js
import { useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function PaymentCallback() {
  useEffect(() => {
    const orderId = typeof window !== 'undefined' && sessionStorage.getItem('phonepe_order_id');
    const amount = typeof window !== 'undefined' && sessionStorage.getItem('phonepe_amount');
    console.log(orderId, 'orderId');
    console.log(amount, 'amount');
    const timer = setTimeout(() => {
      if (orderId) {
        window.location.href = `/payment-success?orderId=${orderId}&amount=${amount}`;
      } else {
        window.location.href = '/checkout';
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-700">
      <Card className="w-full max-w-md shadow-xl bg-white/10 backdrop-blur-lg border-0">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <Loader2 className="animate-spin text-white bg-indigo-500 rounded-full p-2" size={48} />
          </div>
          <CardTitle className="text-white text-2xl">Processing Payment...</CardTitle>
          <CardDescription className="text-indigo-100">Please wait while we verify your payment.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-sm text-indigo-100 pt-2">Do not close this window.</div>
        </CardContent>
      </Card>
    </div>
  );
}
