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
  certifications?: string[];
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

export interface SectionFeedback {
  sectionName: string;
  score: number;
  issues: string[];
  suggestions: string[];
}

export interface ResumeAnalysisResult {
  id: number;
  userId: string;
  atsOverallScore: number;
  atsFormattingScore: number;
  atsKeywordsScore: number;
  atsExperienceScore: number;
  atsEducationScore: number;
  atsSkillsScore: number;
  atsAchievementsScore: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  keywordsFound: string[];
  keywordsMissing: string[];
  keywordDensity: number;
  readabilityScore: number;
  readabilityIssues: string[];
  sectionFeedback: string; // JSON string of SectionFeedback[]
  status: string;
  processedAt: string;
}

