import { signInWithEmailAndPassword, signOut, onAuthStateChanged, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebaseClient';

export async function login(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function logout() {
  await signOut(auth);
}

export function ouvirAuthState(callback) {
  return onAuthStateChanged(auth, callback);
}

export async function obterPerfil(uid) {
  const ref = doc(db, 'utilizadores', uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return snap.data();
  return null;
}

export async function criarPerfil(uid, email, nome, role) {
  const ref = doc(db, 'utilizadores', uid);
  await setDoc(ref, { email, nome, role, criadoEm: new Date().toISOString() });
}

export async function registar(email, password) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function resetPassword(email) {
  await sendPasswordResetEmail(auth, email);
}
