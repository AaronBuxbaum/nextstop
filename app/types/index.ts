// Core types for the NextStop application

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  location: string;
  startTime?: string; // Time in HH:MM format or ISO string
  endTime?: string;
  duration?: number; // Duration in minutes
  notes?: string;
  tags?: string[];
  position?: number;
  isOptional?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DecisionLogic {
  id: string;
  type: 'time' | 'weather' | 'preference' | 'budget' | 'custom';
  condition: string;
  description?: string;
}

export interface BranchOption {
  id: string;
  label: string;
  description?: string;
  events: Event[];
  decisionLogic?: DecisionLogic;
}

export interface Branch {
  id: string;
  title: string;
  description?: string;
  options: BranchOption[];
  previousEventId?: string;
  nextEventId?: string;
}

export interface Collaborator {
  id: string;
  name?: string;
  email?: string;
  role?: string;
}

export interface Plan {
  id: string;
  title: string;
  description?: string;
  date?: string; // Plan date in YYYY-MM-DD format
  theme?: string;
  userId: string;
  events: Event[];
  branches: Branch[];
  optionalEvents: Event[];
  collaborators: Collaborator[];
  isPublic: boolean;
  showDriving?: boolean;
  event_count?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CollaborationSession {
  planId: string;
  activeUsers: {
    userId: string;
    userName: string;
    lastActive: Date;
  }[];
  currentlyEditing: {
    userId: string;
    elementId: string;
    elementType: 'event' | 'branch' | 'plan';
  }[];
}

export interface AIAnalysis {
  pacing: {
    rating: number; // 0-10
    feedback: string;
    suggestions: string[];
  };
  quality: {
    rating: number; // 0-10
    feedback: string;
    improvements: string[];
  };
  theme: {
    suggested: string;
    coherence: number; // 0-10
    description: string;
  };
}

export interface AISuggestion {
  id: string;
  type: 'event' | 'modification' | 'theme' | 'pacing';
  title: string;
  description: string;
  event?: Partial<Event>;
  reasoning: string;
}
