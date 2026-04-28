export type Role = 'admin' | 'user';

export interface User {
    uid: string;
    email: string;
    name?: string;
    role: Role;
    coins?: number;
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
    correctAnswer: number;
    createdAt: any;
}

export interface TestResult {
    id?: string;
    userId: string;
    subjectId: string;
    subjectTitle: string;
    score: number;
    total: number;
    timeSpent: number;
    createdAt: any;
    detailedResults?: {
        question: string;
        options: string[];
        selectedOption: number;
        correctOption: number;
        isCorrect: boolean;
    }[];
}

export interface ShopItem {
    id: string;
    name: string;
    description: string;
    price: number;
    icon: string;
    category: 'theme' | 'avatar' | 'badge' | 'other';
    available: boolean;
    createdAt: any;
}
