import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  Pressable,
  useWindowDimensions,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as DocumentPicker from 'expo-document-picker'
import { Calendar, type DateData } from 'react-native-calendars'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useThemeStore } from '../../store/themeStore'
import { getTheme, mfRadius, mfSpacing, mfTypography } from '../../lib/theme'
import {
  getSiteTokens,
  mfSiteInput,
  mfSitePanel,
  siteFieldLabelStyle,
  siteHintStyle,
} from '../../lib/siteDesign'
import { ensureCalendarLocalePtBR } from '../../lib/calendarLocale'
import {
  createSupportTicket,
  defaultSupportTicketPrazo,
  fetchSupportTicketForm,
  type SupportTicketAttachment,
  type SupportTicketFormConfig,
  type SupportTicketPriority,
} from '../../services/supportService'
import { getErrorMessage } from '../../lib/errors'

ensureCalendarLocalePtBR()

const PRIORIDADES: {
  key: SupportTicketPriority
  label: string
  icon: keyof typeof Ionicons.glyphMap
  tone: string
}[] = [
  { key: 'baixa', label: 'Baixa', icon: 'arrow-down-outline', tone: '#64748B' },
  { key: 'media', label: 'Média', icon: 'remove-outline', tone: '#3B82F6' },
  { key: 'alta', label: 'Alta', icon: 'arrow-up-outline', tone: '#F59E0B' },
  { key: 'critica', label: 'Crítica', icon: 'alert-circle-outline', tone: '#EF4444' },
]

function formatPrazoLabel(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return 'Selecionar data'
  try {
    return format(parseISO(value), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
  } catch {
    return value
  }
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10)
}

interface SupportTicketModalProps {
  visible: boolean
  onClose: () => void
  defaultNome?: string
  defaultEmail?: string
  defaultTelefone?: string
}

