import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

function calcularVencedor(set1, set2, set3) {
  let sA = 0, sB = 0;
  [set1, set2, set3].forEach((s) => {
    if (!s) return;
    const clean = s.replace(/[()]/g, '').split(' ')[0];
    const [a, b] = clean.split('-').map(Number);
    if (a > b) sA++; else if (b > a) sB++;
  });
  return { sA, sB };
}

function SetBubble({ valor, ganhouA, lado }) {
  if (!valor) return null;
  const clean = valor.replace(/[()]/g, '').split(' ')[0];
  const [a, b] = clean.split('-').map(Number);
  const ganhou = lado === 'A' ? a > b : b > a;
  return (
    <View style={[styles.setBubble, ganhou && styles.setBubbleWin]}>
      <Text style={[styles.setBubbleText, ganhou && styles.setBubbleTextWin]}>
        {lado === 'A' ? a : b}
      </Text>
    </View>
  );
}

export default function JogoDetalheScreen({ route }) {
  const { jogo } = route.params;
  const { sA, sB } = calcularVencedor(jogo.set1, jogo.set2, jogo.set3);
  const vencedor = sA > sB ? 'A' : sB > sA ? 'B' : null;
  const sets = [jogo.set1, jogo.set2, jogo.set3].filter(Boolean);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 8, useNativeDriver: true }),
    ]).start();
  }, []);

  const data = jogo.updatedAt?.seconds
    ? new Date(jogo.updatedAt.seconds * 1000).toLocaleDateString('pt-PT', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
    : null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        {/* Header torneio */}
        <View style={styles.headerCard}>
          <View style={styles.torneioRow}>
            <Text style={styles.torneioText}>{jogo.torneio}</Text>
            {jogo.nivel && (
              <View style={styles.nivelBadge}>
                <Text style={styles.nivelText}>{jogo.nivel}</Text>
              </View>
            )}
          </View>
          {data && (
            <View style={styles.dataRow}>
              <Ionicons name="calendar-outline" size={13} color={colors.textLight} />
              <Text style={styles.dataText}>{data}</Text>
            </View>
          )}
        </View>

        {/* Placard principal */}
        <View style={styles.placard}>
          {/* Equipa A */}
          <View style={[styles.equipaBlock, vencedor === 'A' && styles.equipaBlockWin]}>
            {vencedor === 'A' && (
              <Ionicons name="trophy" size={20} color="#FFD700" style={{ marginBottom: 6 }} />
            )}
            <Text style={styles.equipaNome} numberOfLines={2}>{jogo.equipaA}</Text>
            <View style={styles.playersRow}>
              {[jogo.jogador1A, jogo.jogador2A].filter(Boolean).map((p) => (
                <View key={p} style={styles.playerChip}>
                  <Text style={styles.playerChipText}>{p.split(' ')[0]}</Text>
                </View>
              ))}
            </View>
            <Text style={[styles.setsScore, vencedor === 'A' && styles.setsScoreWin]}>{sA}</Text>
          </View>

          {/* VS separador */}
          <View style={styles.vsBlock}>
            <Text style={styles.vsText}>VS</Text>
            <View style={styles.setsColumn}>
              {sets.map((s, i) => {
                const clean = s.replace(/[()]/g, '').split(' ')[0];
                const [a, b] = clean.split('-').map(Number);
                return (
                  <View key={i} style={styles.setRow}>
                    <Text style={[styles.setNum, a > b && styles.setNumWin]}>{a}</Text>
                    <Text style={styles.setDash}>-</Text>
                    <Text style={[styles.setNum, b > a && styles.setNumWin]}>{b}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Equipa B */}
          <View style={[styles.equipaBlock, vencedor === 'B' && styles.equipaBlockWin]}>
            {vencedor === 'B' && (
              <Ionicons name="trophy" size={20} color="#FFD700" style={{ marginBottom: 6 }} />
            )}
            <Text style={styles.equipaNome} numberOfLines={2}>{jogo.equipaB}</Text>
            <View style={styles.playersRow}>
              {[jogo.jogador1B, jogo.jogador2B].filter(Boolean).map((p) => (
                <View key={p} style={styles.playerChip}>
                  <Text style={styles.playerChipText}>{p.split(' ')[0]}</Text>
                </View>
              ))}
            </View>
            <Text style={[styles.setsScore, vencedor === 'B' && styles.setsScoreWin]}>{sB}</Text>
          </View>
        </View>

        {/* Resultado final */}
        {vencedor && (
          <View style={styles.vencedorBanner}>
            <Ionicons name="trophy" size={18} color="#FFD700" />
            <Text style={styles.vencedorText}>
              {vencedor === 'A' ? jogo.equipaA : jogo.equipaB} venceu!
            </Text>
          </View>
        )}
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 40 },

  headerCard: {
    backgroundColor: colors.white, borderRadius: 16,
    padding: 16, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 6, elevation: 2,
  },
  torneioRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  torneioText: { fontSize: 18, fontWeight: '800', color: colors.text, flex: 1 },
  nivelBadge: { backgroundColor: colors.primary, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  nivelText: { color: colors.white, fontSize: 12, fontWeight: '700' },
  dataRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dataText: { fontSize: 12, color: colors.textLight },

  placard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 10, elevation: 4,
  },
  equipaBlock: {
    flex: 1, alignItems: 'center', padding: 16, paddingVertical: 24,
    backgroundColor: colors.background,
  },
  equipaBlockWin: { backgroundColor: '#f0fff8' },
  equipaNome: { fontSize: 13, fontWeight: '700', color: colors.text, textAlign: 'center', marginBottom: 8 },
  playersRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, justifyContent: 'center', marginBottom: 12 },
  playerChip: {
    backgroundColor: colors.border, borderRadius: 8,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  playerChipText: { fontSize: 10, color: colors.text, fontWeight: '600' },
  setsScore: { fontSize: 48, fontWeight: '900', color: colors.textLight },
  setsScoreWin: { color: colors.secondary },

  vsBlock: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8, backgroundColor: colors.white },
  vsText: { fontSize: 11, fontWeight: '800', color: colors.textLight, marginBottom: 12 },
  setsColumn: { gap: 6 },
  setRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  setNum: { fontSize: 14, fontWeight: '700', color: colors.textLight, width: 18, textAlign: 'center' },
  setNumWin: { color: colors.secondary },
  setDash: { fontSize: 12, color: colors.border },

  vencedorBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: '#fffbeb', borderRadius: 12,
    padding: 12, borderWidth: 1.5, borderColor: '#FFD700',
  },
  vencedorText: { fontSize: 15, fontWeight: '700', color: '#7a5c00' },

  setBubble: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  setBubbleWin: { backgroundColor: colors.secondary },
  setBubbleText: { fontSize: 13, fontWeight: '700', color: colors.textLight },
  setBubbleTextWin: { color: colors.white },
});
