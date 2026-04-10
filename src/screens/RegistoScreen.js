import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, Alert,
  Animated, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { registar, criarPerfil } from '../services/authService';
import { colors } from '../theme/colors';

export default function RegistoScreen({ navigation }) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const formOpacity = useRef(new Animated.Value(0)).current;
  const formTranslateY = useRef(new Animated.Value(40)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoTranslateY = useRef(new Animated.Value(-30)).current;
  const ballScale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(logoOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(logoTranslateY, { toValue: 0, tension: 60, friction: 8, useNativeDriver: true }),
      Animated.spring(ballScale, { toValue: 1, tension: 60, friction: 6, useNativeDriver: true }),
    ]).start();

    Animated.parallel([
      Animated.timing(formOpacity, { toValue: 1, duration: 600, delay: 300, useNativeDriver: true }),
      Animated.timing(formTranslateY, { toValue: 0, duration: 500, delay: 300, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(ballScale, { toValue: 1.1, duration: 1000, useNativeDriver: true }),
        Animated.timing(ballScale, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const handleRegisto = async () => {
    if (!nome.trim()) { Alert.alert('Atenção', 'Insere o teu nome.'); return; }
    if (!email.trim()) { Alert.alert('Atenção', 'Insere o teu email.'); return; }
    if (password.length < 6) { Alert.alert('Atenção', 'A password precisa de ter pelo menos 6 caracteres.'); return; }
    if (password !== confirmar) { Alert.alert('Atenção', 'As passwords não coincidem.'); return; }

    setLoading(true);
    try {
      const user = await registar(email.trim().toLowerCase(), password);
      await criarPerfil(user.uid, email.trim().toLowerCase(), nome.trim(), 'viewer');
      // Auth state change → app vai para o ecrã principal automaticamente
    } catch (e) {
      const msgs = {
        'auth/email-already-in-use': 'Este email já tem uma conta. Tenta fazer login.',
        'auth/invalid-email': 'Email inválido.',
        'auth/weak-password': 'Password demasiado fraca (mínimo 6 caracteres).',
        'auth/network-request-failed': 'Sem ligação à internet.',
      };
      Alert.alert('Erro', msgs[e.code] || 'Não foi possível criar a conta.');
    } finally {
      setLoading(false);
    }
  };

  const strengthColor = () => {
    if (password.length === 0) return colors.border;
    if (password.length < 6) return colors.danger;
    if (password.length < 10) return colors.warning;
    return colors.secondary;
  };

  const strengthWidth = () => {
    if (password.length === 0) return '0%';
    if (password.length < 6) return '33%';
    if (password.length < 10) return '66%';
    return '100%';
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Background decoration */}
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View style={[styles.logoBox, {
          opacity: logoOpacity,
          transform: [{ translateY: logoTranslateY }],
        }]}>
          <Animated.View style={{ transform: [{ scale: ballScale }] }}>
            <View style={styles.iconCircle}>
              <Ionicons name="person-add" size={42} color={colors.white} />
            </View>
          </Animated.View>
          <Text style={styles.logoText}>Criar Conta</Text>
          <Text style={styles.logoSub}>Padel SERUL</Text>
        </Animated.View>

        {/* Form */}
        <Animated.View style={[styles.form, {
          opacity: formOpacity,
          transform: [{ translateY: formTranslateY }],
        }]}>
          <Text style={styles.formTitle}>Os teus dados</Text>
          <Text style={styles.formSub}>Preenche para criar a tua conta</Text>

          {/* Nome */}
          <View style={styles.inputBox}>
            <Ionicons name="person-outline" size={20} color={colors.primary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Nome completo"
              value={nome}
              onChangeText={setNome}
              autoCapitalize="words"
              placeholderTextColor={colors.textLight}
            />
          </View>

          {/* Email */}
          <View style={styles.inputBox}>
            <Ionicons name="mail-outline" size={20} color={colors.primary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              placeholderTextColor={colors.textLight}
            />
          </View>

          {/* Password */}
          <View style={styles.inputBox}>
            <Ionicons name="lock-closed-outline" size={20} color={colors.primary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password (mín. 6 caracteres)"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPass}
              placeholderTextColor={colors.textLight}
            />
            <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
              <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textLight} />
            </TouchableOpacity>
          </View>

          {/* Password strength bar */}
          {password.length > 0 && (
            <View style={styles.strengthRow}>
              <View style={styles.strengthBar}>
                <View style={[styles.strengthFill, { width: strengthWidth(), backgroundColor: strengthColor() }]} />
              </View>
              <Text style={[styles.strengthLabel, { color: strengthColor() }]}>
                {password.length < 6 ? 'Fraca' : password.length < 10 ? 'Boa' : 'Forte'}
              </Text>
            </View>
          )}

          {/* Confirmar password */}
          <View style={[styles.inputBox, confirmar && password !== confirmar && styles.inputError]}>
            <Ionicons name="shield-checkmark-outline" size={20} color={confirmar && password !== confirmar ? colors.danger : colors.primary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Confirmar password"
              value={confirmar}
              onChangeText={setConfirmar}
              secureTextEntry={!showConfirm}
              placeholderTextColor={colors.textLight}
            />
            <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} style={styles.eyeBtn}>
              <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textLight} />
            </TouchableOpacity>
          </View>
          {confirmar && password !== confirmar && (
            <Text style={styles.errorText}>As passwords não coincidem</Text>
          )}

          {/* Info box */}
          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={16} color={colors.primary} />
            <Text style={styles.infoText}>A tua conta fica com acesso de <Text style={{ fontWeight: '700' }}>Consultor</Text>. Um administrador pode alterar o teu perfil.</Text>
          </View>

          <TouchableOpacity
            style={[styles.btnRegisto, loading && styles.btnDisabled]}
            onPress={handleRegisto}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color={colors.white} />
              : (
                <View style={styles.btnInner}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.white} />
                  <Text style={styles.btnRegistoText}>Criar conta</Text>
                </View>
              )
            }
          </TouchableOpacity>

          <TouchableOpacity style={styles.loginLink} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={16} color={colors.primary} />
            <Text style={styles.loginLinkText}>Já tenho conta</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.secondary,
  },
  bgCircle1: {
    position: 'absolute', top: -60, left: -60,
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  bgCircle2: {
    position: 'absolute', bottom: 40, right: -50,
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: 'rgba(0,102,204,0.2)',
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 28,
    paddingTop: 60,
    paddingBottom: 32,
  },
  logoBox: {
    alignItems: 'center',
    marginBottom: 36,
  },
  iconCircle: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)',
  },
  logoText: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: 1,
  },
  logoSub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.65)',
    marginTop: 4,
  },
  form: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  formSub: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 24,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    backgroundColor: colors.background,
    marginBottom: 12,
  },
  inputError: {
    borderColor: colors.danger,
  },
  inputIcon: { marginRight: 10 },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.text,
  },
  eyeBtn: { padding: 4 },
  strengthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: -4,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  strengthBar: {
    flex: 1, height: 4, backgroundColor: colors.border, borderRadius: 2,
  },
  strengthFill: {
    height: 4, borderRadius: 2,
  },
  strengthLabel: {
    fontSize: 11, fontWeight: '700', width: 32,
  },
  errorText: {
    color: colors.danger,
    fontSize: 12,
    marginTop: -8,
    marginBottom: 8,
    paddingLeft: 4,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#e8f0ff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
    marginTop: 4,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: colors.primary,
    lineHeight: 18,
  },
  btnRegisto: {
    backgroundColor: colors.secondary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  btnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  btnDisabled: { opacity: 0.6 },
  btnRegistoText: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  loginLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 20,
    paddingVertical: 4,
  },
  loginLinkText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '600',
  },
});
