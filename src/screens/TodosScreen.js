import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, RefreshControl, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ouvirJogosAndamento, ouvirJogosFuturos, ouvirJogosTerminados } from '../services/firebaseService';
import { SkeletonCard } from '../components/Skeleton';
import { colors } from '../theme/colors';

// ─── Componente de ponto pulsante animado ────────────────────────────────────
function PulseDot({ color }) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scale, { toValue: 1.8, duration: 600, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1, duration: 600, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0, duration: 600, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.8, duration: 600, useNativeDriver: true }),
        ]),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.dotWrapper}>
      <Animated.View style={[styles.dotRing, { backgroundColor: color, transform: [{ scale }], opacity }]} />
      <View style={[styles.dot, { backgroundColor: color }]} />
    </View>
  );
}

// ─── Card de resumo (hero stats) ─────────────────────────────────────────────
function StatCard({ label, count, icon, bgColor, textColor, accentColor, live, delay }) {
  const slideAnim = useRef(new Animated.Value(30)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const countAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 0, duration: 400, delay, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 400, delay, useNativeDriver: true }),
      Animated.timing(countAnim, { toValue: count, duration: 600, delay: delay + 100, useNativeDriver: false }),
    ]).start();
  }, [count]);

  const displayCount = countAnim.interpolate({
    inputRange: [0, Math.max(count, 1)],
    outputRange: ['0', String(count)],
  });

  return (
    <Animated.View
      style={[styles.statCard, { backgroundColor: bgColor, borderColor: accentColor },
        { opacity: opacityAnim, transform: [{ translateY: slideAnim }] }]}
    >
      <View style={[styles.statIconCircle, { backgroundColor: accentColor + '33' }]}>
        <Ionicons name={icon} size={22} color={accentColor} />
      </View>
      <View style={styles.statNumRow}>
        {live && count > 0 && <PulseDot color={accentColor} />}
        <Animated.Text style={[styles.statNum, { color: textColor }]}>
          {displayCount}
        </Animated.Text>
      </View>
      <Text style={[styles.statLabel, { color: textColor + 'cc' }]}>{label}</Text>
    </Animated.View>
  );
}

// ─── Mini card de jogo ───────────────────────────────────────────────────────
function MiniCard({ jogo, tipo }) {
  const borderColor =
    tipo === 'andamento' ? colors.andamentoBorder :
    tipo === 'futuro' ? colors.futuroBorder :
    colors.secondary;

  const sets = [jogo.set1, jogo.set2, jogo.set3].filter(Boolean).join('  ');

  return (
    <View style={[styles.miniCard, { borderLeftColor: borderColor }]}>
      <View style={styles.miniCardHeader}>
        <Text style={styles.miniTorneio} numberOfLines={1}>{jogo.torneio}</Text>
        {jogo.nivel && (
          <View style={[styles.nivelBadge, { backgroundColor: borderColor }]}>
            <Text style={styles.nivelText}>{jogo.nivel}</Text>
          </View>
        )}
      </View>

      {tipo === 'futuro' ? (
        <View style={styles.jogadoresBox}>
          <Text style={styles.miniJogadores}>
            {[jogo.jogador1A, jogo.jogador2A].filter(Boolean).join(' / ') || '— / —'}
          </Text>
          <Text style={styles.miniVs}>vs</Text>
          <Text style={styles.miniJogadores}>
            {[jogo.jogador1B, jogo.jogador2B].filter(Boolean).join(' / ') || '— / —'}
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.equipasRow}>
            <Text style={styles.miniEquipa} numberOfLines={1}>{jogo.equipaA}</Text>
            <Text style={styles.miniVs}>vs</Text>
            <Text style={styles.miniEquipa} numberOfLines={1}>{jogo.equipaB}</Text>
          </View>
          {sets ? <Text style={styles.miniSets}>{sets}</Text> : null}
        </>
      )}
    </View>
  );
}

