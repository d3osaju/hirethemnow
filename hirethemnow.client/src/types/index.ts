export interface User {
  id: string;
  email: string;
  name: string;
  role: 'employer' | 'candidate';
  picture?: string;
  phone?: string;
  location?: string;
  bio?: string;
  skills: string[];
  title?: string;
  industry?: string;
  experience?: string;
  resumeUrl?: string;
  isCompleted: boolean;
  trialStartDate: Date;
  trialEndDate: Date;
  isTrialActive: boolean;
  hasSeenTrialEndMessage: boolean;
  hasActiveSubscription: boolean;
  hasAccess: boolean;
  createdAt: Date;
  updatedAt: Date;
}


export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

export interface OnboardingData {
  dateOfBirth: string;
  skills: string[];
  resume: File | null;
}

