import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Alert, ActivityIndicator, RefreshControl, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ouvirJogosAndamento, atualizarJogo, apagarJogo } from '../services/firebaseService';
import SetSelector from '../components/SetSelector';
import EmptyState from '../components/EmptyState';
import { SkeletonCard } from '../components/Skeleton';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';

function mensagemErroJogo(error, fallback) {
  const code = error?.code;
  if (code === 'permission-denied') return 'Sem permissão para esta ação.';
  if (code === 'unavailable') return 'Sem ligação ao servidor. Tenta novamente.';
  if (code === 'deadline-exceeded') return 'A operação demorou demasiado tempo. Tenta novamente.';
  if (code === 'unauthenticated') return 'Sessão expirada. Inicia sessão novamente.';
  return fallback;
}

function AnimatedPulseDot() {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scale, { toValue: 2, duration: 700, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1, duration: 700, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0, duration: 700, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.7, duration: 700, useNativeDriver: true }),
        ]),
      ])
    ).start();
  }, []);

  return (
    <View style={dotStyles.wrapper}>
      <Animated.View style={[dotStyles.ring, { transform: [{ scale }], opacity }]} />
      <View style={dotStyles.dot} />
    </View>
  );
}

const dotStyles = StyleSheet.create({
  wrapper: { width: 14, height: 14, alignItems: 'center', justifyContent: 'center' },
  ring: {
    position: 'absolute',
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: '#e67e00',
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#e67e00' },
});

export default function AndamentoScreen() {
  const { isEditor, perfil } = useAuth();
  const [jogos, setJogos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState({});

  useEffect(() => {
    const unsubscribe = ouvirJogosAndamento((data) => {
      setJogos(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleSetChange = useCallback(async (jogoId, campo, valor) => {
    setSalvando((prev) => ({ ...prev, [jogoId]: true }));
    try {
      await atualizarJogo(jogoId, { [campo]: valor });
    } catch (e) {
      Alert.alert('Erro', mensagemErroJogo(e, 'Não foi possível atualizar o set.'));
    } finally {
      setSalvando((prev) => ({ ...prev, [jogoId]: false }));
    }
  }, []);

  const handleTerminar = useCallback((jogo) => {
    Alert.alert(
      'Terminar Jogo',
      `Tens a certeza que queres terminar:\n${jogo.equipaA} vs ${jogo.equipaB}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Terminar',
          style: 'destructive',
          onPress: async () => {
            setSalvando((prev) => ({ ...prev, [jogo.id]: true }));
            try {
              await atualizarJogo(jogo.id, { status: 'Terminado' });
            } catch (e) {
              Alert.alert('Erro', mensagemErroJogo(e, 'Não foi possível terminar o jogo.'));
            } finally {
              setSalvando((prev) => ({ ...prev, [jogo.id]: false }));
            }
          },
        },
      ]
    );
  }, []);

  const renderJogo = ({ item }) => {
    const isSalvando = salvando[item.id];

    return (
      <View style={styles.card}>
        {isSalvando && (
          <View style={styles.savingOverlay}>
            <ActivityIndicator color={colors.primary} />
          </View>
        )}

        <View style={styles.cardHeader}>
          <View style={styles.torneioRow}>
            <Text style={styles.torneio}>{item.torneio}</Text>
            <View style={styles.nivelBadge}>
              <Text style={styles.nivelText}>{item.nivel}</Text>
            </View>
          </View>
          <View style={styles.statusBadge}>
            <AnimatedPulseDot />
            <Text style={styles.statusText}>A Decorrer</Text>
          </View>
        </View>

        <View style={styles.equipasRow}>
          <Text style={styles.equipa} numberOfLines={2}>{item.equipaA}</Text>
          <Text style={styles.vs}>VS</Text>
          <Text style={styles.equipa} numberOfLines={2}>{item.equipaB}</Text>
        </View>

        <Text style={styles.setsLabel}>Sets</Text>
        <View style={styles.setsRow}>
          <View style={styles.setItem}>
            <Text style={styles.setLabel}>Set 1</Text>
            <SetSelector
              label="Set 1"
              value={item.set1}
              onChange={(v) => handleSetChange(item.id, 'set1', v)}
              disabled={!isEditor}
            />
          </View>
          <View style={styles.setItem}>
            <Text style={styles.setLabel}>Set 2</Text>
            <SetSelector
              label="Set 2"
              value={item.set2}
              onChange={(v) => handleSetChange(item.id, 'set2', v)}
              disabled={!isEditor}
            />
          </View>
          <View style={styles.setItem}>
            <Text style={styles.setLabel}>Set 3</Text>
            <SetSelector
              label="Set 3"
              value={item.set3}
              onChange={(v) => handleSetChange(item.id, 'set3', v)}
              disabled={!isEditor}
            />
          </View>
        </View>

        {isEditor && (
          <TouchableOpacity
            style={styles.btnTerminar}
            onPress={() => handleTerminar(item)}
            disabled={isSalvando}
          >
            <Ionicons name="checkmark-circle" size={18} color={colors.white} />
            <Text style={styles.btnTerminarText}>Terminar Jogo</Text>
          </TouchableOpacity>
        )}
        {perfil?.role === 'admin' && (
          <TouchableOpacity
            style={styles.btnApagarJogo}
            onPress={() => {
              Alert.alert('Apagar Jogo', `Apagar "${item.torneio}"?`, [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Apagar', style: 'destructive', onPress: () => apagarJogo(item.id) },
              ]);
            }}
          >
            <Ionicons name="trash-outline" size={16} color={colors.danger} />
            <Text style={styles.btnApagarJogoText}>Apagar jogo</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.skeletonContainer}>
        <SkeletonCard accentColor={colors.andamentoBorder} />
        <SkeletonCard accentColor={colors.andamentoBorder} />
        <SkeletonCard accentColor={colors.andamentoBorder} />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={jogos.length === 0 ? styles.emptyContainer : styles.list}
      data={jogos}
      keyExtractor={(item) => item.id}
      renderItem={renderJogo}
      ListEmptyComponent={
        <EmptyState
          icon="tennisball-outline"
          message="Não há jogos a decorrer neste momento."
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    padding: 16,
    gap: 16,
  },
  emptyContainer: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: colors.textLight,
    fontSize: 15,
  },
  skeletonContainer: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: colors.andamentoBorder,
    marginBottom: 12,
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
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  torneioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  torneio: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },
  nivelBadge: {
    backgroundColor: colors.primary,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  nivelText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.andamento,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 5,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7a4500',
  },
  equipasRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
  },
  equipa: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  vs: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textLight,
    paddingHorizontal: 4,
  },
  setsLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textLight,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  setsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  setItem: {
    flex: 1,
    gap: 4,
  },
  setLabel: {
    fontSize: 11,
    color: colors.textLight,
    textAlign: 'center',
  },
  btnTerminar: {
    backgroundColor: colors.secondary,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  btnTerminarText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
  btnApagarJogo: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, marginTop: 8, paddingVertical: 10,
    borderWidth: 1, borderColor: '#fde8e8', borderRadius: 10,
  },
  btnApagarJogoText: { color: colors.danger, fontSize: 13, fontWeight: '600' },
});
