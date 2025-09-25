export interface User {
  id: string;
  email: string;
  name: string;
  role: 'employer' | 'candidate';
  avatar?: string;
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