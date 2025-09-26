import React from 'react';
import type { OnboardingData } from '../../types';
import { Calendar } from 'lucide-react';

interface PersonalInfoStepProps {
  data: OnboardingData;
  onDataChange: (data: Partial<OnboardingData>) => void;
}

const PersonalInfoStep: React.FC<PersonalInfoStepProps> = ({ data, onDataChange }) => {
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onDataChange({ dateOfBirth: e.target.value });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Calendar className="mx-auto h-12 w-12 text-blue-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Personal Information</h2>
        <p className="text-gray-600">
          Help us personalize your experience by providing some basic information
        </p>
      </div>

      <div className="max-w-md mx-auto space-y-4">
        <div>
          <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-2">
            Date of Birth *
          </label>
          <input
            type="date"
            id="dateOfBirth"
            value={data.dateOfBirth}
            onChange={handleDateChange}
            max={new Date().toISOString().split('T')[0]}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
          <p className="mt-1 text-xs text-gray-500">
            This helps us ensure age verification for employment opportunities
          </p>
        </div>
      </div>
    </div>
  );
};

export default PersonalInfoStep;