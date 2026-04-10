import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Alert, ActivityIndicator, Modal, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getFirestore, collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { criarPerfil } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';

const db = getFirestore();
const auth = getAuth();

export default function UtilizadoresScreen() {
  const { perfil } = useAuth();
  const [utilizadores, setUtilizadores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [novoEmail, setNovoEmail] = useState('');
  const [novoNome, setNovoNome] = useState('');
  const [novoPassword, setNovoPassword] = useState('');
  const [novoRole, setNovoRole] = useState('viewer');
  const [criando, setCriando] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'utilizadores'), (snap) => {
      setUtilizadores(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const criarUtilizador = async () => {
    if (!novoEmail.trim() || !novoPassword || !novoNome.trim()) {
      Alert.alert('Atenção', 'Preenche todos os campos.');
      return;
    }
    setCriando(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, novoEmail.trim(), novoPassword);
      await criarPerfil(cred.user.uid, novoEmail.trim(), novoNome.trim(), novoRole);
      setModalVisible(false);
      setNovoEmail(''); setNovoNome(''); setNovoPassword(''); setNovoRole('viewer');
      Alert.alert('✅', `Utilizador ${novoNome} criado com sucesso.`);
    } catch (e) {
      const msgs = {
        'auth/email-already-in-use': 'Este email já está em uso.',
        'auth/weak-password': 'Password fraca (mínimo 6 caracteres).',
        'auth/invalid-email': 'Email inválido.',
      };
      Alert.alert('Erro', msgs[e.code] || e.message);
    } finally {
      setCriando(false);
    }
  };

  const alterarRole = (uid, roleAtual) => {
    const novaRole = roleAtual === 'editor' ? 'viewer' : 'editor';
    Alert.alert(
      'Alterar Perfil',
      `Mudar para ${novaRole === 'editor' ? 'Editor' : 'Consultor'}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            await updateDoc(doc(db, 'utilizadores', uid), { role: novaRole });
          },
        },
      ]
    );
  };

  if (perfil?.role !== 'admin') {
    return (
      <View style={styles.centered}>
        <Ionicons name="lock-closed" size={48} color={colors.border} />
        <Text style={styles.semAcesso}>Sem acesso a esta secção.</Text>
      </View>
    );
  }

  const renderUser = ({ item }) => (
    <View style={styles.row}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{item.nome?.charAt(0).toUpperCase() || '?'}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.nome}>{item.nome}</Text>
        <Text style={styles.email}>{item.email}</Text>
      </View>
      <TouchableOpacity
        style={[styles.roleBadge, item.role === 'editor' ? styles.roleEditor : styles.roleViewer]}
        onPress={() => alterarRole(item.id, item.role)}
      >
        <Ionicons
          name={item.role === 'editor' ? 'create' : 'eye'}
          size={12}
          color={colors.white}
        />
        <Text style={styles.roleText}>
          {item.role === 'editor' ? 'Editor' : item.role === 'admin' ? 'Admin' : 'Consultor'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        contentContainerStyle={styles.list}
        data={utilizadores}
        keyExtractor={(item) => item.id}
        renderItem={renderUser}
        ListEmptyComponent={
          !loading && (
            <View style={styles.centered}>
              <Text style={styles.vazio}>Nenhum utilizador registado.</Text>
            </View>
          )
        }
      />

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Ionicons name="person-add" size={26} color={colors.white} />
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Novo Utilizador</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <TextInput style={styles.input} placeholder="Nome" value={novoNome} onChangeText={setNovoNome} />
            <TextInput style={styles.input} placeholder="Email" value={novoEmail} onChangeText={setNovoEmail} keyboardType="email-address" autoCapitalize="none" />
            <TextInput style={styles.input} placeholder="Password (mín. 6 caracteres)" value={novoPassword} onChangeText={setNovoPassword} secureTextEntry />

            <Text style={styles.roleLabel}>Perfil:</Text>
            <View style={styles.roleRow}>
              {['viewer', 'editor'].map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[styles.roleChip, novoRole === r && styles.roleChipActive]}
                  onPress={() => setNovoRole(r)}
                >
                  <Ionicons name={r === 'editor' ? 'create' : 'eye'} size={16} color={novoRole === r ? colors.white : colors.textLight} />
                  <Text style={[styles.roleChipText, novoRole === r && styles.roleChipTextActive]}>
                    {r === 'editor' ? 'Editor' : 'Consultor'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={[styles.btnCriar, criando && { opacity: 0.6 }]} onPress={criarUtilizador} disabled={criando}>
              {criando ? <ActivityIndicator color={colors.white} /> : <Text style={styles.btnCriarText}>Criar Utilizador</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: 16 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 12 },
  semAcesso: { color: colors.textLight, fontSize: 16 },
  vazio: { color: colors.textLight, fontSize: 15 },
  row: {
    backgroundColor: colors.white, borderRadius: 12, padding: 14, marginBottom: 10,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2,
  },
  avatar: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: colors.white, fontSize: 18, fontWeight: '700' },
  info: { flex: 1 },
  nome: { fontSize: 15, fontWeight: '700', color: colors.text },
  email: { fontSize: 12, color: colors.textLight, marginTop: 2 },
  roleBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
  },
  roleEditor: { backgroundColor: colors.primary },
  roleViewer: { backgroundColor: colors.textLight },
  roleText: { color: colors.white, fontSize: 12, fontWeight: '700' },
  fab: {
    position: 'absolute', bottom: 24, right: 24,
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 6,
  },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal: { backgroundColor: colors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, gap: 12 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  input: {
    borderWidth: 1.5, borderColor: colors.border, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15,
  },
  roleLabel: { fontSize: 14, fontWeight: '600', color: colors.text },
  roleRow: { flexDirection: 'row', gap: 12 },
  roleChip: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, borderWidth: 1.5, borderColor: colors.border, borderRadius: 10, paddingVertical: 12,
  },
  roleChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  roleChipText: { fontSize: 14, color: colors.textLight, fontWeight: '600' },
  roleChipTextActive: { color: colors.white },
  btnCriar: { backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  btnCriarText: { color: colors.white, fontSize: 16, fontWeight: '700' },
});