export default function SupportTicketModal({
  visible,
  onClose,
  defaultNome = '',
  defaultEmail = '',
  defaultTelefone = '',
}: SupportTicketModalProps) {
  const { isDarkMode } = useThemeStore()
  const theme = getTheme(isDarkMode)
  const tokens = getSiteTokens(isDarkMode)
  const { width } = useWindowDimensions()
  const isWide = width >= 560
  const styles = useMemo(() => createStyles(theme, tokens, isWide), [theme, tokens, isWide])

  const wasVisibleRef = useRef(false)
  const [loadingConfig, setLoadingConfig] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [config, setConfig] = useState<SupportTicketFormConfig | null>(null)
  const [configError, setConfigError] = useState('')

  const [assunto, setAssunto] = useState('')
  const [descricao, setDescricao] = useState('')
  const [prioridade, setPrioridade] = useState<SupportTicketPriority>('media')
  const [prazo, setPrazo] = useState(defaultSupportTicketPrazo())
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [nomeSolicitante, setNomeSolicitante] = useState(defaultNome)
  const [emailSolicitante, setEmailSolicitante] = useState(defaultEmail)
  const [contatoSolicitante, setContatoSolicitante] = useState(defaultTelefone)
  const [anexos, setAnexos] = useState<SupportTicketAttachment[]>([])
  const [submitError, setSubmitError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    if (!visible) {
      wasVisibleRef.current = false
      return
    }
    if (wasVisibleRef.current) return
    wasVisibleRef.current = true

    setAssunto('')
    setDescricao('')
    setPrioridade('media')
    setPrazo(defaultSupportTicketPrazo())
    setCalendarOpen(false)
    setNomeSolicitante(defaultNome)
    setEmailSolicitante(defaultEmail)
    setContatoSolicitante(defaultTelefone)
    setAnexos([])
    setSubmitError('')
    setSuccessMessage('')
    setConfigError('')
    setConfig(null)

    void (async () => {
      setLoadingConfig(true)
      try {
        const formConfig = await fetchSupportTicketForm()
        setConfig(formConfig)
      } catch (error) {
        setConfigError(getErrorMessage(error, 'Não foi possível carregar o formulário de suporte.'))
      } finally {
        setLoadingConfig(false)
      }
    })()
  }, [visible, defaultNome, defaultEmail, defaultTelefone])

  const handlePickAttachments = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        multiple: true,
        copyToCacheDirectory: true,
        type: Platform.OS === 'web'
          ? undefined
          : [
              'application/pdf',
              'application/msword',
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              'application/vnd.ms-excel',
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
              'application/vnd.ms-powerpoint',
              'application/vnd.openxmlformats-officedocument.presentationml.presentation',
              'text/plain',
              'text/csv',
              'application/rtf',
            ],
      })
      if (result.canceled) return
      const picked = result.assets.map((asset) => ({
        uri: asset.uri,
        name: asset.name || 'anexo',
        type: asset.mimeType || 'application/octet-stream',
      }))
      setAnexos((prev) => [...prev, ...picked])
    } catch (error) {
      setSubmitError(getErrorMessage(error, 'Falha ao selecionar anexos.'))
    }
  }

  const handleRemoveAttachment = (index: number) => {
    setAnexos((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSelectPrazo = (day: DateData) => {
    setPrazo(day.dateString)
    setCalendarOpen(false)
  }

  const handleSubmit = async () => {
    const nome = assunto.trim()
    if (!nome) {
      setSubmitError('Informe o assunto do chamado.')
      return
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(prazo.trim())) {
      setSubmitError('Selecione uma data de prazo válida.')
      return
    }

    setSubmitting(true)
    setSubmitError('')
    try {
      const result = await createSupportTicket(
        {
          nome,
          descricao,
          prioridade,
          prazo: prazo.trim(),
          nome_solicitante: nomeSolicitante,
          email_solicitante: emailSolicitante,
          contato_solicitante: contatoSolicitante,
        },
        anexos,
      )
      setSuccessMessage(result.message || 'Chamado criado com sucesso.')
    } catch (error) {
      setSubmitError(getErrorMessage(error, 'Não foi possível abrir o chamado.'))
    } finally {
      setSubmitting(false)
    }
  }

  const projetoNome = config?.projeto?.nome || 'Meu Financeiro'
  const minDate = todayIsoDate()

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} accessibilityLabel="Fechar modal" />
        <View style={[mfSitePanel(isDarkMode), styles.sheet]}>
          <View style={styles.hero}>
            <View style={styles.heroIconWrap}>
              <Ionicons name="ticket-outline" size={22} color={tokens.neon} />
            </View>
            <View style={styles.heroCopy}>
              <Text style={styles.title}>Abrir chamado</Text>
              <Text style={styles.subtitle}>{projetoNome}</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Fechar formulário de suporte"
              style={styles.closeButton}
            >
              <Ionicons name="close" size={20} color={tokens.textSecondary} />
            </TouchableOpacity>
          </View>

          {loadingConfig ? (
            <View style={styles.centerState}>
              <ActivityIndicator color={tokens.neon} />
              <Text style={styles.helperText}>Carregando formulário…</Text>
            </View>
          ) : configError ? (
            <View style={styles.centerState}>
              <Ionicons name="cloud-offline-outline" size={36} color={theme.error} />
              <Text style={styles.errorText}>{configError}</Text>
              <TouchableOpacity onPress={onClose} style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>Fechar</Text>
              </TouchableOpacity>
            </View>
          ) : successMessage ? (
            <View style={styles.centerState}>
              <View style={styles.successBadge}>
                <Ionicons name="checkmark-circle" size={40} color={theme.success} />
              </View>
              <Text style={styles.successText}>{successMessage}</Text>
              <Text style={styles.helperText}>
                Nossa equipe recebeu seu chamado e retornará em breve.
              </Text>
              <TouchableOpacity onPress={onClose} style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>Concluir</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <ScrollView
                contentContainerStyle={styles.form}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <Section title="Detalhes do chamado" hint="Descreva o que precisa de ajuda">
                  <Field
                    label="Assunto"
                    required
                    icon="chatbox-ellipses-outline"
                    value={assunto}
                    onChangeText={setAssunto}
                    placeholder="Ex.: erro ao emitir nota fiscal"
                  />
                  <Field
                    label="Descrição"
                    icon="document-text-outline"
                    value={descricao}
                    onChangeText={setDescricao}
                    placeholder="Conte o contexto, passos e mensagens de erro"
                    multiline
                  />

                  <Text style={styles.fieldLabel}>Prioridade</Text>
                  <View style={styles.prioridadeRow}>
                    {PRIORIDADES.map((item) => {
                      const active = prioridade === item.key
                      return (
                        <Pressable
                          key={item.key}
                          onPress={() => setPrioridade(item.key)}
                          style={[
                            styles.prioridadeChip,
                            active && { borderColor: item.tone, backgroundColor: `${item.tone}18` },
                          ]}
                          accessibilityRole="button"
                          accessibilityState={{ selected: active }}
                        >
                          <Ionicons
                            name={item.icon}
                            size={14}
                            color={active ? item.tone : tokens.textMuted}
                          />
                          <Text
                            style={[
                              styles.prioridadeChipText,
                              active && { color: item.tone, fontWeight: '700' },
                            ]}
                          >
                            {item.label}
                          </Text>
                        </Pressable>
                      )
                    })}
                  </View>

                  <Text style={styles.fieldLabel}>Prazo desejado</Text>
                  <Pressable
                    onPress={() => setCalendarOpen((open) => !open)}
                    style={[styles.dateTrigger, mfSiteInput(isDarkMode)]}
                    accessibilityRole="button"
                    accessibilityLabel="Selecionar prazo"
                    accessibilityState={{ expanded: calendarOpen }}
                  >
                    <View style={styles.dateTriggerLeft}>
                      <Ionicons name="calendar-outline" size={18} color={tokens.neon} />
                      <View>
                        <Text style={styles.dateTriggerValue}>{formatPrazoLabel(prazo)}</Text>
                        <Text style={styles.dateTriggerHint}>Toque para abrir o calendário</Text>
                      </View>
                    </View>
                    <Ionicons
                      name={calendarOpen ? 'chevron-up' : 'chevron-down'}
                      size={18}
                      color={tokens.textMuted}
                    />
                  </Pressable>

                  {calendarOpen ? (
                    <View style={[styles.calendarCard, mfSiteInput(isDarkMode)]}>
                      <Calendar
                        current={prazo || minDate}
                        minDate={minDate}
                        onDayPress={handleSelectPrazo}
                        markedDates={{
                          [prazo]: {
                            selected: true,
                            selectedColor: tokens.neon,
                            selectedTextColor: '#FFFFFF',
                          },
                        }}
                        theme={{
                          backgroundColor: 'transparent',
                          calendarBackground: 'transparent',
                          textSectionTitleColor: tokens.textSecondary,
                          selectedDayBackgroundColor: tokens.neon,
                          selectedDayTextColor: '#FFFFFF',
                          todayTextColor: tokens.neon,
                          dayTextColor: tokens.textPrimary,
                          textDisabledColor: tokens.textMuted,
                          arrowColor: tokens.neon,
                          monthTextColor: tokens.textPrimary,
                          textDayFontWeight: '500',
                          textMonthFontWeight: '700',
                          textDayHeaderFontWeight: '600',
                          textDayFontSize: 15,
                          textMonthFontSize: 16,
                          textDayHeaderFontSize: 12,
                        }}
                        enableSwipeMonths
                        firstDay={0}
                      />
                      <View style={styles.calendarQuickRow}>
                        <TouchableOpacity
                          style={styles.calendarQuickBtn}
                          onPress={() => {
                            setPrazo(defaultSupportTicketPrazo())
                            setCalendarOpen(false)
                          }}
                        >
                          <Text style={styles.calendarQuickText}>+7 dias</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.calendarQuickBtn}
                          onPress={() => {
                            setPrazo(minDate)
                            setCalendarOpen(false)
                          }}
                        >
                          <Text style={styles.calendarQuickText}>Hoje</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : null}
                </Section>

                <Section title="Seus dados" hint="Usamos para retorno do suporte">
                  <View style={styles.contactGrid}>
                    <Field
                      label="Nome"
                      icon="person-outline"
                      value={nomeSolicitante}
                      onChangeText={setNomeSolicitante}
                      placeholder="Seu nome"
                    />
                    <Field
                      label="E-mail"
                      icon="mail-outline"
                      value={emailSolicitante}
                      onChangeText={setEmailSolicitante}
                      placeholder="email@exemplo.com"
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                    <Field
                      label="Telefone"
                      icon="call-outline"
                      value={contatoSolicitante}
                      onChangeText={setContatoSolicitante}
                      placeholder="(21) 99999-9999"
                      keyboardType="phone-pad"
                    />
                  </View>
                </Section>

                <Section title="Anexos" hint="PDF, Office, TXT — máx. 50MB cada">
                  <Pressable
                    onPress={() => void handlePickAttachments()}
                    style={[styles.attachDropzone, mfSiteInput(isDarkMode)]}
                  >
                    <Ionicons name="cloud-upload-outline" size={22} color={tokens.neon} />
                    <Text style={styles.attachDropzoneTitle}>Adicionar arquivos</Text>
                    <Text style={styles.attachDropzoneHint}>Clique para selecionar do dispositivo</Text>
                  </Pressable>
                  {anexos.length > 0 ? (
                    <View style={styles.attachList}>
                      {anexos.map((file, index) => (
                        <View key={`${file.name}-${index}`} style={styles.attachItem}>
                          <Ionicons name="document-attach-outline" size={16} color={tokens.neon} />
                          <Text style={styles.attachName} numberOfLines={1}>{file.name}</Text>
                          <TouchableOpacity
                            onPress={() => handleRemoveAttachment(index)}
                            accessibilityLabel={`Remover anexo ${file.name}`}
                            hitSlop={8}
                          >
                            <Ionicons name="close-circle" size={18} color={theme.error} />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  ) : null}
                </Section>

                {submitError ? (
                  <View style={styles.errorBanner}>
                    <Ionicons name="alert-circle-outline" size={16} color={theme.error} />
                    <Text style={styles.errorText}>{submitError}</Text>
                  </View>
                ) : null}
              </ScrollView>

              <View style={styles.footer}>
                <TouchableOpacity onPress={onClose} style={styles.secondaryButton} disabled={submitting}>
                  <Text style={styles.secondaryButtonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => void handleSubmit()}
                  style={[styles.primaryButton, submitting && styles.primaryButtonDisabled]}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color="#081018" />
                  ) : (
                    <>
                      <Ionicons name="send-outline" size={16} color="#081018" />
                      <Text style={styles.primaryButtonText}>Enviar chamado</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  )
}

function Section({
  title,
  hint,
  children,
}: {
  title: string
  hint?: string
  children: React.ReactNode
}) {
  const { isDarkMode } = useThemeStore()
  const tokens = getSiteTokens(isDarkMode)

  return (
    <View style={sectionStyles.wrap}>
      <View style={sectionStyles.head}>
        <Text style={[sectionStyles.title, { color: tokens.textPrimary }]}>{title}</Text>
        {hint ? <Text style={[siteHintStyle, sectionStyles.hint, { color: tokens.textMuted }]}>{hint}</Text> : null}
      </View>
      <View style={sectionStyles.body}>{children}</View>
    </View>
  )
}

const sectionStyles = StyleSheet.create({
  wrap: { gap: mfSpacing.sm },
  head: { gap: 2 },
  title: { ...siteFieldLabelStyle, fontSize: 14, fontWeight: '700' },
  hint: { fontSize: 12, lineHeight: 16 },
  body: { gap: mfSpacing.md },
})

interface FieldProps {
  label: string
  value: string
  onChangeText: (value: string) => void
  placeholder?: string
  multiline?: boolean
  keyboardType?: 'default' | 'email-address' | 'phone-pad'
  autoCapitalize?: 'none' | 'sentences' | 'words'
  icon?: keyof typeof Ionicons.glyphMap
  required?: boolean
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  icon,
  required = false,
}: FieldProps) {
  const { isDarkMode } = useThemeStore()
  const theme = getTheme(isDarkMode)
  const tokens = getSiteTokens(isDarkMode)
  const styles = createFieldStyles(theme, tokens, isDarkMode)

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>
        {label}
        {required ? <Text style={styles.required}> *</Text> : null}
      </Text>
      <View style={[styles.inputRow, multiline && styles.inputRowMultiline]}>
        {icon ? (
          <Ionicons
            name={icon}
            size={17}
            color={tokens.textMuted}
            style={multiline ? styles.inputIconMultiline : undefined}
          />
        ) : null}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={tokens.textMuted}
          style={[styles.input, multiline && styles.inputMultiline]}
          multiline={multiline}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
        />
      </View>
    </View>
  )
}

const createFieldStyles = (
  theme: ReturnType<typeof getTheme>,
  tokens: ReturnType<typeof getSiteTokens>,
  isDarkMode: boolean,
) =>
  StyleSheet.create({
    wrap: { gap: 6 },
    label: {
      ...siteFieldLabelStyle,
      color: tokens.textSecondary,
    },
    required: {
      color: theme.error,
      fontWeight: '700',
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: mfSpacing.sm,
      ...mfSiteInput(isDarkMode),
      paddingHorizontal: mfSpacing.md,
      paddingVertical: Platform.OS === 'web' ? 10 : 12,
    },
    inputRowMultiline: {
      alignItems: 'flex-start',
      paddingVertical: mfSpacing.sm,
    },
    inputIconMultiline: {
      marginTop: 4,
    },
    input: {
      flex: 1,
      ...mfTypography.body,
      color: tokens.textPrimary,
      padding: 0,
      ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null),
    },
    inputMultiline: {
      minHeight: 88,
      textAlignVertical: 'top',
    },
  })

const createStyles = (
  theme: ReturnType<typeof getTheme>,
  tokens: ReturnType<typeof getSiteTokens>,
  isWide: boolean,
) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(2, 6, 23, 0.62)',
      justifyContent: 'center',
      padding: mfSpacing.lg,
    },
    sheet: {
      maxHeight: '92%',
      width: '100%',
      maxWidth: isWide ? 560 : undefined,
      alignSelf: 'center',
      overflow: 'hidden',
      padding: 0,
    },
    hero: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: mfSpacing.md,
      paddingHorizontal: mfSpacing.lg,
      paddingTop: mfSpacing.lg,
      paddingBottom: mfSpacing.md,
      borderBottomWidth: 1,
      borderBottomColor: tokens.divider,
      backgroundColor: tokens.neonDim,
    },
    heroIconWrap: {
      width: 44,
      height: 44,
      borderRadius: mfRadius.lg,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isWide ? 'rgba(255,255,255,0.7)' : tokens.panelBg,
      borderWidth: 1,
      borderColor: tokens.neonBorder,
    },
    heroCopy: { flex: 1, gap: 2 },
    title: {
      fontSize: 18,
      fontWeight: '700',
      color: tokens.textPrimary,
      letterSpacing: -0.3,
    },
    subtitle: {
      ...mfTypography.caption,
      color: tokens.textSecondary,
    },
    closeButton: {
      width: 36,
      height: 36,
      borderRadius: mfRadius.pill,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: tokens.inputBg,
      borderWidth: 1,
      borderColor: tokens.inputBorder,
    },
    form: {
      padding: mfSpacing.lg,
      gap: mfSpacing.lg,
      paddingBottom: mfSpacing.md,
    },
    fieldLabel: {
      ...siteFieldLabelStyle,
      color: tokens.textSecondary,
      marginBottom: -4,
    },
    prioridadeRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: mfSpacing.sm,
    },
    prioridadeChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 9,
      borderRadius: mfRadius.pill,
      borderWidth: 1,
      borderColor: tokens.inputBorder,
      backgroundColor: tokens.inputBg,
    },
    prioridadeChipText: {
      ...mfTypography.caption,
      color: tokens.textSecondary,
      fontWeight: '600',
    },
    dateTrigger: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: mfSpacing.md,
      paddingVertical: mfSpacing.sm,
    },
    dateTriggerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: mfSpacing.sm,
      flex: 1,
    },
    dateTriggerValue: {
      ...mfTypography.bodyStrong,
      color: tokens.textPrimary,
    },
    dateTriggerHint: {
      ...mfTypography.caption,
      color: tokens.textMuted,
      marginTop: 2,
    },
    calendarCard: {
      borderRadius: mfRadius.lg,
      overflow: 'hidden',
      paddingBottom: mfSpacing.sm,
    },
    calendarQuickRow: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: mfSpacing.sm,
      paddingHorizontal: mfSpacing.md,
      paddingTop: mfSpacing.xs,
    },
    calendarQuickBtn: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: mfRadius.pill,
      backgroundColor: tokens.neonDim,
      borderWidth: 1,
      borderColor: tokens.neonBorder,
    },
    calendarQuickText: {
      ...mfTypography.caption,
      color: tokens.neon,
      fontWeight: '700',
    },
    contactGrid: {
      gap: mfSpacing.md,
    },
    attachDropzone: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: mfSpacing.lg,
      paddingHorizontal: mfSpacing.md,
      borderStyle: 'dashed',
      gap: 4,
    },
    attachDropzoneTitle: {
      ...mfTypography.bodyStrong,
      color: tokens.textPrimary,
      marginTop: 4,
    },
    attachDropzoneHint: {
      ...mfTypography.caption,
      color: tokens.textMuted,
    },
    attachList: {
      gap: mfSpacing.xs,
    },
    attachItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: mfSpacing.sm,
      paddingVertical: 10,
      paddingHorizontal: mfSpacing.sm,
      borderRadius: mfRadius.md,
      backgroundColor: tokens.inputBg,
      borderWidth: 1,
      borderColor: tokens.inputBorder,
    },
    attachName: {
      flex: 1,
      color: tokens.textPrimary,
      ...mfTypography.caption,
    },
    errorBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: mfSpacing.sm,
      padding: mfSpacing.sm,
      borderRadius: mfRadius.md,
      backgroundColor: `${theme.error}12`,
      borderWidth: 1,
      borderColor: `${theme.error}33`,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: mfSpacing.sm,
      paddingHorizontal: mfSpacing.lg,
      paddingVertical: mfSpacing.md,
      borderTopWidth: 1,
      borderTopColor: tokens.divider,
      backgroundColor: tokens.panelBg,
    },
    primaryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: tokens.neon,
      borderRadius: mfRadius.pill,
      paddingHorizontal: mfSpacing.lg,
      paddingVertical: 12,
      minWidth: 150,
    },
    primaryButtonDisabled: {
      opacity: 0.7,
    },
    primaryButtonText: {
      color: '#081018',
      ...mfTypography.bodyStrong,
    },
    secondaryButton: {
      borderRadius: mfRadius.pill,
      paddingHorizontal: mfSpacing.lg,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: tokens.inputBorder,
      backgroundColor: tokens.inputBg,
    },
    secondaryButtonText: {
      color: tokens.textPrimary,
      fontWeight: '600',
    },
    centerState: {
      padding: mfSpacing.xl,
      alignItems: 'center',
      gap: mfSpacing.md,
    },
    successBadge: {
      width: 64,
      height: 64,
      borderRadius: 32,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: `${theme.success}15`,
    },
    helperText: {
      color: tokens.textSecondary,
      textAlign: 'center',
      ...mfTypography.body,
    },
    errorText: {
      color: theme.error,
      ...mfTypography.body,
      flex: 1,
    },
    successText: {
      color: tokens.textPrimary,
      fontSize: 18,
      fontWeight: '700',
      textAlign: 'center',
    },
  })
