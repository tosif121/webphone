import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

export default function PhonePeCheckout() {
  const [merchantOrderId, setMerchantOrderId] = useState("newtxn" + Date.now());
  const [amount, setAmount] = useState(1000);
  const [paymentResponse, setPaymentResponse] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Initiate Payment
  const initiatePayment = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("http://localhost:3001/api/phonepe/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ merchantOrderId, amount }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Payment failed");
      setPaymentResponse(data);
      setSuccess("Payment initiated successfully!");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Check Payment Status
  const checkPaymentStatus = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`http://localhost:3001/api/phonepe/status/${merchantOrderId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Status check failed");
      setPaymentStatus(data);
      setSuccess("Payment status retrieved successfully!");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Query Payment Details
  const queryPaymentDetails = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`http://localhost:3001/api/phonepe/query/${merchantOrderId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Query failed");
      setPaymentDetails(data);
      setSuccess("Payment details retrieved successfully!");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>PhonePe Payment</CardTitle>
          <CardDescription>Secure and seamless payments with PhonePe</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="merchantOrderId">Merchant Order ID</Label>
            <Input
              id="merchantOrderId"
              value={merchantOrderId}
              onChange={(e) => setMerchantOrderId(e.target.value)}
              placeholder="Enter order ID"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (in paise)</Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              placeholder="Enter amount"
            />
          </div>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button onClick={initiatePayment} disabled={loading} className="w-full">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Initiate Payment
          </Button>
          <Button
            onClick={checkPaymentStatus}
            disabled={loading}
            variant="outline"
            className="w-full"
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Check Payment Status
          </Button>
          <Button
            onClick={queryPaymentDetails}
            disabled={loading}
            variant="outline"
            className="w-full"
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Query Payment Details
          </Button>
        </CardFooter>
      </Card>
      {paymentResponse && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Payment Response</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm overflow-auto">
              {JSON.stringify(paymentResponse, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
      {paymentStatus && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Payment Status</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm overflow-auto">
              {JSON.stringify(paymentStatus, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
      {paymentDetails && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Payment Details</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm overflow-auto">
              {JSON.stringify(paymentDetails, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
