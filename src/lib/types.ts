export type InterviewType = 'tech' | 'system-design' | 'behavioral' | 'hr' | 'english';

export interface InterviewConfig {
  type: InterviewType;
  position: string;
  level: 'junior' | 'mid' | 'senior' | 'staff';
  company?: string;
}

export interface Message {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  timestamp: number;
}

export interface QAScore {
  question: string;
  answer: string;
  score: number;
  feedback: string;
  improvement: string;
  referenceAnswer: string;
}

export interface InterviewReport {
  config: InterviewConfig;
  qa_scores: QAScore[];
  overall_score: number;
  overall_feedback: string;
  strengths: string[];
  weaknesses: string[];
  summary: string;
  total_questions: number;
  duration_minutes: number;
}

export interface InterviewSession {
  id: string;
  config: InterviewConfig;
  messages: Message[];
  status: 'in_progress' | 'completed';
  report?: InterviewReport;
  createdAt: number;
}