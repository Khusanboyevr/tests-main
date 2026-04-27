export type Role = 'admin' | 'user';

export interface User {
    uid: string;
    email: string;
    role: Role;
    createdAt: any;
}

export interface Subject {
    id: string;
    title: string;
    description: string;
    createdAt: any;
}

export interface TestQuestion {
    id: string;
    subjectId: string;
    question: string;
    options: string[];
    correctAnswer: number; // Index of options array
    createdAt: any;
}

export interface TestResult {
    id?: string;
    userId: string;
    subjectId: string;
    subjectTitle: string;
    score: number;
    total: number;
    timeSpent: number; // in seconds
    createdAt: any;
    detailedResults?: {
        question: string;
        options: string[];
        selectedOption: number;
        correctOption: number;
        isCorrect: boolean;
    }[];
}
