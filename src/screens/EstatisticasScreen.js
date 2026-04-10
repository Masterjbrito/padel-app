import React, { useEffect, useState, useRef, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator,
  TouchableOpacity, TextInput, Dimensions, Animated, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BarChart } from 'react-native-chart-kit';
import { obterEstatisticas } from '../services/firebaseService';
import EmptyState from '../components/EmptyState';
import { SkeletonRow } from '../components/Skeleton';
import { NIVEIS } from '../constants/jogadores';
import { colors } from '../theme/colors';

const screenWidth = Dimensions.get('window').width;

const MEDAL_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];
const MEDAL_ICONS = ['trophy', 'medal', 'medal'];
const PODIO_HEIGHTS = [110, 85, 70];

// ─── Avatar com iniciais coloridas por win rate ───────────────────────────────
function Avatar({ nome, winRate }) {
  const initials = nome.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  const bgColor = winRate >= 60 ? colors.secondary : winRate >= 40 ? colors.primary : colors.textLight;

  return (
    <View style={[avatarStyles.circle, { backgroundColor: bgColor }]}>
      <Text style={avatarStyles.text}>{initials}</Text>
    </View>
  );
}

const avatarStyles = StyleSheet.create({
  circle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  text: { color: colors.white, fontSize: 13, fontWeight: '800' },
});

// ─── Barra de win rate ────────────────────────────────────────────────────────
function WinRateBar({ value }) {
  const barWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(barWidth, { toValue: value, duration: 700, useNativeDriver: false }).start();
  }, [value]);

  const color = value >= 60 ? colors.secondary : value >= 40 ? colors.primary : colors.danger;
  const widthInterp = barWidth.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });

  return (
    <View style={barStyles.track}>
      <Animated.View style={[barStyles.fill, { width: widthInterp, backgroundColor: color }]} />
    </View>
  );
}

const barStyles = StyleSheet.create({
  track: { height: 4, backgroundColor: colors.border, borderRadius: 2, marginTop: 4 },
  fill: { height: 4, borderRadius: 2 },
});

// ─── Pódio top 3 ─────────────────────────────────────────────────────────────
function Podio({ top3 }) {
  const scaleAnim = useRef(new Animated.Value(0.7)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 7, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  // Orden: 2º, 1º, 3º para visualização do pódio
  const order = [top3[1], top3[0], top3[2]].filter(Boolean);
  const orderIdx = [1, 0, 2];

  return (
    <Animated.View style={[podioStyles.container, { opacity: opacityAnim, transform: [{ scale: scaleAnim }] }]}>
      <Text style={podioStyles.title}>Ranking</Text>
      <View style={podioStyles.podio}>
        {order.map((jogador, i) => {
          const realIdx = orderIdx[i];
          const total = jogador.ganhos + jogador.perdidos;
          const winRate = total > 0 ? Math.round((jogador.ganhos / total) * 100) : 0;
          const initials = jogador.jogador.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
          const firstName = jogador.jogador.split(' ')[0];

          return (
            <View key={jogador.jogador} style={podioStyles.podioItem}>
              <View style={[podioStyles.medalCircle, { backgroundColor: MEDAL_COLORS[realIdx] + '22' }]}>
                <Ionicons name={MEDAL_ICONS[realIdx]} size={realIdx === 0 ? 28 : 22} color={MEDAL_COLORS[realIdx]} />
              </View>
              <View style={[podioStyles.avatar, { backgroundColor: MEDAL_COLORS[realIdx] }]}>
                <Text style={podioStyles.avatarText}>{initials}</Text>
              </View>
              <Text style={podioStyles.nome} numberOfLines={1}>{firstName}</Text>
              <Text style={podioStyles.ganhos}>{jogador.ganhos}V</Text>
              <View style={[podioStyles.base, { height: PODIO_HEIGHTS[realIdx], backgroundColor: MEDAL_COLORS[realIdx] + '33', borderColor: MEDAL_COLORS[realIdx] }]}>
                <Text style={[podioStyles.baseNum, { color: MEDAL_COLORS[realIdx] }]}>{realIdx + 1}º</Text>
              </View>
            </View>
          );
        })}
      </View>
    </Animated.View>
  );
}

const podioStyles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  title: {
    fontSize: 13, fontWeight: '700', color: colors.textLight,
    textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'center', marginBottom: 16,
  },
  podio: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 8 },
  podioItem: { alignItems: 'center', width: 90 },
  medalCircle: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center', marginBottom: 6,
  },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  avatarText: { color: colors.white, fontSize: 14, fontWeight: '800' },
  nome: { fontSize: 12, fontWeight: '700', color: colors.text, marginBottom: 2 },
  ganhos: { fontSize: 11, color: colors.textLight, marginBottom: 6 },
  base: {
    width: '100%', borderRadius: 8, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  baseNum: { fontSize: 18, fontWeight: '900' },
});

