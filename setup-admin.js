/**
 * Corre este script UMA VEZ para criar o perfil admin:
 * node setup-admin.js
 */
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyBH3OhUKUhBachfGNLRl6YpueUmb2m9VBw",
  authDomain: "padel-de6fe.firebaseapp.com",
  projectId: "padel-de6fe",
  storageBucket: "padel-de6fe.firebasestorage.app",
  messagingSenderId: "105537716584",
  appId: "1:105537716584:android:f095b83520141c893596dd",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function setup() {
  const uid = "dC20QTEjSKbHKMTCWeC8qlhdgBm1";

  await setDoc(doc(db, 'utilizadores', uid), {
    nome: "Brito",
    email: "joaocnsbrito@gmail.com", // substitui pelo teu email real
    role: "admin",
    criadoEm: new Date().toISOString(),
  });

  console.log("✅ Perfil admin criado com sucesso!");
  process.exit(0);
}

setup().catch((e) => {
  console.error("❌ Erro:", e.message);
  process.exit(1);
});
