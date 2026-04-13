import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, Alert,
  Animated, Dimensions, Modal, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { login, resetPassword } from '../services/authService';
import { colors } from '../theme/colors';

const { width } = Dimensions.get('window');

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  // Animations
  const ballScale = useRef(new Animated.Value(0.8)).current;
  const ballRotate = useRef(new Animated.Value(0)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;
  const formTranslateY = useRef(new Animated.Value(50)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoTranslateY = useRef(new Animated.Value(-40)).current;
  const ring1Scale = useRef(new Animated.Value(1)).current;
  const ring1Opacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    // Logo entrance
    Animated.parallel([
      Animated.timing(logoOpacity, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.spring(logoTranslateY, { toValue: 0, tension: 60, friction: 8, useNativeDriver: true }),
      Animated.spring(ballScale, { toValue: 1, tension: 60, friction: 6, useNativeDriver: true }),
    ]).start();

    // Form entrance (delayed)
    Animated.parallel([
      Animated.timing(formOpacity, { toValue: 1, duration: 600, delay: 400, useNativeDriver: true }),
      Animated.timing(formTranslateY, { toValue: 0, duration: 500, delay: 400, useNativeDriver: true }),
    ]).start();

    // Ball pulse loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(ballScale, { toValue: 1.12, duration: 900, useNativeDriver: true }),
        Animated.timing(ballScale, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    ).start();

    // Ball slow rotation
    Animated.loop(
      Animated.timing(ballRotate, { toValue: 1, duration: 6000, useNativeDriver: true })
    ).start();

    // Ring pulse loop
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(ring1Scale, { toValue: 1.4, duration: 1200, useNativeDriver: true }),
          Animated.timing(ring1Scale, { toValue: 1, duration: 1200, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(ring1Opacity, { toValue: 0, duration: 1200, useNativeDriver: true }),
          Animated.timing(ring1Opacity, { toValue: 0.6, duration: 1200, useNativeDriver: true }),
        ]),
      ])
    ).start();
  }, []);

  const spin = ballRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Atenção', 'Preenche o email e a password.');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
    } catch (e) {
      const msgs = {
        'auth/invalid-credential': 'Email ou password incorretos.',
        'auth/user-not-found': 'Utilizador não encontrado.',
        'auth/wrong-password': 'Password incorreta.',
        'auth/too-many-requests': 'Demasiadas tentativas. Tenta mais tarde.',
        'auth/network-request-failed': 'Sem ligação à internet.',
      };
      Alert.alert('Erro', msgs[e.code] || 'Erro ao iniciar sessão.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSend = async () => {
    if (!forgotEmail.trim()) {
      Alert.alert('Atenção', 'Insere o teu email.');
      return;
    }
    setForgotLoading(true);
    try {
      await resetPassword(forgotEmail.trim().toLowerCase());
      setShowForgot(false);
      Alert.alert('Email enviado', 'Verifica a tua caixa de email para recuperar a password.');
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível enviar o email de recuperação.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Background decorative elements */}
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />
      <View style={styles.bgCircle3} />

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <Animated.View
          style={[styles.logoBox, {
            opacity: logoOpacity,
            transform: [{ translateY: logoTranslateY }],
          }]}
        >
          {/* Pulsing ring around ball */}
          <View style={styles.ballWrapper}>
            <Animated.View style={[styles.ring, {
              transform: [{ scale: ring1Scale }],
              opacity: ring1Opacity,
            }]} />
            <Animated.View style={{
              transform: [{ scale: ballScale }, { rotate: spin }],
            }}>
              <Ionicons name="tennisball" size={72} color={colors.white} />
            </Animated.View>
          </View>

          <Text style={styles.logoText}>Padel SERUL</Text>
          <Text style={styles.logoSub}>Gestão de Jogos</Text>
        </Animated.View>

        {/* Form */}
        <Animated.View style={[styles.form, {
          opacity: formOpacity,
          transform: [{ translateY: formTranslateY }],
        }]}>
          <Text style={styles.formTitle}>Bem-vindo de volta</Text>
          <Text style={styles.formSub}>Inicia sessão para continuar</Text>

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

          <View style={styles.inputBox}>
            <Ionicons name="lock-closed-outline" size={20} color={colors.primary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              placeholderTextColor={colors.textLight}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeBtn}
              accessibilityRole="button"
              accessibilityLabel={showPassword ? 'Esconder password' : 'Mostrar password'}
            >
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={colors.textLight}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => { setForgotEmail(email); setShowForgot(true); }}
            style={styles.forgotLink}
            accessibilityRole="button"
            accessibilityLabel="Recuperar password"
          >
            <Text style={styles.forgotText}>Esqueci a password</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btnLogin, loading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Entrar na aplicação"
          >
            {loading
              ? <ActivityIndicator color={colors.white} />
              : (
                <View style={styles.btnLoginInner}>
                  <Text style={styles.btnLoginText}>Entrar</Text>
                  <Ionicons name="arrow-forward" size={18} color={colors.white} />
                </View>
              )
            }
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ou</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={styles.btnRegister}
            onPress={() => navigation.navigate('Registo')}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Criar conta"
          >
            <Ionicons name="person-add-outline" size={18} color={colors.primary} />
            <Text style={styles.btnRegisterText}>Criar conta</Text>
          </TouchableOpacity>
        </Animated.View>

        <Text style={styles.footer}>Padel SERUL © 2025</Text>
      </ScrollView>

      {/* Modal Esqueci Password */}
      <Modal visible={showForgot} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Ionicons name="key-outline" size={28} color={colors.primary} />
              <Text style={styles.modalTitle}>Recuperar password</Text>
            </View>
            <Text style={styles.modalSub}>Envia-te um link por email para criares uma nova password.</Text>

            <View style={styles.inputBox}>
              <Ionicons name="mail-outline" size={20} color={colors.primary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="O teu email"
                value={forgotEmail}
                onChangeText={setForgotEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                placeholderTextColor={colors.textLight}
                autoFocus
              />
            </View>

            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={styles.modalBtnCancel}
                onPress={() => setShowForgot(false)}
                accessibilityRole="button"
                accessibilityLabel="Cancelar recuperação"
              >
                <Text style={styles.modalBtnCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtnSend, forgotLoading && styles.btnDisabled]}
                onPress={handleForgotSend}
                disabled={forgotLoading}
                accessibilityRole="button"
                accessibilityLabel="Enviar email de recuperação"
              >
                {forgotLoading
                  ? <ActivityIndicator color={colors.white} size="small" />
                  : <Text style={styles.modalBtnSendText}>Enviar</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  // Background decorative circles
  bgCircle1: {
    position: 'absolute', top: -80, right: -60,
    width: 220, height: 220, borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  bgCircle2: {
    position: 'absolute', top: 120, left: -80,
    width: 180, height: 180, borderRadius: 90,
    backgroundColor: 'rgba(0,168,107,0.2)',
  },
  bgCircle3: {
    position: 'absolute', bottom: 60, right: -40,
    width: 150, height: 150, borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 28,
    paddingTop: 60,
    paddingBottom: 32,
  },
  // Logo
  logoBox: {
    alignItems: 'center',
    marginBottom: 40,
  },
  ballWrapper: {
    width: 100, height: 100,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },
  ring: {
    position: 'absolute',
    width: 96, height: 96, borderRadius: 48,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)',
  },
  logoText: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: 1.5,
  },
  logoSub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.65)',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  // Form card
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
  inputIcon: { marginRight: 10 },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.text,
  },
  eyeBtn: { padding: 4 },
  forgotLink: { alignSelf: 'flex-end', marginBottom: 20, marginTop: 4 },
  forgotText: { color: colors.primary, fontSize: 13, fontWeight: '600' },
  // Login button
  btnLogin: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  btnLoginInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  btnDisabled: { opacity: 0.6 },
  btnLoginText: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1, height: 1, backgroundColor: colors.border,
  },
  dividerText: {
    color: colors.textLight, fontSize: 13,
  },
  // Register button
  btnRegister: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    backgroundColor: 'transparent',
  },
  btnRegisterText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  footer: {
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    marginTop: 24,
    fontSize: 12,
  },
  // Forgot Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  modalBox: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 28,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  modalSub: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 20,
    lineHeight: 20,
  },
  modalBtns: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalBtnCancel: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  modalBtnCancelText: {
    color: colors.textLight,
    fontSize: 15,
    fontWeight: '600',
  },
  modalBtnSend: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  modalBtnSendText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
});
