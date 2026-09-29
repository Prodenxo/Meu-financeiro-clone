import React, { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native'
import { AuthLayoutWeb } from '../../components/auth/AuthLayoutWeb'
import { AuthLayoutMobile } from '../../components/auth/AuthLayoutMobile'
import {
  AuthAlert,
  AuthButton,
  AuthInput,
  AuthLink,
} from '../../components/auth/AuthFormControls'
import { AuthPasswordStrength } from '../../components/auth/AuthPasswordStrength'
import { getAuthPalette } from '../../components/auth/authTokens'
import { supabase } from '../../lib/supabase'
import { getSupabaseAuthMessagePt } from '../../lib/authErrors'
import {
  getPasswordStrength,
  validatePasswordMatch,
  validateRecoveryPassword,
} from '../../lib/authValidation'
import { useAuthStore } from '../../store/authStore'
import { useThemeStore } from '../../store/themeStore'

type RecoveryStatus =
  | 'validating_link'
  | 'ready'
  | 'invalid_link'
  | 'expired_or_invalid_token'
  | 'network_error'
  | 'updated'

export type ResetPasswordScreenProps = {
  accessToken?: string
  refreshToken?: string
  tokenHash?: string
  invalidLink?: boolean
  onClose: () => void
}

function getRecoveryErrorMessage (error: unknown): { status: RecoveryStatus; message: string } {
  const msg = getSupabaseAuthMessagePt(error)
  const lower = msg.toLowerCase()
  const genericRecoveryError =
    'Não foi possível validar o link de recuperação. Solicite um novo link e tente novamente.'

  if (
    lower.includes('network')
    || lower.includes('fetch')
    || lower.includes('internet')
    || lower.includes('conex')
  ) {
    return {
      status: 'network_error',
      message: 'Não foi possível comunicar com o servidor. Verifique sua internet e tente novamente.',
    }
  }

  if (
    lower.includes('expired')
    || lower.includes('invalid')
    || lower.includes('jwt')
    || lower.includes('token')
  ) {
    return {
      status: 'expired_or_invalid_token',
      message: 'O link de recuperação está inválido ou expirou. Solicite um novo link na tela de login.',
    }
  }

  return {
    status: 'expired_or_invalid_token',
    message: genericRecoveryError,
  }
}

export default function ResetPasswordScreen ({
  accessToken,
  refreshToken,
  tokenHash,
  invalidLink = false,
  onClose,
}: ResetPasswordScreenProps) {
  const isDarkMode = useThemeStore((s) => s.isDarkMode)
  const palette = getAuthPalette(isDarkMode)
  const signOut = useAuthStore((s) => s.signOut)

  const [status, setStatus] = useState<RecoveryStatus>(
    invalidLink ? 'invalid_link' : 'validating_link',
  )
  const [message, setMessage] = useState<string>(
    invalidLink
      ? 'Link inválido. Volte ao login e solicite nova recuperação de senha.'
      : 'Validando link de recuperação…',
  )
  const [formError, setFormError] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)

  const strength = useMemo(() => getPasswordStrength(password), [password])
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword
  const canSubmit =
    status === 'ready'
    && strength.isValid
    && passwordsMatch
    && !loading

  useEffect(() => {
    let cancelled = false

    const bootstrapRecovery = async () => {
      if (invalidLink) return

      if (tokenHash) {
        try {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: 'recovery',
          })
          if (error) throw error

          if (!cancelled) {
            setStatus('ready')
            setMessage('Crie uma senha forte para proteger sua conta.')
          }
        } catch (error: unknown) {
          const parsed = getRecoveryErrorMessage(error)
          if (!cancelled) {
            setStatus(parsed.status)
            setMessage(parsed.message)
          }
        }
        return
      }

      if (!accessToken || !refreshToken) {
        if (!cancelled) {
          setStatus('invalid_link')
          setMessage('Link inválido. Volte ao login e solicite nova recuperação de senha.')
        }
        return
      }

      try {
        await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })

        if (!cancelled) {
          setStatus('ready')
          setMessage('Crie uma senha forte para proteger sua conta.')
        }
      } catch (error: unknown) {
        const parsed = getRecoveryErrorMessage(error)
        if (!cancelled) {
          setStatus(parsed.status)
          setMessage(parsed.message)
        }
      }
    }

    void bootstrapRecovery()
    return () => {
      cancelled = true
    }
  }, [accessToken, refreshToken, tokenHash, invalidLink])

  const handleSubmit = async () => {
    setFormError('')
    const e1 = validateRecoveryPassword(password)
    if (e1) {
      setFormError(e1)
      return
    }
    const e2 = validatePasswordMatch(password, confirmPassword)
    if (e2) {
      setFormError(e2)
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error

      await signOut()
      setStatus('updated')
      setMessage('Senha atualizada com sucesso. Entre novamente com a nova senha.')
    } catch (error: unknown) {
      const parsed = getRecoveryErrorMessage(error)
      if (parsed.status === 'network_error' || parsed.status === 'expired_or_invalid_token') {
        setStatus(parsed.status)
        setMessage(parsed.message)
      } else {
        setFormError(parsed.message)
      }
    } finally {
      setLoading(false)
    }
  }

  const isBlockingState =
    status === 'invalid_link'
    || status === 'expired_or_invalid_token'
    || status === 'network_error'

  const subtitle =
    status === 'updated'
      ? message
      : status === 'ready'
        ? message
        : message

  const formBody = (
    <>
      {status === 'validating_link' ? (
        <View style={styles.centeredRow} accessibilityLabel="Validando link">
          <ActivityIndicator size="small" color={palette.primaryButton} />
        </View>
      ) : null}

      {status === 'ready' ? (
        <View style={styles.formStack}>
          <AuthAlert
            kind="success"
            title="Link verificado"
            message="Defina uma senha forte. Não compartilhe este link com ninguém."
            palette={palette}
          />

          <AuthInput
            label="Nova senha"
            required
            palette={palette}
            value={password}
            onChangeText={(text) => {
              setPassword(text)
              if (formError) setFormError('')
            }}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoComplete="new-password"
            textContentType="newPassword"
            placeholder="Crie uma senha segura"
            rightIconToggle={{
              iconWhenSecure: 'eye-off-outline',
              iconWhenVisible: 'eye-outline',
              accessibilityLabelShow: 'Mostrar senha',
              accessibilityLabelHide: 'Ocultar senha',
              isVisible: showPassword,
              onToggle: () => setShowPassword((v) => !v),
            }}
          />

          <AuthPasswordStrength password={password} palette={palette} />

          <AuthInput
            label="Confirmar nova senha"
            required
            palette={palette}
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text)
              if (formError) setFormError('')
            }}
            secureTextEntry={!showConfirm}
            autoCapitalize="none"
            autoComplete="new-password"
            textContentType="newPassword"
            placeholder="Repita a senha"
            onSubmitEditing={() => {
              if (canSubmit) void handleSubmit()
            }}
            returnKeyType="go"
            rightIconToggle={{
              iconWhenSecure: 'eye-off-outline',
              iconWhenVisible: 'eye-outline',
              accessibilityLabelShow: 'Mostrar confirmação',
              accessibilityLabelHide: 'Ocultar confirmação',
              isVisible: showConfirm,
              onToggle: () => setShowConfirm((v) => !v),
            }}
          />

          {confirmPassword.length > 0 ? (
            <AuthAlert
              kind={passwordsMatch ? 'success' : 'error'}
              message={passwordsMatch ? 'As senhas coincidem.' : 'As senhas ainda não coincidem.'}
              palette={palette}
            />
          ) : null}

          {formError ? <AuthAlert kind="error" message={formError} palette={palette} /> : null}

          <AuthButton
            label="Atualizar senha"
            loadingLabel="Atualizando…"
            loading={loading}
            disabled={!canSubmit}
            onPress={() => void handleSubmit()}
            palette={palette}
          />

          <AuthLink
            label="Voltar ao login"
            align="center"
            palette={palette}
            onPress={onClose}
          />
        </View>
      ) : null}

      {status === 'updated' ? (
        <View style={styles.formStack}>
          <AuthAlert
            kind="success"
            title="Senha atualizada"
            message={message}
            palette={palette}
          />
          <AuthButton
            label="Ir para o login"
            onPress={onClose}
            palette={palette}
          />
        </View>
      ) : null}

      {isBlockingState ? (
        <View style={styles.formStack}>
          <AuthAlert kind="error" title="Não foi possível continuar" message={message} palette={palette} />
          <AuthButton label="Voltar ao login" onPress={onClose} palette={palette} />
          <AuthLink
            label="Solicitar novo link"
            align="center"
            palette={palette}
            onPress={onClose}
          />
        </View>
      ) : null}
    </>
  )

  if (Platform.OS === 'web') {
    return (
      <AuthLayoutWeb
        title="Redefinir senha"
        subtitle={
          status === 'ready'
            ? 'Escolha uma senha forte para concluir a recuperação.'
            : subtitle
        }
        showIllustration
        illustrationHeadline="Conta protegida"
        illustrationSubheadline="Senha forte, acesso seguro ao Meu Financeiro e MEI Infinito."
      >
        {formBody}
      </AuthLayoutWeb>
    )
  }

  return (
    <AuthLayoutMobile
      title="Redefinir senha"
      subtitle={
        status === 'ready'
          ? 'Escolha uma senha forte para concluir a recuperação.'
          : subtitle
      }
      eyebrowLabel="RECUPERAÇÃO"
    >
      {formBody}
    </AuthLayoutMobile>
  )
}

const styles = StyleSheet.create({
  centeredRow: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  formStack: {
    gap: 14,
  },
})
