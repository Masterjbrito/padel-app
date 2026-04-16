// Script utilitário para atualizar pushToken de todos os utilizadores existentes sem pushToken
import { getDocs, collection, doc } from 'firebase/firestore';
import { db } from '../services/firebaseClient';
import { registarNotificacoes } from '../services/notificationService';

async function atualizarTokensEmMassa() {
  const snap = await getDocs(collection(db, 'utilizadores'));
  for (const d of snap.docs) {
    const data = d.data();
    if (!data.pushToken) {
      console.log(`Atualizando pushToken para: ${d.id} (${data.email})`);
      await registarNotificacoes(d.id);
    }
  }
  console.log('Processo concluído.');
}

atualizarTokensEmMassa();