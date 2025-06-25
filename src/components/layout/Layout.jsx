import React, { useEffect } from 'react';
import Header from './Header';
import Footer from './Footer';
import DraggableWebPhone from '../DraggableWebPhone';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';

export default function Layout({ children }) {
  const router = useRouter();

  const acceptCall = () => {
    toast.success('Call accepted!');
    // Your call acceptance logic here
    console.log('Call accepted from web!');
  };

  const declineCall = () => {
    toast.error('Call declined!');
    // Your call decline logic here
    console.log('Call declined from web!');
  };

  // Set up global functions for React Native communication
  useEffect(() => {
    // Only run on client side
    if (typeof window !== 'undefined') {
      // Make functions available globally for React Native
      window.answerIncomingCall = acceptCall;
      window.rejectIncomingCall = declineCall;

      console.log('Global call functions registered:', {
        answerIncomingCall: typeof window.answerIncomingCall,
        rejectIncomingCall: typeof window.rejectIncomingCall,
      });

      // Optional: Listen for messages from React Native
      const handleMessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Received message from React Native:', data);

          if (data.type === 'call_action') {
            if (data.action === 'accept') {
              acceptCall();
            } else if (data.action === 'decline') {
              declineCall();
            }
          }
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      };

      window.addEventListener('message', handleMessage);

      // Cleanup
      return () => {
        window.removeEventListener('message', handleMessage);
      };
    }
  }, []); // Empty dependency array means this runs once on mount

  return (
    <div>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="w-full container px-4 mx-auto py-8">{children}</div>
        </main>
        <Footer />
      </div>
      {router.pathname != '/webphone/agent-dashboard' && <DraggableWebPhone />}
    </div>
  );
}
