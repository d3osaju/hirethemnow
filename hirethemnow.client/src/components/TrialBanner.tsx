import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { trialAPI } from '../services/api';
import { X, Clock, CheckCircle } from 'lucide-react';

const TrialBanner: React.FC = () => {
  const { user } = useAuth();
  const [showBanner, setShowBanner] = useState(false);
  const [daysRemaining, setDaysRemaining] = useState(0);
  const [isTrialExpired, setIsTrialExpired] = useState(false);

  useEffect(() => {
    if (!user) return;

    const now = new Date();
    const trialEnd = new Date(user.trialEndDate);
    const diffTime = trialEnd.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    setDaysRemaining(diffDays);
    setIsTrialExpired(diffDays <= 0);

    // Show banner if trial is active and user hasn't seen the end message (when expired)
    if (diffDays <= 0 && !user.hasSeenTrialEndMessage) {
      setShowBanner(true);
    } else if (diffDays > 0 && diffDays <= 7) {
      // Show banner during trial period
      setShowBanner(true);
    }
  }, [user]);

  const handleClose = async () => {
    if (isTrialExpired) {
      try {
        await trialAPI.acknowledgeTrialEnd();
      } catch (error) {
        console.error('Failed to acknowledge trial end:', error);
      }
    }
    setShowBanner(false);
  };

  if (!showBanner || !user) return null;

  if (isTrialExpired) {
    return (
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between flex-wrap">
            <div className="flex items-center flex-1">
              <CheckCircle className="h-6 w-6 mr-3 flex-shrink-0" />
              <div>
                <p className="font-semibold text-lg">Thank you for participating in our Beta!</p>
                <p className="text-sm text-blue-100 mt-1">
                  Your 7-day free trial has ended. We hope you enjoyed the experience. Payment options will be available soon!
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="ml-4 inline-flex items-center px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
            >
              Got it!
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-green-500 to-teal-600 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between flex-wrap">
          <div className="flex items-center flex-1">
            <Clock className="h-5 w-5 mr-3 flex-shrink-0" />
            <div>
              <p className="font-medium">
                Free Trial: <span className="font-bold">{daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} remaining</span>
              </p>
              <p className="text-sm text-green-100">
                Enjoy full access to all features during your trial period.
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="ml-4 p-1 hover:bg-white/20 rounded-full transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TrialBanner;