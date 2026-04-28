
import type { User } from '../types';

const STORAGE_KEY_USERS = 'fasttest_users';
const STORAGE_KEY_CURRENT_USER = 'fasttest_current_user';
const STORAGE_KEY_SUBJECTS = 'fasttest_subjects';
const STORAGE_KEY_TESTS = 'fasttest_tests';
const STORAGE_KEY_RESULTS = 'fasttest_results';

// Helper to get data from localStorage
const getLocal = (key: string) => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(key);
    
    // Seed initial data if empty
    if (!data) {
        if (key === STORAGE_KEY_SUBJECTS) {
            const initialSubjects = [
                { id: 'math-01', title: 'Matematika', description: 'Logika, Algebra va Geometriya masalalari.', createdAt: new Date().toISOString() },
                { id: 'history-01', title: 'Tarix', description: 'O\'zbekiston va Jahon tarixidan muhim voqealar.', createdAt: new Date().toISOString() },
                { id: 'english-01', title: 'Ingliz tili', description: 'Grammatika va so\'z boyligini tekshirish.', createdAt: new Date().toISOString() },
                { id: 'info-01', title: 'Informatika', description: 'Kompyuter savodxonligi va dasturlash asoslari.', createdAt: new Date().toISOString() }
            ];
            localStorage.setItem(STORAGE_KEY_SUBJECTS, JSON.stringify(initialSubjects));
            return initialSubjects;
        }
        if (key === STORAGE_KEY_TESTS) {
            const initialTests = [
                // Math
                { id: 'q1', subjectId: 'math-01', question: '2 + 2 * 2 necha bo\'ladi?', options: ['4', '6', '8', '0'], correctAnswer: 1 },
                { id: 'q2', subjectId: 'math-01', question: 'Kvadratning yuzi 64 sm² bo\'lsa, uning tomoni necha sm?', options: ['6', '7', '8', '9'], correctAnswer: 2 },
                { id: 'q3', subjectId: 'math-01', question: 'Uchburchakning ichki burchaklari yig\'indisi?', options: ['90', '180', '270', '360'], correctAnswer: 1 },
                
                // History
                { id: 'q4', subjectId: 'history-01', question: 'Amir Temur nechanchi yilda tug\'ilgan?', options: ['1336', '1340', '1405', '1300'], correctAnswer: 0 },
                { id: 'q5', subjectId: 'history-01', question: 'Alisher Navoiy yashagan asr?', options: ['14-asr', '15-asr', '16-asr', '13-asr'], correctAnswer: 1 },
                
                // English
                { id: 'q6', subjectId: 'english-01', question: 'I ___ to the cinema yesterday.', options: ['go', 'gone', 'went', 'going'], correctAnswer: 2 },
                { id: 'q7', subjectId: 'english-01', question: 'Which one is a fruit?', options: ['Carrot', 'Apple', 'Potato', 'Cucumber'], correctAnswer: 1 },
                
                // Info
                { id: 'q8', subjectId: 'info-01', question: 'Kompyuterning "miyasi" nima?', options: ['RAM', 'Monitor', 'CPU', 'HDD'], correctAnswer: 2 },
                { id: 'q9', subjectId: 'info-01', question: 'HTML nima qisqartmasi?', options: ['Hyper Text Markup Language', 'High Tech Modern Language', 'Hyper Tool Main Link', 'Hyper Text Main Line'], correctAnswer: 0 }
            ];
            localStorage.setItem(STORAGE_KEY_TESTS, JSON.stringify(initialTests));
            return initialTests;
        }
    }
    
    return data ? JSON.parse(data) : [];
};

// Helper to save data to localStorage
const setLocal = (key: string, data: any) => {
    if (typeof window !== 'undefined') {
        localStorage.setItem(key, JSON.stringify(data));
    }
};

export const mockAuth = {
    onAuthStateChanged: (callback: (user: any) => void) => {
        if (typeof window === 'undefined') return () => {};
        
        const checkAuth = () => {
            const currentUser = localStorage.getItem(STORAGE_KEY_CURRENT_USER);
            callback(currentUser ? JSON.parse(currentUser) : null);
        };
        
        checkAuth();
        window.addEventListener('storage', checkAuth);
        return () => window.removeEventListener('storage', checkAuth);
    },
    
    createUserWithEmailAndPassword: async (email: string) => {
        const users = getLocal(STORAGE_KEY_USERS);
        const existingUser = users.find((u: any) => u.email === email);
        if (existingUser) throw new Error("User already exists");
        
        const newUser = {
            uid: Math.random().toString(36).substring(7),
            email,
            createdAt: new Date().toISOString()
        };
        
        users.push(newUser);
        setLocal(STORAGE_KEY_USERS, users);
        return { user: newUser };
    },
    
    signInWithEmailAndPassword: async (email: string) => {
        const users = getLocal(STORAGE_KEY_USERS);
        let user = users.find((u: any) => u.email === email);
        
        if (!user) {
            user = {
                uid: Math.random().toString(36).substring(7),
                email,
                role: (email === 'guest@example.com' || email === 'admin@example.com') ? 'admin' : 'user',
                createdAt: new Date().toISOString()
            };
            users.push(user);
            setLocal(STORAGE_KEY_USERS, users);
        } else {
            // Update role if admin
            if ((email === 'guest@example.com' || email === 'admin@example.com') && user.role !== 'admin') {
                user.role = 'admin';
                setLocal(STORAGE_KEY_USERS, users);
            }
        }
        
        // Ensure user exists in users collection for getDoc compatibility
        const dbUsers = getLocal('fasttest_users');
        if (!dbUsers.find((u: any) => u.uid === user.uid)) {
            dbUsers.push(user);
            setLocal('fasttest_users', dbUsers);
        }
        
        setLocal(STORAGE_KEY_CURRENT_USER, user);
        window.dispatchEvent(new Event('storage'));
        return { user };
    },
    
    signOut: async () => {
        localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
        window.dispatchEvent(new Event('storage'));
    }
};

export const mockDb = {
    getDoc: async (collection: string, id: string) => {
        const items = getLocal(`fasttest_${collection}`);
        const item = items.find((i: any) => i.uid === id || i.id === id);
        return {
            exists: () => !!item,
            data: () => item
        };
    },
    
    setDoc: async (collection: string, id: string, data: any) => {
        const items = getLocal(`fasttest_${collection}`);
        const index = items.findIndex((i: any) => i.uid === id || i.id === id);
        
        const newItem = { ...data, uid: id, id };
        if (index > -1) {
            items[index] = newItem;
        } else {
            items.push(newItem);
        }
        
        setLocal(`fasttest_${collection}`, items);
    },
    
    getDocs: async (collection: string) => {
        const items = getLocal(`fasttest_${collection}`);
        return {
            docs: items.map((item: any) => ({
                id: item.id || item.uid,
                data: () => item
            })),
            size: items.length
        };
    }
};
