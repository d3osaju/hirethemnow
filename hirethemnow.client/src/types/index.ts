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
  resumeUrl?: string;
  isCompleted: boolean;
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

