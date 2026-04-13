import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebaseClient';

const COLECAO = 'jogos';

// ─── LISTENERS REAL-TIME ─────────────────────────────────────────────────────

export function ouvirJogosAndamento(callback) {
  const q = query(collection(db, COLECAO), where('status', '==', 'A Decorrer'));
  return onSnapshot(q, (snap) => {
    const jogos = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(jogos);
  });
}

export function ouvirJogosFuturos(callback) {
  const q = query(collection(db, COLECAO), where('status', '==', 'Futuro'));
  return onSnapshot(q, (snap) => {
    const jogos = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(jogos);
  });
}

export function ouvirJogosTerminados(callback) {
  const q = query(collection(db, COLECAO), where('status', '==', 'Terminado'));
  return onSnapshot(q, (snap) => {
    const jogos = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(jogos);
  });
}

// ─── OPERAÇÕES CRUD ───────────────────────────────────────────────────────────

export async function adicionarJogo(dados) {
  return addDoc(collection(db, COLECAO), {
    ...dados,
    status: 'Futuro',
    set1: '',
    set2: '',
    set3: '',
    equipaA: '',
    equipaB: '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function atualizarJogo(id, dados) {
  const ref = doc(db, COLECAO, id);
  return updateDoc(ref, {
    ...dados,
    updatedAt: serverTimestamp(),
  });
}

export async function iniciarJogo(id, jogador1A, jogador2A, jogador1B, jogador2B, nivel) {
  const equipaA = `${jogador1A} / ${jogador2A}`;
  const equipaB = `${jogador1B} / ${jogador2B}`;
  const ref = doc(db, COLECAO, id);
  return updateDoc(ref, {
    jogador1A,
    jogador2A,
    jogador1B,
    jogador2B,
    equipaA,
    equipaB,
    nivel,
    status: 'A Decorrer',
    updatedAt: serverTimestamp(),
  });
}

export async function terminarJogo(id, set1, set2, set3) {
  const ref = doc(db, COLECAO, id);
  return updateDoc(ref, {
    set1,
    set2,
    set3,
    status: 'Terminado',
    updatedAt: serverTimestamp(),
  });
}

// ─── ESTATÍSTICAS ─────────────────────────────────────────────────────────────

export async function obterEstatisticas() {
  const q = query(collection(db, COLECAO), where('status', '==', 'Terminado'));
  const snap = await getDocs(q);
  const estatisticas = {};

  snap.docs.forEach((d) => {
    const jogo = d.data();
    const { set1, set2, set3, jogador1A, jogador2A, jogador1B, jogador2B, nivel } = jogo;

    let setsA = 0;
    let setsB = 0;

    [set1, set2, set3].forEach((s) => {
      if (!s) return;
      const clean = s.replace(/[()]/g, '').split(' ')[0];
      const [a, b] = clean.split('-').map(Number);
      if (a > b) setsA++;
      else if (b > a) setsB++;
    });

    const equipaAVenceu = setsA > setsB;

    const registar = (nome, ganhou) => {
      if (!nome) return;
      if (/^adv\s*\d*/i.test(nome.trim())) return; // ignorar adversários externos
      if (!estatisticas[nome]) {
        estatisticas[nome] = { jogador: nome, ganhos: 0, perdidos: 0, nivel: nivel || '' };
      }
      if (ganhou) estatisticas[nome].ganhos++;
      else estatisticas[nome].perdidos++;
      if (nivel) estatisticas[nome].nivel = nivel;
    };

    [jogador1A, jogador2A].forEach((n) => registar(n, equipaAVenceu));
    [jogador1B, jogador2B].forEach((n) => registar(n, !equipaAVenceu));
  });

  return Object.values(estatisticas).sort((a, b) => b.ganhos - a.ganhos);
}

export async function apagarJogo(id) {
  const ref = doc(db, COLECAO, id);
  return deleteDoc(ref);
}

// ─── JOGOS DE UM JOGADOR ──────────────────────────────────────────────────────
export async function obterJogosJogador(nome) {
  const q = query(collection(db, COLECAO), where('status', '==', 'Terminado'));
  const snap = await getDocs(q);

  const jogos = snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((j) => [j.jogador1A, j.jogador2A, j.jogador1B, j.jogador2B].includes(nome))
    .sort((a, b) => {
      const ta = a.updatedAt?.seconds || a.createdAt?.seconds || 0;
      const tb = b.updatedAt?.seconds || b.createdAt?.seconds || 0;
      return tb - ta;
    });

  return jogos;
}
