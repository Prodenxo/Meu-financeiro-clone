import React from 'react'
import {
  View,
  Text,
  Image,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { DashboardCanvasBackground } from '../../screens/Dashboard/DashboardCanvasBackground'
import { mfTechPanelChrome } from '../../lib/techDesign'
import { mfRadius, mfSpacing } from '../../lib/theme'
import { MfScrollView } from '../ui/MfScrollView'
import {
  authSpacing,
  authTypography,
  getAuthPalette,
} from './authTokens'
import { AuthEyebrow } from './AuthEyebrow'
import { AuthThemeToggle } from './AuthThemeToggle'
import { useThemeStore } from '../../store/themeStore'

export type AuthLayoutMobileProps = {
  title: string
  subtitle?: string
  eyebrowLabel?: string
  children: React.ReactNode
}

export function AuthLayoutMobile ({
  title,
  subtitle,
  eyebrowLabel = 'ACESSO À CONTA',
  children,
}: AuthLayoutMobileProps) {
  const isDarkMode = useThemeStore((s) => s.isDarkMode)
  const palette = getAuthPalette(isDarkMode)
  const panelChrome = mfTechPanelChrome(isDarkMode, 'surface')

  return (
    <View style={[styles.root, { backgroundColor: palette.bgCanvas }]}>
      <DashboardCanvasBackground isDarkMode={isDarkMode} />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.topBar}>
          <AuthThemeToggle variant="inline" />
        </View>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flex}
        >
          <MfScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.brandLockup}>
              <Image
                source={require('../../assets/logo.png')}
                accessibilityLabel="Meu Financeiro"
                resizeMode="contain"
                style={styles.logo}
              />
              <Text style={[styles.brandName, { color: palette.titleText }]}>
                Meu Financeiro
              </Text>
            </View>

            <View
              style={[
                styles.panel,
                panelChrome,
                {
                  borderColor: palette.cardBorder,
                  backgroundColor: palette.cardBg,
                },
                Platform.OS === 'web'
                  ? ({ boxShadow: palette.cardShadow } as object)
                  : {
                      shadowColor: '#0f172a',
                      shadowOffset: { width: 0, height: 8 },
                      shadowOpacity: isDarkMode ? 0.35 : 0.12,
                      shadowRadius: 24,
                      elevation: 6,
                    },
              ]}
            >
              <AuthEyebrow
                label={eyebrowLabel}
                dotColor={palette.eyebrowDot}
                textColor={palette.eyebrowText}
              />
              <View style={styles.header}>
                <Text style={[styles.title, { color: palette.titleText }]}>{title}</Text>
                {subtitle ? (
                  <Text style={[styles.subtitle, { color: palette.subtitleText }]}>
                    {subtitle}
                  </Text>
                ) : null}
              </View>
              <View style={styles.content}>{children}</View>
            </View>
          </MfScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: mfSpacing.md,
    paddingTop: mfSpacing.xs,
    paddingBottom: mfSpacing.sm,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: mfSpacing.md,
    paddingTop: mfSpacing.sm,
    paddingBottom: mfSpacing.xl,
  },
  brandLockup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: mfSpacing.sm,
    marginBottom: mfSpacing.lg,
  },
  logo: {
    width: 36,
    height: 36,
  },
  brandName: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  panel: {
    width: '100%',
    borderRadius: mfRadius.xl,
    paddingHorizontal: authSpacing.cardPaddingHMobile,
    paddingVertical: authSpacing.cardPaddingVMobile,
    gap: authSpacing.fieldGap,
  },
  header: {
    marginTop: mfSpacing.xs,
  },
  title: {
    fontSize: authTypography.titleSize,
    fontWeight: authTypography.titleWeight,
    lineHeight: authTypography.titleLineHeight,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: authTypography.subtitleSize,
    fontWeight: authTypography.subtitleWeight,
    lineHeight: authTypography.subtitleLineHeight,
    marginTop: mfSpacing.xs,
  },
  content: {
    width: '100%',
    gap: authSpacing.fieldGap,
  },
})