// ─── Row de jogador ───────────────────────────────────────────────────────────
function JogadorRow({ item, index, onPress }) {
  const total = item.ganhos + item.perdidos;
  const winRate = total > 0 ? Math.round((item.ganhos / total) * 100) : 0;

  const slideAnim = useRef(new Animated.Value(20)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 0, duration: 300, delay: index * 40, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 300, delay: index * 40, useNativeDriver: true }),
    ]).start();
  }, []);

  const rankColor = index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : colors.textLight;

  return (
    <Animated.View style={[{ opacity: opacityAnim, transform: [{ translateX: slideAnim }] }]}>
      <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.75}>
        <Text style={[styles.rank, { color: rankColor }]}>{index + 1}º</Text>
        <Avatar nome={item.jogador} winRate={winRate} />
        <View style={styles.jogadorInfo}>
          <Text style={styles.jogadorNome}>{item.jogador}</Text>
          <View style={styles.nivelRow}>
            <View style={styles.nivelBadge}>
              <Text style={styles.nivelText}>{item.nivel || 'N/A'}</Text>
            </View>
            <Text style={styles.winRateText}>{winRate}% wins</Text>
          </View>
          <WinRateBar value={winRate} />
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValGanho}>{item.ganhos}</Text>
            <Text style={styles.statLabel}>V</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValPerdido}>{item.perdidos}</Text>
            <Text style={styles.statLabel}>D</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.border} />
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Ecrã principal ───────────────────────────────────────────────────────────
export default function EstatisticasScreen({ navigation }) {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroNome, setFiltroNome] = useState('');
  const [filtroNivel, setFiltroNivel] = useState('');
  const [ordenacao, setOrdenacao] = useState('ganhos');
  const [tabAtiva, setTabAtiva] = useState('tabela');

  useEffect(() => { carregarEstatisticas(); }, []);

  async function carregarEstatisticas() {
    setLoading(true);
    try {
      const dados = await obterEstatisticas();
      setStats(dados);
    } catch (e) {
      console.error('Erro ao carregar estatísticas:', e);
    } finally {
      setLoading(false);
    }
  }

  const statsFiltrados = useMemo(() => stats
    .filter((j) => {
      const nomeMatch = !filtroNome || j.jogador.toLowerCase().includes(filtroNome.toLowerCase());
      const nivelMatch = !filtroNivel || j.nivel === filtroNivel;
      return nomeMatch && nivelMatch;
    })
    .sort((a, b) => {
      if (ordenacao === 'ganhos') return b.ganhos - a.ganhos;
      if (ordenacao === 'perdidos') return b.perdidos - a.perdidos;
      return a.jogador.localeCompare(b.jogador);
    }), [stats, filtroNome, filtroNivel, ordenacao]);

  const top10 = useMemo(() => statsFiltrados.slice(0, 10), [statsFiltrados]);
  const top3 = useMemo(() => statsFiltrados.slice(0, 3), [statsFiltrados]);
  const mostrarPodio = ordenacao === 'ganhos' && !filtroNome && top3.length >= 2;

  const chartData = useMemo(() => ({
    labels: top10.map((j) => j.jogador.split(' ')[0]),
    datasets: [
      { data: top10.map((j) => j.ganhos), color: () => colors.secondary },
      { data: top10.map((j) => j.perdidos), color: () => colors.danger },
    ],
    legend: ['Vitórias', 'Derrotas'],
  }), [top10]);

  if (loading) {
    return (
      <View style={styles.skeletonContainer}>
        {[0, 1, 2, 3, 4, 5].map((i) => <SkeletonRow key={i} />)}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Filtros */}
      <View style={styles.filtros}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color={colors.textLight} />
          <TextInput
            style={styles.searchInput}
            placeholder="Pesquisar jogador..."
            value={filtroNome}
            onChangeText={setFiltroNome}
            placeholderTextColor={colors.textLight}
          />
          {filtroNome ? (
            <TouchableOpacity onPress={() => setFiltroNome('')}>
              <Ionicons name="close-circle" size={16} color={colors.textLight} />
            </TouchableOpacity>
          ) : null}
        </View>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={['', ...NIVEIS]}
          keyExtractor={(item) => item || 'todos'}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.nivelChip, filtroNivel === item && styles.nivelChipActive]}
              onPress={() => setFiltroNivel(item)}
            >
              <Text style={[styles.nivelChipText, filtroNivel === item && styles.nivelChipTextActive]}>
                {item || 'Todos'}
              </Text>
            </TouchableOpacity>
          )}
          style={styles.nivelChips}
        />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {[
          { id: 'tabela', label: 'Tabela', icon: 'list' },
          { id: 'grafico', label: 'Gráfico', icon: 'bar-chart' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, tabAtiva === tab.id && styles.tabActive]}
            onPress={() => setTabAtiva(tab.id)}
          >
            <Ionicons name={tab.icon} size={16} color={tabAtiva === tab.id ? colors.primary : colors.textLight} />
            <Text style={[styles.tabText, tabAtiva === tab.id && styles.tabTextActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {tabAtiva === 'tabela' ? (
        <>
          {/* Ordenação */}
          <View style={styles.ordenacaoRow}>
            <Text style={styles.ordenacaoLabel}>Ordenar:</Text>
            {['ganhos', 'perdidos', 'nome'].map((o) => (
              <TouchableOpacity
                key={o}
                style={[styles.ordenacaoChip, ordenacao === o && styles.ordenacaoChipActive]}
                onPress={() => setOrdenacao(o)}
              >
                <Text style={[styles.ordenacaoText, ordenacao === o && styles.ordenacaoTextActive]}>
                  {o.charAt(0).toUpperCase() + o.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <FlatList
            contentContainerStyle={statsFiltrados.length === 0 ? styles.emptyContainer : styles.list}
            data={statsFiltrados}
            keyExtractor={(item) => item.jogador}
            renderItem={({ item, index }) => (
              <JogadorRow
                item={item}
                index={index}
                onPress={() => navigation.navigate('JogadorDetalhe', {
                  nome: item.jogador,
                  ganhos: item.ganhos,
                  perdidos: item.perdidos,
                  nivel: item.nivel,
                })}
              />
            )}
            ListHeaderComponent={mostrarPodio ? <Podio top3={top3} /> : null}
            ListEmptyComponent={
              <EmptyState icon="person-outline" message="Nenhum jogador com jogos terminados." />
            }
          />
        </>
      ) : (
        <ScrollView contentContainerStyle={styles.graficoContainer}>
          {top10.length > 0 ? (
            <>
              <Text style={styles.graficoTitulo}>Top {top10.length} Jogadores</Text>
              <BarChart
                data={chartData}
                width={screenWidth - 32}
                height={260}
                chartConfig={{
                  backgroundColor: colors.white,
                  backgroundGradientFrom: colors.white,
                  backgroundGradientTo: colors.white,
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(0, 102, 204, ${opacity})`,
                  labelColor: () => colors.text,
                  style: { borderRadius: 16 },
                  barPercentage: 0.5,
                }}
                style={styles.grafico}
                fromZero
                showBarTops
                withInnerLines={false}
              />
            </>
          ) : (
            <EmptyState icon="bar-chart-outline" message="Sem dados para o gráfico." />
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  skeletonContainer: { flex: 1, backgroundColor: colors.background, padding: 16 },
  filtros: { backgroundColor: colors.white, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: colors.border,
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8,
    gap: 8, marginBottom: 10,
  },
  searchInput: { flex: 1, fontSize: 14, color: colors.text },
  nivelChips: { marginBottom: 4 },
  nivelChip: {
    borderWidth: 1, borderColor: colors.border, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 5, marginRight: 8,
  },
  nivelChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  nivelChipText: { fontSize: 13, color: colors.textLight },
  nivelChipTextActive: { color: colors.white, fontWeight: '600' },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', paddingVertical: 12, gap: 6,
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: colors.primary },
  tabText: { fontSize: 14, color: colors.textLight },
  tabTextActive: { color: colors.primary, fontWeight: '600' },
  ordenacaoRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 10, gap: 8,
  },
  ordenacaoLabel: { fontSize: 13, color: colors.textLight },
  ordenacaoChip: {
    borderWidth: 1, borderColor: colors.border,
    borderRadius: 16, paddingHorizontal: 10, paddingVertical: 4,
  },
  ordenacaoChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  ordenacaoText: { fontSize: 12, color: colors.textLight },
  ordenacaoTextActive: { color: colors.white, fontWeight: '600' },
  list: { padding: 16, paddingTop: 12 },
  emptyContainer: { flex: 1 },
  row: {
    backgroundColor: colors.white, borderRadius: 14, padding: 12,
    marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 2,
  },
  rank: { fontSize: 16, fontWeight: '900', width: 28, textAlign: 'center' },
  jogadorInfo: { flex: 1 },
  jogadorNome: { fontSize: 14, fontWeight: '700', color: colors.text },
  nivelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  nivelBadge: {
    backgroundColor: colors.primary, borderRadius: 4,
    paddingHorizontal: 5, paddingVertical: 1,
  },
  nivelText: { color: colors.white, fontSize: 10, fontWeight: '700' },
  winRateText: { fontSize: 11, color: colors.textLight },
  statsRow: { flexDirection: 'row', gap: 10 },
  statBox: { alignItems: 'center', minWidth: 28 },
  statValGanho: { fontSize: 18, fontWeight: '800', color: colors.secondary },
  statValPerdido: { fontSize: 18, fontWeight: '800', color: colors.danger },
  statLabel: { fontSize: 10, color: colors.textLight },
  graficoContainer: { padding: 16 },
  graficoTitulo: {
    fontSize: 16, fontWeight: '700', color: colors.text,
    marginBottom: 12, textAlign: 'center',
  },
  grafico: { borderRadius: 16 },
});
