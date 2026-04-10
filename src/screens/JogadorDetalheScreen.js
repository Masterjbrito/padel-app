import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { obterJogosJogador } from '../services/firebaseService';
import EmptyState from '../components/EmptyState';
import { SkeletonCard } from '../components/Skeleton';
import { colors } from '../theme/colors';

function calcularResultadoJogo(set1, set2, set3) {
  let setsA = 0, setsB = 0;
  [set1, set2, set3].forEach((s) => {
    if (!s) return;
    const clean = s.replace(/[()]/g, '').split(' ')[0];
    const [a, b] = clean.split('-').map(Number);
    if (a > b) setsA++;
    else if (b > a) setsB++;
  });
  return { setsA, setsB };
}

function StatsHeader({ nome, ganhos, perdidos, nivel }) {
  const total = ganhos + perdidos;
  const winRate = total > 0 ? Math.round((ganhos / total) * 100) : 0;
  const initials = nome.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

  const barAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(barAnim, { toValue: winRate, duration: 900, delay: 200, useNativeDriver: false }),
    ]).start();
  }, [winRate]);

  const barColor = winRate >= 60 ? colors.secondary : winRate >= 40 ? colors.primary : colors.danger;
  const avatarColor = winRate >= 60 ? colors.secondary : winRate >= 40 ? colors.primary : '#7c3aed';
  const barWidth = barAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });

  return (
    <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
      {/* Avatar grande */}
      <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>

      <Text style={styles.headerNome}>{nome}</Text>

      {nivel ? (
        <View style={[styles.nivelBadge, { backgroundColor: colors.primary }]}>
          <Text style={styles.nivelText}>{nivel}</Text>
        </View>
      ) : null}

      {/* Stats em linha */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={[styles.statNum, { color: colors.secondary }]}>{ganhos}</Text>
          <Text style={styles.statLabel}>Vitórias</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={[styles.statNum, { color: colors.textLight }]}>{total}</Text>
          <Text style={styles.statLabel}>Jogos</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={[styles.statNum, { color: colors.danger }]}>{perdidos}</Text>
          <Text style={styles.statLabel}>Derrotas</Text>
        </View>
      </View>

      {/* Barra de win rate */}
      <View style={styles.winRateSection}>
        <View style={styles.winRateHeader}>
          <Text style={styles.winRateLabel}>Taxa de vitória</Text>
          <Text style={[styles.winRateValue, { color: barColor }]}>{winRate}%</Text>
        </View>
        <View style={styles.winRateTrack}>
          <Animated.View style={[styles.winRateFill, { width: barWidth, backgroundColor: barColor }]} />
        </View>
      </View>
    </Animated.View>
  );
}

function JogoCard({ jogo, nome, index }) {
  const lado = [jogo.jogador1A, jogo.jogador2A].includes(nome) ? 'A' : 'B';
  const { setsA, setsB } = calcularResultadoJogo(jogo.set1, jogo.set2, jogo.set3);
  const ganhou = lado === 'A' ? setsA > setsB : setsB > setsA;
  const sets = [jogo.set1, jogo.set2, jogo.set3].filter(Boolean).join('  ');

  const slideAnim = useRef(new Animated.Value(30)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 0, duration: 300, delay: index * 60, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 300, delay: index * 60, useNativeDriver: true }),
    ]).start();
  }, []);

  // Parceiro e adversários
  const parceiro = lado === 'A'
    ? [jogo.jogador1A, jogo.jogador2A].filter((j) => j !== nome).join('') || '—'
    : [jogo.jogador1B, jogo.jogador2B].filter((j) => j !== nome).join('') || '—';
  const adversarios = lado === 'A'
    ? [jogo.jogador1B, jogo.jogador2B].filter(Boolean).join(' / ') || '—'
    : [jogo.jogador1A, jogo.jogador2A].filter(Boolean).join(' / ') || '—';

  return (
    <Animated.View style={[
      styles.jogoCard,
      { borderLeftColor: ganhou ? colors.secondary : colors.danger },
      { opacity: opacityAnim, transform: [{ translateX: slideAnim }] },
    ]}>
      {/* Resultado badge */}
      <View style={[styles.resultadoBadge, { backgroundColor: ganhou ? '#d4edda' : '#fde8e8' }]}>
        <Ionicons
          name={ganhou ? 'checkmark-circle' : 'close-circle'}
          size={16}
          color={ganhou ? colors.secondary : colors.danger}
        />
        <Text style={[styles.resultadoText, { color: ganhou ? '#155724' : '#721c24' }]}>
          {ganhou ? 'Vitória' : 'Derrota'}
        </Text>
      </View>

      {/* Torneio + nível */}
      <View style={styles.jogoHeader}>
        <Text style={styles.jogoTorneio} numberOfLines={1}>{jogo.torneio}</Text>
        {jogo.nivel && (
          <View style={styles.jogoNivelBadge}>
            <Text style={styles.jogoNivelText}>{jogo.nivel}</Text>
          </View>
        )}
      </View>

      {/* Parceiro */}
      <View style={styles.jogoParceiro}>
        <Ionicons name="people-outline" size={14} color={colors.primary} />
        <Text style={styles.jogoParceiroLabel}>Parceiro: </Text>
        <Text style={styles.jogoParceiroNome}>{parceiro}</Text>
      </View>

      {/* Adversários */}
      <View style={styles.jogoParceiro}>
        <Ionicons name="swap-horizontal-outline" size={14} color={colors.textLight} />
        <Text style={styles.jogoParceiroLabel}>Contra: </Text>
        <Text style={styles.jogoAdversarioNome}>{adversarios}</Text>
      </View>

      {/* Sets */}
      {sets ? (
        <View style={styles.jogoSets}>
          <Ionicons name="stats-chart" size={12} color={colors.textLight} />
          <Text style={styles.jogoSetsText}>{sets}</Text>
        </View>
      ) : null}
    </Animated.View>
  );
}

