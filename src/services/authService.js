import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';

export async function login(email, password) {
  const auth = getAuth();
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function logout() {
  const auth = getAuth();
  await signOut(auth);
}

export function ouvirAuthState(callback) {
  const auth = getAuth();
  return onAuthStateChanged(auth, callback);
}

export async function obterPerfil(uid) {
  const db = getFirestore();
  const ref = doc(db, 'utilizadores', uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return snap.data();
  return null;
}

export async function criarPerfil(uid, email, nome, role) {
  const db = getFirestore();
  const ref = doc(db, 'utilizadores', uid);
  await setDoc(ref, { email, nome, role, criadoEm: new Date().toISOString() });
}

export async function registar(email, password) {
  const auth = getAuth();
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function resetPassword(email) {
  const auth = getAuth();
  await sendPasswordResetEmail(auth, email);
}
