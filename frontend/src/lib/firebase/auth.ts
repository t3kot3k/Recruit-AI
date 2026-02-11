import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
  User,
  UserCredential,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp, FieldValue } from "firebase/firestore";
import { auth, db, googleProvider } from "./config";

// Types
export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  plan: "free" | "premium";
  freeUsesRemaining: number;
  stripeCustomerId?: string;
  createdAt: Date;
  consentTerms: boolean;
  consentMarketing: boolean;
}

// Type for creating a new user profile (createdAt is a FieldValue before it becomes a Date)
interface CreateUserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  plan: "free" | "premium";
  freeUsesRemaining: number;
  consentTerms: boolean;
  consentMarketing: boolean;
  createdAt: FieldValue;
}

// Helper to ensure Firebase is initialized
function ensureAuth() {
  if (!auth) {
    throw new Error("Firebase Auth is not initialized. Please check your environment configuration.");
  }
  return auth;
}

function ensureDb() {
  if (!db) {
    throw new Error("Firebase Firestore is not initialized. Please check your environment configuration.");
  }
  return db;
}

function ensureGoogleProvider() {
  if (!googleProvider) {
    throw new Error("Google Auth Provider is not initialized. Please check your environment configuration.");
  }
  return googleProvider;
}

// Create user profile in Firestore
async function createUserProfile(
  user: User,
  additionalData?: { displayName?: string | null }
) {
  const firestore = ensureDb();
  const userRef = doc(firestore, "users", user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    const profile: CreateUserProfile = {
      uid: user.uid,
      email: user.email,
      displayName: additionalData?.displayName ?? user.displayName,
      photoURL: user.photoURL,
      plan: "free",
      freeUsesRemaining: 3,
      consentTerms: true,
      consentMarketing: false,
      createdAt: serverTimestamp(),
    };

    await setDoc(userRef, profile);
  }

  return userRef;
}

// Sign up with email and password
export async function signUpWithEmail(
  email: string,
  password: string,
  displayName: string
): Promise<UserCredential> {
  const firebaseAuth = ensureAuth();
  const credential = await createUserWithEmailAndPassword(firebaseAuth, email, password);

  // Update display name
  await updateProfile(credential.user, { displayName });

  // Create user profile in Firestore
  await createUserProfile(credential.user, { displayName });

  return credential;
}

// Sign in with email and password
export async function signInWithEmail(
  email: string,
  password: string
): Promise<UserCredential> {
  const firebaseAuth = ensureAuth();
  return signInWithEmailAndPassword(firebaseAuth, email, password);
}

// Sign in with Google
export async function signInWithGoogle(): Promise<UserCredential> {
  const firebaseAuth = ensureAuth();
  const provider = ensureGoogleProvider();
  const credential = await signInWithPopup(firebaseAuth, provider);

  // Create user profile if first time
  await createUserProfile(credential.user);

  return credential;
}

// Sign out
export async function signOut(): Promise<void> {
  const firebaseAuth = ensureAuth();
  return firebaseSignOut(firebaseAuth);
}

// Send password reset email
export async function resetPassword(email: string): Promise<void> {
  const firebaseAuth = ensureAuth();
  return sendPasswordResetEmail(firebaseAuth, email);
}

// Get user profile from Firestore
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const firestore = ensureDb();
  const userRef = doc(firestore, "users", uid);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    return userSnap.data() as UserProfile;
  }

  return null;
}

// Get ID token for backend API calls
export async function getIdToken(): Promise<string | null> {
  const firebaseAuth = ensureAuth();
  const user = firebaseAuth.currentUser;
  if (user) {
    return user.getIdToken();
  }
  return null;
}