// ─── Secção com título ────────────────────────────────────────────────────────
function Secao({ titulo, cor, icone, jogos, tipo, loading }) {
  return (
    <View style={styles.secao}>
      <View style={[styles.secaoHeader, { borderLeftColor: cor }]}>
        <Ionicons name={icone} size={18} color={cor} />
        <Text style={[styles.secaoTitulo, { color: cor }]}>{titulo}</Text>
        <View style={[styles.badge, { backgroundColor: cor }]}>
          <Text style={styles.badgeText}>{loading ? '…' : jogos.length}</Text>
        </View>
      </View>

      {loading ? (
        <>
          <SkeletonCard accentColor={cor} />
          <SkeletonCard accentColor={cor} />
        </>
      ) : jogos.length === 0 ? (
        <Text style={styles.vazio}>Nenhum jogo.</Text>
      ) : (
        jogos.map((j) => <MiniCard key={j.id} jogo={j} tipo={tipo} />)
      )}
    </View>
  );
}

// ─── Ecrã principal ───────────────────────────────────────────────────────────
export default function TodosScreen() {
  const [andamento, setAndamento] = useState([]);
  const [futuros, setFuturos] = useState([]);
  const [terminados, setTerminados] = useState([]);
  const [loadedCount, setLoadedCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const loading = loadedCount < 3;

  useEffect(() => {
    const bump = () => setLoadedCount((c) => c + 1);
    const u1 = ouvirJogosAndamento((d) => { setAndamento(d); bump(); });
    const u2 = ouvirJogosFuturos((d) => { setFuturos(d); bump(); });
    const u3 = ouvirJogosTerminados((d) => { setTerminados(d.slice(0, 5)); bump(); });
    return () => { u1(); u2(); u3(); };
  }, []);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} colors={[colors.primary]} tintColor={colors.primary} />
      }
    >
      {/* Hero stats */}
      <View style={styles.statsRow}>
        <StatCard
          label="Em jogo"
          count={andamento.length}
          icon="radio-button-on"
          bgColor={colors.andamento}
          textColor="#7a4500"
          accentColor={colors.andamentoBorder}
          live
          delay={0}
        />
        <StatCard
          label="Próximos"
          count={futuros.length}
          icon="calendar"
          bgColor={colors.futuro}
          textColor="#004080"
          accentColor={colors.futuroBorder}
          delay={80}
        />
        <StatCard
          label="Terminados"
          count={terminados.length}
          icon="checkmark-circle"
          bgColor={colors.terminado}
          textColor="#1a5c35"
          accentColor={colors.secondary}
          delay={160}
        />
      </View>

      <Secao
        titulo="A Decorrer"
        cor={colors.andamentoBorder}
        icone="radio-button-on"
        jogos={andamento}
        tipo="andamento"
        loading={loading}
      />
      <Secao
        titulo="Próximos Jogos"
        cor={colors.futuroBorder}
        icone="calendar"
        jogos={futuros}
        tipo="futuro"
        loading={loading}
      />
      <Secao
        titulo="Últimos Terminados"
        cor={colors.secondary}
        icone="checkmark-circle"
        jogos={terminados}
        tipo="terminado"
        loading={loading}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 32 },

  // Hero stats
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  statIconCircle: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  statNumRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dotWrapper: { width: 12, height: 12, alignItems: 'center', justifyContent: 'center' },
  dotRing: {
    position: 'absolute',
    width: 10, height: 10, borderRadius: 5,
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
  statNum: { fontSize: 30, fontWeight: '900' },
  statLabel: { fontSize: 11, fontWeight: '600', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.3 },

  // Secções
  secao: { marginBottom: 22 },
  secaoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderLeftWidth: 3,
    paddingLeft: 10,
    marginBottom: 10,
  },
  secaoTitulo: { fontSize: 16, fontWeight: '700', flex: 1 },
  badge: {
    borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2,
    minWidth: 24, alignItems: 'center',
  },
  badgeText: { color: colors.white, fontSize: 12, fontWeight: '700' },
  vazio: { color: colors.textLight, fontStyle: 'italic', paddingLeft: 12, fontSize: 14 },

  // Mini card
  miniCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  miniCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  miniTorneio: { fontSize: 13, fontWeight: '700', color: colors.text, flex: 1 },
  nivelBadge: { borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 },
  nivelText: { color: colors.white, fontSize: 10, fontWeight: '700' },
  equipasRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  miniEquipa: { flex: 1, fontSize: 12, color: colors.text, textAlign: 'center' },
  miniVs: { fontSize: 10, fontWeight: '700', color: colors.textLight },
  miniSets: { fontSize: 11, color: colors.textLight, marginTop: 4 },
  jogadoresBox: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  miniJogadores: { flex: 1, fontSize: 12, color: colors.text, textAlign: 'center' },
});
