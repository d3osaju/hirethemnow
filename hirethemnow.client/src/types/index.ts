export interface User {
  id: string;
  email: string;
  name: string;
  role: 'employer' | 'candidate';
  avatar?: string;
  dateOfBirth?: Date;
  skills?: string[];
  resumeUrl?: string;
  onboardingCompleted?: boolean;
  createdAt: Date;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  description: string;
  requirements: string[];
  location: string;
  salary: {
    min: number;
    max: number;
    currency: string;
  };
  type: 'full-time' | 'part-time' | 'contract' | 'remote';
  createdAt: Date;
  updatedAt: Date;
  employerId: string;
}

export interface Application {
  id: string;
  jobId: string;
  candidateId: string;
  status: 'pending' | 'reviewed' | 'interview' | 'offered' | 'rejected';
  coverLetter?: string;
  resumeUrl?: string;
  appliedAt: Date;
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

export interface MailboxMessage {
  id: string;
  from: string;
  subject: string;
  content: string;
  jobTitle?: string;
  company?: string;
  receivedAt: Date;
  read: boolean;
  type: 'reply' | 'interview_invitation' | 'rejection' | 'offer';
}