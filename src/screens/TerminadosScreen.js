import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator,
  TextInput, TouchableOpacity, Animated, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ouvirJogosTerminados, apagarJogo } from '../services/firebaseService';
import EmptyState from '../components/EmptyState';
import { SkeletonCard } from '../components/Skeleton';
import { colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';

function CardAnimado({ children, index, style }) {
  const slide = useRef(new Animated.Value(20)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slide, { toValue: 0, duration: 300, delay: index * 50, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 300, delay: index * 50, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[style, { opacity, transform: [{ translateY: slide }] }]}>
      {children}
    </Animated.View>
  );
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
  if (setsA > setsB) return { nome: equipaA, lado: 'A' };
  if (setsB > setsA) return { nome: equipaB, lado: 'B' };
  return { nome: null, lado: null };
}

export default function TerminadosScreen({ navigation }) {
  const { perfil } = useAuth();
  const isAdmin = perfil?.role === 'admin';
  const [jogos, setJogos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('');

  useEffect(() => {
    const unsubscribe = ouvirJogosTerminados((data) => {
      setJogos(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const jogosFiltrados = jogos.filter((j) =>
    !filtro ||
    j.torneio?.toLowerCase().includes(filtro.toLowerCase()) ||
    j.equipaA?.toLowerCase().includes(filtro.toLowerCase()) ||
    j.equipaB?.toLowerCase().includes(filtro.toLowerCase())
  );

  const renderJogo = ({ item, index }) => {
    const vencedor = calcularVencedor(item.set1, item.set2, item.set3, item.equipaA, item.equipaB);
    const sets = [item.set1, item.set2, item.set3].filter(Boolean).join('  ');

    return (
      <CardAnimado index={index} style={styles.card}>
        <TouchableOpacity
          onPress={() => navigation.navigate('JogoDetalhe', { jogo: item })}
          activeOpacity={0.8}
        >
          <View style={styles.cardHeader}>
            <View style={styles.torneioRow}>
              <Text style={styles.torneio}>{item.torneio}</Text>
              {item.nivel && (
                <View style={styles.nivelBadge}>
                  <Text style={styles.nivelText}>{item.nivel}</Text>
                </View>
              )}
              <Ionicons name="chevron-forward" size={16} color={colors.border} />
            </View>
            <View style={styles.terminadoBadge}>
              <Ionicons name="checkmark-circle" size={14} color="#155724" />
              <Text style={styles.terminadoText}>Terminado</Text>
            </View>
          </View>

          <View style={styles.equipasRow}>
            <View style={[styles.equipaBox, vencedor.lado === 'A' && styles.vencedorBox]}>
              {vencedor.lado === 'A' && (
                <Ionicons name="trophy" size={14} color="#ffc107" style={styles.troféu} />
              )}
              <Text style={[styles.equipa, vencedor.lado === 'A' && styles.equipaVencedora]}>
                {item.equipaA}
              </Text>
            </View>

            <Text style={styles.vs}>VS</Text>

            <View style={[styles.equipaBox, vencedor.lado === 'B' && styles.vencedorBox]}>
              {vencedor.lado === 'B' && (
                <Ionicons name="trophy" size={14} color="#ffc107" style={styles.troféu} />
              )}
              <Text style={[styles.equipa, vencedor.lado === 'B' && styles.equipaVencedora]}>
                {item.equipaB}
              </Text>
            </View>
          </View>

          <View style={styles.cardFooter}>
            <View style={styles.setsContainer}>
              <Ionicons name="stats-chart" size={14} color={colors.textLight} />
              <Text style={styles.setsText}>{sets || 'N/A'}</Text>
            </View>
            <View style={styles.footerRight}>
              {item.updatedAt?.seconds && (
                <Text style={styles.dataText}>
                  {new Date(item.updatedAt.seconds * 1000).toLocaleDateString('pt-PT')}
                </Text>
              )}
              {isAdmin && (
                <TouchableOpacity
                  onPress={() => Alert.alert('Apagar', `Apagar "${item.torneio}"?`, [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Apagar', style: 'destructive', onPress: () => apagarJogo(item.id) },
                  ])}
                  style={{ padding: 4 }}
                >
                  <Ionicons name="trash-outline" size={16} color={colors.danger} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </CardAnimado>
    );
  };

  if (loading) {
    return (
      <View style={styles.skeletonContainer}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color={colors.border} style={styles.searchIcon} />
          <View style={{ flex: 1, height: 14, backgroundColor: colors.border, borderRadius: 7 }} />
        </View>
        <View style={{ padding: 16 }}>
          <SkeletonCard accentColor={colors.secondary} />
          <SkeletonCard accentColor={colors.secondary} />
          <SkeletonCard accentColor={colors.secondary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color={colors.textLight} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Pesquisar por torneio ou equipa..."
          value={filtro}
          onChangeText={setFiltro}
          placeholderTextColor={colors.textLight}
        />
        {filtro.length > 0 && (
          <TouchableOpacity onPress={() => setFiltro('')}>
            <Ionicons name="close-circle" size={18} color={colors.textLight} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        contentContainerStyle={jogosFiltrados.length === 0 ? styles.emptyContainer : styles.list}
        data={jogosFiltrados}
        keyExtractor={(item) => item.id}
        renderItem={renderJogo}
        ListEmptyComponent={
          <EmptyState
            icon="trophy-outline"
            message={filtro ? 'Nenhum resultado para a pesquisa.' : 'Nenhum jogo terminado ainda.'}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: 16 },
  emptyContainer: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: colors.textLight, fontSize: 15 },
  skeletonContainer: { flex: 1, backgroundColor: colors.background },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    margin: 16,
    marginBottom: 4,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: colors.text },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: colors.secondary,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  torneioRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  torneio: { fontSize: 15, fontWeight: '700', color: colors.text, flex: 1 },
  nivelBadge: {
    backgroundColor: colors.primary,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  nivelText: { color: colors.white, fontSize: 11, fontWeight: '700' },
  terminadoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.terminado,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 4,
  },
  terminadoText: { fontSize: 11, fontWeight: '600', color: '#155724' },
  equipasRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  equipaBox: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  vencedorBox: {
    backgroundColor: '#fff9e6',
    borderWidth: 1,
    borderColor: '#ffc107',
  },
  troféu: { marginBottom: 2 },
  equipa: { fontSize: 13, fontWeight: '500', color: colors.text, textAlign: 'center' },
  equipaVencedora: { fontWeight: '800', color: '#7a5c00' },
  vs: { fontSize: 11, fontWeight: '800', color: colors.textLight },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
  },
  setsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  setsText: { fontSize: 13, color: colors.textLight, flex: 1 },
  footerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dataText: { fontSize: 11, color: colors.textLight },
});
