import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Alert, ActivityIndicator, Modal, TextInput, ScrollView, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ouvirJogosFuturos, adicionarJogo, iniciarJogo, apagarJogo } from '../services/firebaseService';
import JogadorSelector from '../components/JogadorSelector';
import EmptyState from '../components/EmptyState';
import { SkeletonCard } from '../components/Skeleton';
import { NIVEIS } from '../constants/jogadores';
import { colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';

function mensagemErroJogo(error, fallback) {
  const code = error?.code;
  if (code === 'permission-denied') return 'Sem permissão para esta ação.';
  if (code === 'unavailable') return 'Sem ligação ao servidor. Tenta novamente.';
  if (code === 'deadline-exceeded') return 'A operação demorou demasiado tempo. Tenta novamente.';
  if (code === 'unauthenticated') return 'Sessão expirada. Inicia sessão novamente.';
  return fallback;
}

export default function FuturosScreen() {
  const { perfil } = useAuth();
  const isAdmin = perfil?.role === 'admin';
  const [jogos, setJogos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalNovoJogo, setModalNovoJogo] = useState(false);
  const [novoTorneio, setNovoTorneio] = useState('');
  const [criando, setCriando] = useState(false);

  useEffect(() => {
    const unsubscribe = ouvirJogosFuturos((data) => {
      setJogos(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const criarJogo = async () => {
    if (!novoTorneio.trim()) {
      Alert.alert('Atenção', 'Indica o nome do torneio.');
      return;
    }
    setCriando(true);
    try {
      await adicionarJogo({ torneio: novoTorneio.trim() });
      setNovoTorneio('');
      setModalNovoJogo(false);
    } catch (e) {
      Alert.alert('Erro', mensagemErroJogo(e, 'Não foi possível criar o jogo.'));
    } finally {
      setCriando(false);
    }
  };

  const renderJogo = ({ item }) => <JogoFuturoCard jogo={item} isAdmin={isAdmin} />;

  if (loading) {
    return (
      <View style={styles.skeletonContainer}>
        <SkeletonCard accentColor={colors.futuroBorder} />
        <SkeletonCard accentColor={colors.futuroBorder} />
        <SkeletonCard accentColor={colors.futuroBorder} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        contentContainerStyle={jogos.length === 0 ? styles.emptyContainer : styles.list}
        data={jogos}
        keyExtractor={(item) => item.id}
        renderItem={renderJogo}
        ListEmptyComponent={
          <EmptyState
            icon="calendar-outline"
            message="Não há próximos jogos. Cria um novo jogo."
          />
        }
      />

      <TouchableOpacity style={styles.fab} onPress={() => setModalNovoJogo(true)}>
        <Ionicons name="add" size={28} color={colors.white} />
      </TouchableOpacity>

      {/* Modal novo jogo */}
      <Modal visible={modalNovoJogo} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Novo Jogo</Text>
              <TouchableOpacity onPress={() => setModalNovoJogo(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Nome do torneio (ex: Torneio Verão 2025)"
              value={novoTorneio}
              onChangeText={setNovoTorneio}
              autoFocus
            />
            <TouchableOpacity
              style={[styles.btnCriar, criando && styles.btnDisabled]}
              onPress={criarJogo}
              disabled={criando}
            >
              {criando
                ? <ActivityIndicator color={colors.white} />
                : <Text style={styles.btnCriarText}>Criar Jogo</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Card individual com estado local ────────────────────────────────────────

function JogoFuturoCard({ jogo, isAdmin }) {
  const [j1A, setJ1A] = useState(jogo.jogador1A || '');
  const [j2A, setJ2A] = useState(jogo.jogador2A || '');
  const [j1B, setJ1B] = useState(jogo.jogador1B || '');
  const [j2B, setJ2B] = useState(jogo.jogador2B || '');
  const [nivel, setNivel] = useState(jogo.nivel || '');
  const [salvando, setSalvando] = useState(false);
  const [nivelModal, setNivelModal] = useState(false);

  const todosPreenchidos = j1A && j2A && j1B && j2B && nivel;

  const handleIniciar = async () => {
    if (!todosPreenchidos) {
      Alert.alert('Atenção', 'Preenche todos os jogadores e o nível antes de iniciar.');
      return;
    }
    Alert.alert(
      'Iniciar Jogo',
      `${j1A}/${j2A} vs ${j1B}/${j2B}\nNível: ${nivel}\n\nIniciar agora?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Iniciar',
          onPress: async () => {
            setSalvando(true);
            try {
              await iniciarJogo(jogo.id, j1A, j2A, j1B, j2B, nivel);
            } catch (e) {
              Alert.alert('Erro', mensagemErroJogo(e, 'Não foi possível iniciar o jogo.'));
            } finally {
              setSalvando(false);
            }
          },
        },
      ]
    );
  };

  const jogadoresUsados = [j1A, j2A, j1B, j2B].filter(Boolean);

  return (
    <View style={styles.card}>
      {salvando && (
        <View style={styles.savingOverlay}>
          <ActivityIndicator color={colors.primary} />
        </View>
      )}

      <View style={styles.cardHeader}>
        <Text style={styles.torneio}>{jogo.torneio}</Text>
        <TouchableOpacity
          style={[styles.nivelBadge, nivel ? styles.nivelBadgeFilled : null]}
          onPress={() => setNivelModal(true)}
        >
          <Text style={[styles.nivelText, nivel ? styles.nivelTextFilled : null]}>
            {nivel || 'Nível ▾'}
          </Text>
        </TouchableOpacity>
        {isAdmin && (
          <TouchableOpacity
            style={styles.btnApagar}
            onPress={() => {
              Alert.alert('Apagar Jogo', `Apagar "${jogo.torneio}"?`, [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Apagar', style: 'destructive', onPress: () => apagarJogo(jogo.id) },
              ]);
            }}
          >
            <Ionicons name="trash-outline" size={18} color={colors.danger} />
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.equipaLabel}>Equipa A</Text>
      <View style={styles.equipaRow}>
        <JogadorSelector label="Jogador 1" value={j1A} onChange={setJ1A} usedValues={jogadoresUsados} />
        <JogadorSelector label="Jogador 2" value={j2A} onChange={setJ2A} usedValues={jogadoresUsados} />
      </View>

      <Text style={styles.equipaLabel}>Equipa B</Text>
      <View style={styles.equipaRow}>
        <JogadorSelector label="Jogador 1" value={j1B} onChange={setJ1B} usedValues={jogadoresUsados} />
        <JogadorSelector label="Jogador 2" value={j2B} onChange={setJ2B} usedValues={jogadoresUsados} />
      </View>

      <TouchableOpacity
        style={[styles.btnIniciar, !todosPreenchidos && styles.btnDisabled]}
        onPress={handleIniciar}
        disabled={salvando}
      >
        <Ionicons name="play-circle" size={20} color={colors.white} />
        <Text style={styles.btnIniciarText}>Iniciar Jogo</Text>
      </TouchableOpacity>

      {/* Modal nível */}
      <Modal visible={nivelModal} transparent animationType="fade">
        <TouchableOpacity style={styles.overlay} onPress={() => setNivelModal(false)}>
          <View style={styles.nivelPicker}>
            <Text style={styles.nivelPickerTitle}>Selecionar Nível</Text>
            {NIVEIS.map((n) => (
              <TouchableOpacity
                key={n}
                style={[styles.nivelOption, n === nivel && styles.nivelOptionSelected]}
                onPress={() => { setNivel(n); setNivelModal(false); }}
              >
                <Text style={[styles.nivelOptionText, n === nivel && { color: colors.primary, fontWeight: '700' }]}>
                  {n}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: 16 },
  emptyContainer: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: colors.textLight, fontSize: 15 },
  skeletonContainer: { flex: 1, backgroundColor: colors.background, padding: 16 },
  btnApagar: { padding: 4 },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: colors.futuroBorder,
  },
  savingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  torneio: { fontSize: 16, fontWeight: '700', color: colors.text, flex: 1 },
  nivelBadge: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  nivelBadgeFilled: { backgroundColor: colors.primary },
  nivelText: { color: colors.primary, fontSize: 13, fontWeight: '600' },
  nivelTextFilled: { color: colors.white },
  equipaLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: 10,
  },
  equipaRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  btnIniciar: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
    marginTop: 16,
  },
  btnDisabled: { opacity: 0.4 },
  btnIniciarText: { color: colors.white, fontSize: 15, fontWeight: '700' },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 16,
  },
  btnCriar: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnCriarText: { color: colors.white, fontSize: 16, fontWeight: '700' },
  nivelPicker: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  nivelPickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  nivelOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 4,
  },
  nivelOptionSelected: { backgroundColor: '#e8f0fe' },
  nivelOptionText: { fontSize: 16, color: colors.text, textAlign: 'center' },
});
