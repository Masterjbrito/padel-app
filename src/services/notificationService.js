import { Platform } from 'react-native';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';
import Constants from 'expo-constants';

// Será importado condicionalmente para não quebrar web
let Notifications;
try {
  Notifications = require('expo-notifications');
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
} catch (e) {
  // expo-notifications não disponível (web ou não instalado)
}

async function configurarCanalAndroid() {
  if (Platform.OS !== 'android' || !Notifications) return;
  await Notifications.setNotificationChannelAsync('default', {
    name: 'Padel SERUL',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#0066cc',
  });
}

export async function registarNotificacoes(uid) {
  if (Platform.OS === 'web' || !Notifications) return null;

  try {
    await configurarCanalAndroid();

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') return null;

    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;

    if (uid && token) {
      const db = getFirestore();
      await updateDoc(doc(db, 'utilizadores', uid), { pushToken: token });
    }

    return token;
  } catch (e) {
    console.warn('Notificações não disponíveis:', e.message);
    return null;
  }
}

export function adicionarListenerNotificacao(handler) {
  if (!Notifications) return () => {};
  const sub = Notifications.addNotificationReceivedListener(handler);
  return () => sub.remove();
}
