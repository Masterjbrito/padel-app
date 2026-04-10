import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
  TextInput, ActivityIndicator, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';
import { getAuth, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { useAuth } from '../context/AuthContext';
import { logout } from '../services/authService';
import { colors } from '../theme/colors';

const ROLE_LABELS = { admin: 'Administrador', editor: 'Editor', viewer: 'Consultor' };
const ROLE_COLORS = { admin: '#7c3aed', editor: colors.primary, viewer: colors.textLight };

export default function PerfilScreen({ navigation }) {
  const { user, perfil } = useAuth();
  const [editandoNome, setEditandoNome] = useState(false);
  const [novoNome, setNovoNome] = useState(perfil?.nome || '');
  const [salvando, setSalvando] = useState(false);

  const iniciais = (perfil?.nome || user?.email || '?')
    .split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

  const guardarNome = async () => {
    if (!novoNome.trim()) return;
    setSalvando(true);
    try {
      const db = getFirestore();
      await updateDoc(doc(db, 'utilizadores', user.uid), { nome: novoNome.trim() });
      setEditandoNome(false);
      Alert.alert('✅', 'Nome atualizado.');
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível atualizar o nome.');
    } finally {
      setSalvando(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Terminar Sessão',
      'Tens a certeza?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sair', style: 'destructive', onPress: logout },
      ]
    );
  };

  const role = perfil?.role || 'viewer';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* Avatar */}
      <View style={styles.avatarSection}>
        <View style={[styles.avatar, { backgroundColor: ROLE_COLORS[role] }]}>
          <Text style={styles.avatarText}>{iniciais}</Text>
        </View>
        <View style={[styles.roleBadge, { backgroundColor: ROLE_COLORS[role] }]}>
          <Text style={styles.roleText}>{ROLE_LABELS[role] || role}</Text>
        </View>
      </View>

      {/* Dados */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Os meus dados</Text>

        {/* Nome */}
        <View style={styles.campo}>
          <Text style={styles.campoLabel}>Nome</Text>
          {editandoNome ? (
            <View style={styles.editRow}>
              <TextInput
                style={styles.editInput}
                value={novoNome}
                onChangeText={setNovoNome}
                autoFocus
                placeholder="Nome"
              />
              <TouchableOpacity style={styles.btnGuardar} onPress={guardarNome} disabled={salvando}>
                {salvando
                  ? <ActivityIndicator color={colors.white} size="small" />
                  : <Ionicons name="checkmark" size={18} color={colors.white} />
                }
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnCancelar} onPress={() => { setEditandoNome(false); setNovoNome(perfil?.nome || ''); }}>
                <Ionicons name="close" size={18} color={colors.textLight} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.campoRow}>
              <Text style={styles.campoValor}>{perfil?.nome || '—'}</Text>
              <TouchableOpacity onPress={() => setEditandoNome(true)}>
                <Ionicons name="pencil" size={16} color={colors.primary} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.separador} />

        {/* Email */}
        <View style={styles.campo}>
          <Text style={styles.campoLabel}>Email</Text>
          <Text style={styles.campoValor}>{user?.email || '—'}</Text>
        </View>

        <View style={styles.separador} />

        {/* Perfil */}
        <View style={styles.campo}>
          <Text style={styles.campoLabel}>Perfil de acesso</Text>
          <Text style={[styles.campoValor, { color: ROLE_COLORS[role], fontWeight: '700' }]}>
            {ROLE_LABELS[role] || role}
          </Text>
        </View>
      </View>

      {/* Admin — Gerir Utilizadores */}
      {role === 'admin' && (
        <TouchableOpacity
          style={styles.btnAdmin}
          onPress={() => navigation.navigate('Utilizadores')}
        >
          <Ionicons name="people" size={20} color={colors.white} />
          <Text style={styles.btnAdminText}>Gerir Utilizadores</Text>
          <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
      )}

      {/* Logout */}
      <TouchableOpacity style={styles.btnLogout} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color={colors.danger} />
        <Text style={styles.btnLogoutText}>Terminar Sessão</Text>
      </TouchableOpacity>

      <Text style={styles.versao}>Padel SERUL v1.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 24, paddingBottom: 48 },
  avatarSection: { alignItems: 'center', marginBottom: 28, gap: 12 },
  avatar: {
    width: 96, height: 96, borderRadius: 48,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 10, elevation: 6,
  },
  avatarText: { color: colors.white, fontSize: 36, fontWeight: '800' },
  roleBadge: {
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 5,
  },
  roleText: { color: colors.white, fontSize: 13, fontWeight: '700' },
  card: {
    backgroundColor: colors.white, borderRadius: 16, padding: 20,
    marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  cardTitle: { fontSize: 13, fontWeight: '700', color: colors.textLight, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 16 },
  campo: { paddingVertical: 4 },
  campoLabel: { fontSize: 12, color: colors.textLight, marginBottom: 4 },
  campoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  campoValor: { fontSize: 16, color: colors.text, fontWeight: '500' },
  editRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  editInput: {
    flex: 1, borderWidth: 1.5, borderColor: colors.primary,
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 15,
  },
  btnGuardar: { backgroundColor: colors.primary, borderRadius: 8, padding: 8 },
  btnCancelar: { borderRadius: 8, padding: 8 },
  separador: { height: 1, backgroundColor: colors.border, marginVertical: 12 },
  btnAdmin: {
    backgroundColor: '#7c3aed', borderRadius: 14, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12,
    shadowColor: '#7c3aed', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  btnAdminText: { color: colors.white, fontSize: 16, fontWeight: '700', flex: 1 },
  btnLogout: {
    backgroundColor: colors.white, borderRadius: 14, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1.5, borderColor: '#fde8e8', marginBottom: 24,
  },
  btnLogoutText: { color: colors.danger, fontSize: 16, fontWeight: '600' },
  versao: { textAlign: 'center', color: colors.textLight, fontSize: 12 },
});
