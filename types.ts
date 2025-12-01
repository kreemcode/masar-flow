export type Language = 'en' | 'ar';

export enum StepType {
  TEXT = 'text',
  MEDIA = 'media',
  GPS = 'gps',
  CHECKLIST = 'checklist'
}

export interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
}

export interface Step {
  id: string;
  title: string;
  type: StepType;
  content: string; // For text: content, For media: url/description, For GPS: 'lat,lng'
  checklistItems?: ChecklistItem[]; // Only for checklist type
  completed?: boolean;
}

export interface Workflow {
  id?: number; // Auto-incremented by Dexie
  title: string;
  description: string;
  isPrivate: boolean;
  createdAt: number;
  steps: Step[];
}

export interface Translation {
  [key: string]: {
    en: string;
    ar: string;
  };
}