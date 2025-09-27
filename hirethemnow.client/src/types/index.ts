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
  status: 'Applied' | 'Reviewing' | 'Interview' | 'Accepted' | 'Rejected';
  coverLetter?: string;
  resumeUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  job?: Job;
  candidate?: User;
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
  type: 'sent' | 'received';
  subject: string;
  content: string;
  fromEmail: string;
  toEmail: string;
  company: string;
  contactName: string;
  sentAt?: Date;
  receivedAt?: Date;
  status: string;

  // AI Analysis results for badges
  hasAnalysis: boolean;
  sentiment: string; // "Positive", "Negative", "Interview", "Neutral"
  emailType: string;
  hasInterviewInvitation: boolean;
  isRejection: boolean;
  isPositiveResponse: boolean;
  interviewDate?: Date;
  interviewDetails?: string;
  nextSteps?: string;
}

export interface MailboxStats {
  totalSent: number;
  totalReplies: number;
  totalOpened: number;
  interviewInvitations: number;
  rejections: number;
  positiveResponses: number;
  pendingResponses: number;
}