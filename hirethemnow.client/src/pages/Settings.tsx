import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import {
  Shield,
  CreditCard,
  Download,
  Trash2,
  Save,
  Eye,
  EyeOff,
  Clock
} from 'lucide-react';

const Settings: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('privacy');
  const [showPassword, setShowPassword] = useState(false);
  const [daysRemaining, setDaysRemaining] = useState(0);

  useEffect(() => {
    if (!user) return;

    const now = new Date();
    const trialEnd = new Date(user.trialEndDate);
    const diffTime = trialEnd.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    setDaysRemaining(diffDays);
  }, [user]);

  const tabs = [
    { id: 'privacy', label: 'Privacy & Security', icon: Shield },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'data', label: 'Data Management', icon: Download },
  ];

  const handleSave = () => {
    // Save settings logic would go here
  };

  const renderPrivacySettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Password & Security</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
            <input
              type="password"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
            <input
              type="password"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Privacy Controls</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <p className="font-medium text-gray-900">Profile Visibility</p>
              <p className="text-sm text-gray-500">Control who can see your profile information</p>
            </div>
            <select className="px-3 py-1 border border-gray-300 rounded-lg">
              <option>Public</option>
              <option>Private</option>
              <option>Recruiters Only</option>
            </select>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <p className="font-medium text-gray-900">Analytics Data Sharing</p>
              <p className="text-sm text-gray-500">Allow anonymous data sharing for service improvement</p>
            </div>
            <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-600">
              <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderBillingSettings = () => {
    const isTrialActive = user && daysRemaining > 0;

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Plan</h3>
          {isTrialActive ? (
            <div className="bg-gradient-to-r from-green-50 to-teal-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center">
                    <Clock className="w-6 h-6 text-green-600 mr-2" />
                    <h4 className="text-lg font-semibold text-gray-900">Free Trial Active</h4>
                  </div>
                  <p className="text-gray-600 mt-2">
                    Enjoy full access to all features during your trial period.
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-green-600">{daysRemaining}</p>
                  <p className="text-sm text-gray-600">{daysRemaining === 1 ? 'day' : 'days'} remaining</p>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-green-200">
                <p className="text-sm text-gray-600 mb-3">
                  <strong>What happens next?</strong> Payment options will be available soon. We'll notify you before your trial ends.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-lg font-semibold text-red-900">Trial Ended</h4>
                  <p className="text-red-700 mt-2">
                    Your free trial has ended. Thank you for participating in our Beta!
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm text-red-800">
                  Payment options will be available soon. We'll notify you via email when subscriptions are ready.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderDataSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Export</h3>
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Download Your Data</p>
                <p className="text-sm text-gray-500">Export all your account data including campaigns, responses, and analytics</p>
              </div>
              <button className="flex items-center px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900">
                <Download className="w-4 h-4 mr-2" />
                Export Data
              </button>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Deletion</h3>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Trash2 className="w-6 h-6 text-red-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-red-900">Delete Account</h4>
              <p className="text-sm text-red-700 mt-1">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
              <button className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">Manage your account preferences and security settings</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <div className="lg:w-64">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <tab.icon className="w-5 h-5 mr-3" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            {activeTab === 'privacy' && renderPrivacySettings()}
            {activeTab === 'billing' && renderBillingSettings()}
            {activeTab === 'data' && renderDataSettings()}

            {/* Save Button */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex justify-end">
                <button
                  onClick={handleSave}
                  className="flex items-center px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;