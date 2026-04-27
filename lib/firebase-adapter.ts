
import * as firebaseAuth from "firebase/auth";
import * as firebaseFirestore from "firebase/firestore";
import { auth, db, isFirebaseConfigured } from "./firebase";

// Auth Functions
export const onAuthStateChanged = (cb: any, callback?: any) => {
    // If called as onAuthStateChanged(auth, callback) or onAuthStateChanged(callback)
    const actualCb = typeof cb === 'function' ? cb : callback;
    if (isFirebaseConfigured) {
        return firebaseAuth.onAuthStateChanged(auth, actualCb);
    } else {
        return auth.onAuthStateChanged(actualCb);
    }
};

export const createUserWithEmailAndPassword = async (a: any, email: string, pass: string) => {
    if (isFirebaseConfigured) return firebaseAuth.createUserWithEmailAndPassword(a, email, pass);
    return auth.createUserWithEmailAndPassword(email);
};

export const signInWithEmailAndPassword = async (a: any, email: string, pass: string) => {
    if (isFirebaseConfigured) return firebaseAuth.signInWithEmailAndPassword(a, email, pass);
    return auth.signInWithEmailAndPassword(email);
};

// Firestore Functions
export const doc = (d: any, collection: string, id: string) => {
    if (isFirebaseConfigured) return firebaseFirestore.doc(d, collection, id);
    return { _path: { segments: [collection, id] } };
};

export const collection = (d: any, collection: string) => {
    if (isFirebaseConfigured) return firebaseFirestore.collection(d, collection);
    return { _collection: { path: { segments: [collection] } } };
};

export const query = (colRef: any, ...constraints: any[]) => {
    if (isFirebaseConfigured) return firebaseFirestore.query(colRef, ...constraints);
    return { ...colRef, _constraints: constraints };
};

export const where = (field: string, op: any, value: any) => {
    if (isFirebaseConfigured) return firebaseFirestore.where(field, op, value);
    return { type: 'where', field, op, value };
};

export const orderBy = (field: string, direction: any = 'asc') => {
    if (isFirebaseConfigured) return firebaseFirestore.orderBy(field, direction);
    return { type: 'orderBy', field, direction };
};

export const limit = (n: number) => {
    if (isFirebaseConfigured) return firebaseFirestore.limit(n);
    return { type: 'limit', n };
};

export const getDoc = async (docRef: any) => {
    if (isFirebaseConfigured) return firebaseFirestore.getDoc(docRef);
    const [collection, id] = docRef._path.segments;
    return db.getDoc(collection, id);
};

export const setDoc = async (docRef: any, data: any) => {
    if (isFirebaseConfigured) return firebaseFirestore.setDoc(docRef, data);
    const [collection, id] = docRef._path.segments;
    return db.setDoc(collection, id, data);
};

export const getDocs = async (q: any) => {
    if (isFirebaseConfigured) return firebaseFirestore.getDocs(q);
    const collection = q._collection?.path?.segments[0] || q.path?.segments[0] || q._path?.segments[0];
    return db.getDocs(collection);
};

export const addDoc = async (colRef: any, data: any) => {
    if (isFirebaseConfigured) return firebaseFirestore.addDoc(colRef, data);
    const collection = colRef._collection?.path?.segments[0];
    const id = Math.random().toString(36).substring(7);
    await db.setDoc(collection, id, data);
    return { id };
};

export const deleteDoc = async (docRef: any) => {
    if (isFirebaseConfigured) return firebaseFirestore.deleteDoc(docRef);
    const [collection, id] = docRef._path.segments;
    const items = JSON.parse(localStorage.getItem(`fasttest_${collection}`) || '[]');
    const newItems = items.filter((i: any) => i.id !== id && i.uid !== id);
    localStorage.setItem(`fasttest_${collection}`, JSON.stringify(newItems));
};

export const updateDoc = async (docRef: any, data: any) => {
    if (isFirebaseConfigured) return firebaseFirestore.updateDoc(docRef, data);
    const [collection, id] = docRef._path.segments;
    const items = JSON.parse(localStorage.getItem(`fasttest_${collection}`) || '[]');
    const index = items.findIndex((i: any) => i.id === id || i.uid === id);
    if (index > -1) {
        items[index] = { ...items[index], ...data };
        localStorage.setItem(`fasttest_${collection}`, JSON.stringify(items));
    }
};

export const serverTimestamp = () => {
    if (isFirebaseConfigured) return firebaseFirestore.serverTimestamp();
    return { toDate: () => new Date() };
};