export default function JogadorDetalheScreen({ route }) {
  const { nome, ganhos, perdidos, nivel } = route.params;
  const [jogos, setJogos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    obterJogosJogador(nome)
      .then(setJogos)
      .finally(() => setLoading(false));
  }, [nome]);

  return (
    <View style={styles.container}>
      <FlatList
        data={loading ? [] : jogos}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <StatsHeader nome={nome} ganhos={ganhos} perdidos={perdidos} nivel={nivel} />
        }
        ListHeaderComponentStyle={styles.listHeader}
        renderItem={({ item, index }) => (
          <JogoCard jogo={item} nome={nome} index={index} />
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          loading
            ? (
              <View style={styles.skeletonWrap}>
                <SkeletonCard accentColor={colors.secondary} />
                <SkeletonCard accentColor={colors.secondary} />
                <SkeletonCard accentColor={colors.danger} />
              </View>
            )
            : <EmptyState icon="tennisball-outline" message="Sem jogos registados." />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { paddingBottom: 32 },
  listHeader: { marginBottom: 8 },
  skeletonWrap: { padding: 16 },

  // Header de stats
  header: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 28,
    paddingHorizontal: 24,
  },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.4)',
  },
  avatarText: { color: colors.white, fontSize: 30, fontWeight: '900' },
  headerNome: { fontSize: 24, fontWeight: '800', color: colors.white, marginBottom: 8 },
  nivelBadge: {
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 4, marginBottom: 20,
  },
  nivelText: { color: colors.white, fontSize: 13, fontWeight: '700' },

  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 8,
    width: '100%',
    marginBottom: 20,
  },
  statBox: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 26, fontWeight: '900' },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.25)' },

  winRateSection: { width: '100%' },
  winRateHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  winRateLabel: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  winRateValue: { fontSize: 13, fontWeight: '800' },
  winRateTrack: {
    height: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 4,
  },
  winRateFill: { height: 8, borderRadius: 4 },

  // Cards de jogos
  jogoCard: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 10,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  resultadoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 10,
  },
  resultadoText: { fontSize: 12, fontWeight: '700' },
  jogoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  jogoTorneio: { fontSize: 14, fontWeight: '700', color: colors.text, flex: 1 },
  jogoNivelBadge: {
    backgroundColor: colors.primary, borderRadius: 4,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  jogoNivelText: { color: colors.white, fontSize: 10, fontWeight: '700' },
  jogoParceiro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  jogoParceiroLabel: { fontSize: 12, color: colors.textLight },
  jogoParceiroNome: { fontSize: 12, fontWeight: '700', color: colors.text },
  jogoAdversarioNome: { fontSize: 12, fontWeight: '600', color: colors.textLight },
  jogoSets: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  jogoSetsText: { fontSize: 12, color: colors.textLight },
});
