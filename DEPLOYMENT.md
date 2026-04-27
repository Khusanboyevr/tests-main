# Deployment Guide: FastTest Platform

Follow these steps to deploy your production-ready online test platform.

## 1. Firebase Project Setup
1. Go to [Firebase Console](https://console.firebase.google.com/).
2. Create a new project.
3. Enable **Authentication**:
   - Go to "Authentication" -> "Sign-in method".
   - Enable "Email/Password".
4. Enable **Cloud Firestore**:
   - Go to "Firestore Database" -> "Create database".
   - Start in **Production Mode**.
   - Select a location closest to your users.
5. Create a **Web App** in Firebase:
   - Go to Project Settings -> General.
   - Click the `</>` icon to add a web app.
   - Copy the `firebaseConfig` values.

## 2. Environment Variables
In your local development, ensure `.env.local` is populated. For production, you will add these to Vercel.

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_val
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_val
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_val
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_val
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_val
NEXT_PUBLIC_FIREBASE_APP_ID=your_val
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_val
NEXT_PUBLIC_ADMIN_EMAIL=admin@example.com
```

## 3. Deploy to Vercel
1. Push your code to a GitHub repository.
2. Go to [Vercel Dashboard](https://vercel.com/dashboard).
3. Click "New Project" and import your repository.
4. In "Environment Variables", add all the keys from `.env.local`.
5. Click **Deploy**.

## 4. Firestore Security Rules
1. In Firebase Console, go to **Firestore Database** -> **Rules**.
2. Copy the content from `firestore.rules` in your project and paste it here.
3. Click **Publish**.

## 5. Initial Admin Setup
1. Register a user on your deployed site using the same email you set in `NEXT_PUBLIC_ADMIN_EMAIL`.
2. The registration logic automatically assigns the `admin` role to this email.
3. You can now access `/admin` to start creating subjects and tests.

---
**Note:** For production, ensure you restrict your Firebase API Key in the Google Cloud Console to only your domain.
