export interface User {
  id: string;
  email: string;
  name: string;
  role: 'employer' | 'candidate' | 'admin';
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

// Resume Parsing Types
export interface ParsedResumeContent {
  personalInfo?: {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    website?: string;
  };
  summary?: string;
  experience?: Array<{
    company?: string;
    title?: string;
    location?: string;
    startDate?: string;
    endDate?: string;
    description?: string;
    achievements?: string[];
  }>;
  education?: Array<{
    institution?: string;
    degree?: string;
    field?: string;
    graduationDate?: string;
    gpa?: string;
  }>;
  skills?: {
    technical?: string[];
    soft?: string[];
    languages?: string[];
    tools?: string[];
  };
  certifications?: Array<{
    name?: string;
    issuer?: string;
    date?: string;
    expirationDate?: string;
    credentialId?: string;
  }>;
  projects?: Array<{
    name?: string;
    description?: string;
    technologies?: string[];
    url?: string;
  }>;
}

export interface ResumeParsingStatus {
  id: number;
  fileName: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  uploadedAt: string;
  parsedAt: string | null;
  error: string | null;
}

export interface ResumeContentData {
  id: number;
  fileName: string;
  contentType: string;
  parsedContent: string; // JSON string
  textContent: string;
  status: string;
  uploadedAt: string;
  parsedAt: string | null;
}

// Resume Analysis Types
export interface AnalysisStatus {
  status: string;
  message?: string;
  overallScore?: number;
  completedAt?: string;
  errorMessage?: string;
}

export interface SectionFeedbackItem {
  score: number;
  issues: string[];
  suggestions: string[];
}

export interface SectionFeedback {
  sectionName: string;
  score: number;
  issues: string[];
  suggestions: string[];
}

export interface ResumeAnalysisResult {
  id: number;
  userId: string;
  resumeContentId?: number;
  atsOverallScore?: number;
  atsFormattingScore?: number;
  atsKeywordsScore?: number;
  atsExperienceScore?: number;
  atsEducationScore?: number;
  atsSkillsScore?: number;
  atsAchievementsScore?: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  keywordsFound: string[];
  keywordsMissing: string[];
  keywordDensity?: number;
  readabilityScore?: number;
  readabilityIssues: string[];
  sectionFeedback: Record<string, SectionFeedbackItem>;
  status: string;
  processedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface JobOpportunity {
  id: number;
  jobTitle: string;
  company: string;
  location: string;
  emails: string;
  emailType: string;
  isRemote: boolean;
  salary: string;
  link: string;
  snippet: string;
  scrapedDate?: string;
  createdAt: string;
}



export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Admin User Management Types
export interface AdminUser extends User {
  lastLoginAt?: string;
  registrationSource: 'email' | 'google';
  profileCompleteness: number;
  resumeStatus: 'none' | 'uploaded' | 'parsed' | 'error';
}

export interface UserFilters {
  role?: 'candidate' | 'admin';
  trialStatus?: 'active' | 'expired' | 'subscribed';
  registrationDateRange?: { start: Date; end: Date };
  search?: string;
}

export interface UserTableRow {
  id: string;
  name: string;
  email: string;
  role: string;
  picture?: string;
  createdAt: string;
  trialStatus: string;
  lastActivity?: string;
  isCompleted: boolean;
}

// Admin Job Management Types
export interface AdminJobOpportunity {
  id: number;
  title: string;
  company: string;
  location: string;
  locationType: 'remote' | 'hybrid' | 'onsite';
  salaryMin?: number;
  salaryMax?: number;
  description: string;
  requirements: string[];
  benefits: string[];
  status: 'active' | 'inactive' | 'closed';
  postedAt: string;
  expiresAt?: string;
  applicationCount: number;
  viewCount: number;
  createdBy: string;
  updatedAt: string;
}

export interface JobFilters {
  status?: 'active' | 'inactive' | 'closed';
  locationType?: 'remote' | 'hybrid' | 'onsite';
  salaryRange?: { min: number; max: number };
  postedDateRange?: { start: Date; end: Date };
  search?: string;
}

export interface JobApplication {
  id: number;
  userId: string;
  jobId: number;
  appliedAt: string;
  status: 'pending' | 'reviewed' | 'accepted' | 'rejected';
  user: {
    id: string;
    name: string;
    email: string;
    picture?: string;
  };
}

// Admin Analytics Types
export interface DashboardMetrics {
  totalUsers: number;
  userGrowth: number; // percentage
  activeJobs: number;
  jobGrowth: number; // percentage
  recentRegistrations: number;
  totalApplications: number;
  applicationGrowth: number; // percentage
}

export interface ChartData {
  userRegistrations: Array<{ date: string; count: number }>;
  jobPostings: Array<{ date: string; count: number }>;
  userRoles: Array<{ role: string; count: number }>;
}

export interface RecentActivity {
  id: string;
  type: 'user_registered' | 'job_posted' | 'application_submitted';
  description: string;
  timestamp: string;
  userId?: string;
  jobId?: number;
}

// Email Center Types
export interface EmailRecord {
  id: number;
  toEmail: string;
  subject: string;
  body: string;
  resumeUrl: string;
  createdAt: string;
}

