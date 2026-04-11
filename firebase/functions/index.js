const functions = require('firebase-functions');
const admin = require('firebase-admin');
const fetch = require('node-fetch');

admin.initializeApp();
const db = admin.firestore();

// ─── CONFIG TELEGRAM ──────────────────────────────────────────────────────────
// Define via: firebase functions:config:set telegram.token="TOKEN" telegram.chat_id="CHAT_ID"
const TELEGRAM_TOKEN = functions.config().telegram?.token || '';
const CHAT_ID = functions.config().telegram?.chat_id || '';

async function enviarTelegram(mensagem) {
  if (!TELEGRAM_TOKEN || !CHAT_ID) {
    console.warn('⚠️ Telegram não configurado.');
    return;
  }
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: mensagem,
        parse_mode: 'Markdown',
      }),
    });
    console.log('✅ Mensagem Telegram enviada.');
  } catch (e) {
    console.error('❌ Erro Telegram:', e.message);
  }
}

async function enviarPushNotifications(titulo, corpo) {
  try {
    const usersSnap = await db.collection('utilizadores').get();
    const tokens = usersSnap.docs
      .map((d) => d.data().pushToken)
      .filter((t) => t && t.startsWith('ExponentPushToken'));

    if (tokens.length === 0) return;

    const messages = tokens.map((token) => ({
      to: token,
      title: titulo,
      body: corpo,
      sound: 'default',
      priority: 'high',
    }));

    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(messages),
    });
    console.log(`✅ Push enviado para ${tokens.length} dispositivos.`);
  } catch (e) {
    console.error('❌ Erro push:', e.message);
  }
}

function calcularVencedor(set1, set2, set3, equipaA, equipaB) {
  let setsA = 0;
  let setsB = 0;
  [set1, set2, set3].forEach((s) => {
    if (!s) return;
    const clean = s.replace(/[()]/g, '').split(' ')[0];
    const [a, b] = clean.split('-').map(Number);
    if (a > b) setsA++;
    else if (b > a) setsB++;
  });
  if (setsA > setsB) return `🏆 *${equipaA}* venceu!`;
  if (setsB > setsA) return `🏆 *${equipaB}* venceu!`;
  return '⚖️ O jogo terminou *empatado*!';
}

// ─── TRIGGER: Jogo atualizado ─────────────────────────────────────────────────
exports.onJogoAtualizado = functions.firestore
  .document('jogos/{jogoId}')
  .onWrite(async (change, context) => {
    const antes = change.before.exists ? change.before.data() : null;
    const depois = change.after.exists ? change.after.data() : null;

    if (!depois) return; // Documento apagado

    const { torneio, nivel, equipaA, equipaB, set1, set2, set3, status } = depois;
    const statusAntes = antes?.status;

    if (!torneio || !equipaA || !equipaB) return;

    const sets = [set1, set2, set3].filter(Boolean).join(', ');

    // ── Jogo iniciado ────────────────────────────────────────────────────────
    if (status === 'A Decorrer' && statusAntes !== 'A Decorrer') {
      const mensagem =
        `🏁 *Jogo Iniciado!* 🏁\n\n` +
        `🏆 *Torneio:* ${torneio}${nivel ? ` (${nivel})` : ''}\n` +
        `⚔️ ${equipaA} vs ${equipaB}\n` +
        `📊 *Primeiro Set:* ${set1 || '(0-0)'}`;
      await enviarTelegram(mensagem);
      await enviarPushNotifications('🏁 Jogo Iniciado!', `${equipaA} vs ${equipaB} — ${torneio}`);
      return;
    }

    // ── Sets atualizados (jogo em curso) ─────────────────────────────────────
    if (status === 'A Decorrer' && statusAntes === 'A Decorrer') {
      const setsAntes = [antes.set1, antes.set2, antes.set3].filter(Boolean).join(', ');
      if (sets === setsAntes) return; // Sem alteração nos sets

      // Busca todos os jogos a decorrer para enviar resumo
      const snap = await db.collection('jogos')
        .where('status', '==', 'A Decorrer')
        .get();

      if (snap.empty) return;

      let mensagem = `🔄 *Resumo — Jogos a Decorrer* 🔄\n\n`;
      snap.docs.forEach((doc, i) => {
        const j = doc.data();
        const s = [j.set1, j.set2, j.set3].filter(Boolean).join(', ') || 'N/A';
        mensagem += `*Jogo ${i + 1}*\n`;
        mensagem += `🏆 ${j.torneio}${j.nivel ? ` (${j.nivel})` : ''}\n`;
        mensagem += `⚔️ *${j.equipaA}* vs *${j.equipaB}*\n`;
        mensagem += `📊 Sets: ${s}\n\n`;
      });

      await enviarTelegram(mensagem);
      await enviarPushNotifications(
        '📊 Resultado atualizado',
        `${equipaA} vs ${equipaB} — Sets: ${sets || 'N/A'}`
      );
      return;
    }

    // ── Jogo terminado ───────────────────────────────────────────────────────
    if (status === 'Terminado' && statusAntes !== 'Terminado') {
      const vencedor = calcularVencedor(set1, set2, set3, equipaA, equipaB);
      const mensagem =
        `🏁 *Jogo Terminado!* 🏁\n\n` +
        `🏆 *Torneio:* ${torneio}${nivel ? ` (${nivel})` : ''}\n` +
        `⚔️ ${equipaA} vs ${equipaB}\n` +
        `📊 *Resultados:* ${sets || 'N/A'}\n` +
        `${vencedor}`;
      await enviarTelegram(mensagem);
      await enviarPushNotifications('🏆 Jogo Terminado!', `${equipaA} vs ${equipaB} — ${vencedor.replace(/[*_]/g, '')}`);
    }
  });

