import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaExclamationCircle } from 'react-icons/fa';

const SubscriptionExpired = () => {
  const navigate = useNavigate();

  const handleBackToLogin = () => {
    navigate('/webphone/login');
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="w-full max-w-xl mx-4 bg-white rounded-lg shadow-lg">
        <div className="p-8 space-y-6">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 flex items-center justify-center rounded-full bg-red-100">
              <FaExclamationCircle className="w-8 h-8 text-red-600" />
            </div>

            <h1 className="text-2xl font-semibold text-gray-900 text-center">Subscription Expired</h1>

            <p className="text-gray-600 text-center max-w-md">
              Your subscription has expired. Please contact support to renew your plan.
            </p>

            <div className="space-y-4 w-full max-w-sm text-center">
              <button onClick={handleBackToLogin} className="primary-btn">
                Back to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionExpired;
