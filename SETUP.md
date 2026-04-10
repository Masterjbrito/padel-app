# Padel SERUL — Setup Completo

## 1. Instalar ferramentas necessárias

### Node.js (já tens)
```
node --version  ✅
```

### Expo CLI
```bash
npm install -g expo-cli eas-cli
```

### Firebase CLI
```bash
npm install -g firebase-tools
firebase login
```

---

## 2. Criar projeto Firebase

1. Vai a https://console.firebase.google.com
2. Clica **"Adicionar projeto"** → nome: `padel-serul`
3. Ativa **Firestore** → modo produção
4. Clica no ícone **</>** (Web) → regista a app
5. Copia o objeto `firebaseConfig`

---

## 3. Configurar a app

Abre `src/services/firebaseService.js` e substitui:

```js
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "padel-serul.firebaseapp.com",
  projectId: "padel-serul",
  storageBucket: "padel-serul.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123",
};
```

---

## 4. Instalar dependências e testar

```bash
cd C:\Users\jbrito\Documents\padel-app
npm install
npm start
```

Aparece um **QR Code**. Instala **Expo Go** no telemóvel (Play Store) e lê o código.
A app abre no teu telemóvel imediatamente! ✅

---

## 5. Deploy das Cloud Functions (Telegram)

```bash
cd firebase
npm install -g firebase-tools
firebase init         # seleciona Functions e Firestore
firebase use --add    # associa ao projeto padel-serul

cd functions
npm install

# Configurar token Telegram
firebase functions:config:set telegram.token="7584427474:AAH0qhGlfJ6Cim8SjaYOJ7RiSIFYO7hvdfg"
firebase functions:config:set telegram.chat_id="-1002481261935"

# Deploy
firebase deploy --only functions
```

---

## 6. Configurar Webhook Telegram

Depois do deploy, copia o URL da função `telegramWebhook` (aparece no terminal).

Corre este comando (substituindo o URL):
```bash
curl -X POST "https://api.telegram.org/bot7584427474:AAH0qhGlfJ6Cim8SjaYOJ7RiSIFYO7hvdfg/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://REGIAO-padel-serul.cloudfunctions.net/telegramWebhook"}'
```

---

## 7. Build APK para Android

```bash
# Instala EAS CLI
npm install -g eas-cli
eas login

# Configura o build
eas build:configure

# Gera APK (para instalar diretamente no telemóvel)
eas build -p android --profile preview

# OU gera AAB para Google Play Store
eas build -p android --profile production
```

---

## Estrutura da base de dados (Firestore)

```
jogos/
  {jogoId}/
    torneio:    "Torneio Verão 2025"
    nivel:      "M4"
    equipaA:    "Brito / Regueira"
    equipaB:    "Hugo / Tiago"
    jogador1A:  "Brito"
    jogador2A:  "Regueira"
    jogador1B:  "Hugo"
    jogador2B:  "Tiago"
    set1:       "(6-4)"
    set2:       "(3-6)"
    set3:       "(7-6) (final após tie-break)"
    status:     "Terminado"  // Futuro | A Decorrer | Terminado
    createdAt:  timestamp
    updatedAt:  timestamp
```

---

## Comandos Telegram disponíveis

| Comando | Resposta |
|---|---|
| `/jogos` | Lista jogos a decorrer agora |
| `/resultados` | Últimos 5 resultados |
| `/ajuda` | Lista de comandos |

---

## Migrar dados do Google Sheets (opcional)

Se quiseres migrar os jogos existentes do Sheets para o Firestore,
diz-me e faço um script de migração.