// ─── WEBHOOK: Receber comandos Telegram ──────────────────────────────────────
exports.telegramWebhook = functions.https.onRequest(async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  const body = req.body;
  const message = body?.message;

  if (!message) {
    res.status(200).send('OK');
    return;
  }

  const chatId = message.chat?.id;
  const texto = message.text || '';

  if (texto === '/jogos') {
    const snap = await db.collection('jogos')
      .where('status', '==', 'A Decorrer')
      .get();

    if (snap.empty) {
      await enviarTelegramDireto(chatId, '✅ Não há jogos a decorrer neste momento!');
    } else {
      let mensagem = '🎾 *Jogos a Decorrer Agora:* 🎾\n\n';
      snap.docs.forEach((doc, i) => {
        const j = doc.data();
        const s = [j.set1, j.set2, j.set3].filter(Boolean).join(', ') || 'N/A';
        mensagem += `*${i + 1}.* ${j.torneio}${j.nivel ? ` (${j.nivel})` : ''}\n`;
        mensagem += `⚔️ ${j.equipaA} vs ${j.equipaB}\n`;
        mensagem += `📊 Sets: ${s}\n\n`;
      });
      await enviarTelegramDireto(chatId, mensagem);
    }
  } else if (texto === '/resultados') {
    const snap = await db.collection('jogos')
      .where('status', '==', 'Terminado')
      .orderBy('updatedAt', 'desc')
      .limit(5)
      .get();

    if (snap.empty) {
      await enviarTelegramDireto(chatId, '📋 Sem resultados ainda.');
    } else {
      let mensagem = '🏆 *Últimos Resultados:* 🏆\n\n';
      snap.docs.forEach((doc, i) => {
        const j = doc.data();
        const s = [j.set1, j.set2, j.set3].filter(Boolean).join(', ') || 'N/A';
        mensagem += `*${i + 1}.* ${j.torneio}\n`;
        mensagem += `⚔️ ${j.equipaA} vs ${j.equipaB}\n`;
        mensagem += `📊 ${s}\n\n`;
      });
      await enviarTelegramDireto(chatId, mensagem);
    }
  } else if (texto === '/ajuda' || texto === '/start') {
    const mensagem =
      `🎾 *Padel SERUL Bot* 🎾\n\n` +
      `Comandos disponíveis:\n` +
      `📌 /jogos — Jogos a decorrer agora\n` +
      `📌 /resultados — Últimos 5 resultados\n` +
      `📌 /ajuda — Esta mensagem`;
    await enviarTelegramDireto(chatId, mensagem);
  }

  res.status(200).send('OK');
});

async function enviarTelegramDireto(chatId, mensagem) {
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: mensagem, parse_mode: 'Markdown' }),
  });
}
