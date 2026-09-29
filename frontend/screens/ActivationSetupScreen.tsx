import React, { useCallback, useMemo, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Platform,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useFocusEffect } from 'expo-router'
import { MfScrollView } from '../components/ui/MfScrollView'
import { useMfTheme } from '../components/ui/useMfTheme'
import { useThemeStore } from '../store/themeStore'
import { mfRadius, mfSpacing, mfTypography } from '../lib/theme'
import { mfTechPanelChrome } from '../lib/techDesign'
import {
  fetchActivationProgress,
  type ActivationPayload,
  type ActivationStep,
} from '../services/activationService'
import { ActivationStepList } from '../components/activation/ActivationStepList'
import { activationRouteToScreen } from '../lib/activationStepRoutes'
import { setSessionActivationSkipped } from '../lib/activationSession'
import { isEmpresaCnpjOnboardingRequired } from '../lib/empresaCnpjGate'
import { EMPRESA_CNPJ_ONBOARDING_ROUTE } from '../lib/settingsRoutes'
import { SCREEN_TO_HREF } from '../lib/appNavConfig'
import type { AppScreenName } from '../lib/navigationContext'
import { ActivationPageCanvas } from '../components/activation/ActivationPageCanvas'
import {
  ActivationEyebrow,
  ActivationProgressBlock,
} from '../components/activation/activationUi'
import { useNavigationDrawer } from '../lib/navigationContext'

export default function ActivationSetupScreen () {
  const { theme, isDarkMode } = useMfTheme()
  const { isDarkMode: storeDark } = useThemeStore()
  const dark = isDarkMode ?? storeDark
  const insets = useSafeAreaInsets()
  const { hasGlobalNav } = useNavigationDrawer()
  const router = useRouter()
  const scrollBottomPad = Math.max(insets.bottom, mfSpacing.lg) + mfSpacing.xxl
  const [payload, setPayload] = useState<ActivationPayload | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    if (await isEmpresaCnpjOnboardingRequired()) {
      setLoading(false)
      router.replace(EMPRESA_CNPJ_ONBOARDING_ROUTE as never)
      return
    }
    const data = await fetchActivationProgress()
    setPayload(data)
    setLoading(false)
    if (data?.progress.isFullyComplete) {
      router.replace(SCREEN_TO_HREF.Dashboard as any)
    }
  }, [router])

  useFocusEffect(
    useCallback(() => {
      void load()
    }, [load]),
  )

  const handleStep = (step: ActivationStep) => {
    const screen = activationRouteToScreen(step.route)
    if (screen) {
      router.push(SCREEN_TO_HREF[screen as AppScreenName] as any)
    }
  }

  const handleSkip = () => {
    setSessionActivationSkipped(true)
    router.replace(SCREEN_TO_HREF.Dashboard as any)
  }

  const progress = payload?.progress
  const steps = payload?.steps ?? []

  const heroChrome = useMemo(
    () => [mfTechPanelChrome(dark, 'accent'), styles.heroPanel],
    [dark],
  )

  if (loading && !payload) {
    return (
      <ActivationPageCanvas isDarkMode={dark}>
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        </SafeAreaView>
      </ActivationPageCanvas>
    )
  }

  if (!payload || !progress) {
    return (
      <ActivationPageCanvas isDarkMode={dark}>
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
          <View style={styles.centered}>
            <Text style={{ color: theme.textSecondary }}>
              Não foi possível carregar o checklist. Tente novamente mais tarde.
            </Text>
            <Pressable onPress={handleSkip} accessibilityRole="button">
              <Text style={[styles.skipGhost, { color: theme.primary }]}>
                Ir para o app
              </Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </ActivationPageCanvas>
    )
  }

  return (
    <ActivationPageCanvas isDarkMode={dark}>
      <SafeAreaView
        style={styles.safe}
        edges={hasGlobalNav ? ['bottom'] : ['top', 'bottom']}
      >
        <MfScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: scrollBottomPad },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator
          nestedScrollEnabled
        >
          <View style={heroChrome}>
            <ActivationEyebrow label="Configuração" isDarkMode={dark} />
            <Text style={[styles.heroTitle, { color: theme.text }]}>
              Deixe sua conta pronta
            </Text>
            <Text style={[styles.heroSubtitle, { color: theme.textSecondary }]}>
              Complete os passos abaixo para usar transações, WhatsApp e MEI sem
              atrito. Você pode pular e voltar em Configurações — ao entrar de novo,
              este guia reaparece até concluir.
            </Text>
            <ActivationProgressBlock
              completed={progress.completedAll}
              total={progress.totalAll}
              percent={progress.percentAll ?? progress.percent}
              isDarkMode={dark}
              label={
                (progress.isCoreComplete ?? progress.isComplete)
                  ? 'Progresso geral (MEI e recomendados)'
                  : 'Passos obrigatórios'
              }
            />
          </View>

          <ActivationStepList
            steps={steps}
            theme={theme}
            isDarkMode={dark}
            onStepPress={handleStep}
          />

          <View style={styles.footer}>
            <Pressable
              onPress={handleSkip}
              style={({ pressed }) => [
                styles.skipButton,
                mfTechPanelChrome(dark, 'inset'),
                { opacity: pressed ? 0.9 : 1 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Pular e fazer depois"
            >
              <Text style={[styles.skipButtonText, { color: theme.textSecondary }]}>
                Pular e fazer depois
              </Text>
            </Pressable>
          </View>
        </MfScrollView>
      </SafeAreaView>
    </ActivationPageCanvas>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    minHeight: Platform.OS === 'web' ? 0 : undefined,
  },
  scrollView: {
    flex: 1,
    minHeight: Platform.OS === 'web' ? 0 : undefined,
  },
  scrollContent: {
    flexGrow: 1,
    gap: mfSpacing.lg,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: mfSpacing.lg,
    gap: mfSpacing.md,
    minHeight: 280,
  },
  heroPanel: {
    padding: mfSpacing.lg,
    borderRadius: mfRadius.lg,
  },
  heroTitle: {
    ...mfTypography.titleLarge,
    marginBottom: mfSpacing.sm,
  },
  heroSubtitle: {
    ...mfTypography.body,
    lineHeight: 22,
  },
  footer: {
    alignItems: 'center',
    paddingTop: mfSpacing.sm,
  },
  skipButton: {
    paddingVertical: mfSpacing.md,
    paddingHorizontal: mfSpacing.xl,
    borderRadius: mfRadius.md,
    alignItems: 'center',
    minWidth: 280,
    maxWidth: '100%',
  },
  skipButtonText: {
    ...mfTypography.bodyStrong,
  },
  skipGhost: {
    ...mfTypography.bodyStrong,
    padding: mfSpacing.md,
  },
})
