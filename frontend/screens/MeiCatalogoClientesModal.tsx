import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Pressable } from 'react-native'
import type { NfeDestinatarioEnderecoForm } from '../lib/meiNfseForms'
import type { DestinatarioIndIeDest } from '../lib/meiNfeDestinatarioIe'
import { buildClienteCatalogLabel } from '../lib/meiFormatters'
import {
  applyCatalogClienteToNfeForm,
  buildCatalogClienteMetadataJson,
  catalogClienteHasNfeEndereco,
  enderecoFromCnpjLookup,
  mergeEnderecoFromCepLookup,
  parseCatalogClienteFiscalMeta,
  validateCatalogClienteNfeFields,
  validateCatalogClienteNfseTomadorFields,
} from '../lib/meiCatalogClienteFiscal'
import { getDefaultNfeDestinatarioEndereco } from '../lib/meiNfseForms'
import { DEFAULT_DESTINATARIO_IND_IE_DEST } from '../lib/meiNfeDestinatarioIe'
import type { DocumentType, NfseCatalogCliente } from '../services/meiNotasService'
import {
  atualizarCatalogoNfseCliente,
  criarCatalogoNfseCliente,
  excluirCatalogoNfseCliente,
  listarCatalogoNfseClientes,
  lookupCnpj,
  lookupNfseEnderecoPorCep,
} from '../services/meiNotasService'
import {
  MeiFlowModalShell,
  MeiFormField,
  MeiFormSheet,
  MeiCatalogListCard,
  MeiSearchBar,
  MeiConfirmDialog,
  MeiFormSheetActions,
  MeiFormSectionLabel,
  MeiTypeChips,
  useMeiFlowStyles,
  type MeiDocType,
} from '../components/mei/meiFlowUi'
import { useMfTheme } from '../components/ui/useMfTheme'
import { alertDialog } from '../lib/confirmDialog'
import { useAppToastStore } from '../store/appToastStore'

const PAGE_SIZE = 50

function normalizeDoc (value: string): string {
  return value.replace(/\D/g, '')
}

function formatDocumentDisplay (value: string): string {
  const digits = normalizeDoc(value).slice(0, 14)
  let formatted = ''
  for (let i = 0; i < digits.length; i += 1) {
    formatted += digits[i]
    if (digits.length <= 11) {
      if (i === 2 || i === 5) formatted += '.'
      if (i === 8) formatted += '-'
    } else {
      if (i === 1 || i === 4) formatted += '.'
      if (i === 7) formatted += '/'
      if (i === 11) formatted += '-'
    }
  }
  return formatted
}

function validateClienteForm (documento: string, nome: string): string | null {
  const doc = normalizeDoc(documento)
  if (doc.length !== 11 && doc.length !== 14) {
    return 'Informe CPF (11 dígitos) ou CNPJ (14 dígitos).'
  }
  if (!nome.trim()) {
    return 'Nome ou razão social é obrigatório.'
  }
  return null
}

export type MeiCatalogoClientesModalProps = {
  visible: boolean
  onClose: () => void
  onCatalogChanged?: () => void
}

type FormState = {
  documento: string
  nome: string
  email: string
  documentType: DocumentType
  indIEDest: DestinatarioIndIeDest
  endereco: NfeDestinatarioEnderecoForm
}

const emptyForm = (): FormState => ({
  documento: '',
  nome: '',
  email: '',
  documentType: 'NFSE',
  indIEDest: DEFAULT_DESTINATARIO_IND_IE_DEST,
  endereco: getDefaultNfeDestinatarioEndereco(),
})

export default function MeiCatalogoClientesModal ({
  visible,
  onClose,
  onCatalogChanged,
}: MeiCatalogoClientesModalProps) {
  const { theme } = useMfTheme()
  const flow = useMeiFlowStyles()
  const showToast = useAppToastStore((s) => s.show)

  const [items, setItems] = useState<NfseCatalogCliente[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [searchQ, setSearchQ] = useState('')
  const nextOffsetRef = useRef(0)
  const searchQRef = useRef(searchQ)
  const hasMoreRef = useRef(hasMore)
  const loadingMoreRef = useRef(loadingMore)
  const refreshingRef = useRef(refreshing)
  const fetchGenRef = useRef(0)

  searchQRef.current = searchQ
  hasMoreRef.current = hasMore
  loadingMoreRef.current = loadingMore
  refreshingRef.current = refreshing

  const [formVisible, setFormVisible] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [cnpjLookupLoading, setCnpjLookupLoading] = useState(false)
  const [cepLookupLoading, setCepLookupLoading] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<NfseCatalogCliente | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const resetList = useCallback(() => {
    setItems([])
    nextOffsetRef.current = 0
    setHasMore(true)
  }, [])

  const fetchPage = useCallback(
    async (opts: { append: boolean; q?: string; reset?: boolean }) => {
      const q = opts.q !== undefined ? opts.q : searchQRef.current
      const startOffset = opts.reset ? 0 : opts.append ? nextOffsetRef.current : 0
      if (opts.append && (!hasMoreRef.current || loadingMoreRef.current)) return

      const gen = ++fetchGenRef.current
      if (opts.append) setLoadingMore(true)
      else if (!opts.append && !refreshingRef.current) setLoading(true)

      try {
        const page = await listarCatalogoNfseClientes({
          q: q.trim() || undefined,
          limit: PAGE_SIZE,
          offset: startOffset > 0 ? startOffset : undefined,
        })
        if (gen !== fetchGenRef.current) return

        const list = Array.isArray(page) ? page : []
        if (opts.append) {
          setItems((prev) => [...prev, ...list])
        } else {
          setItems(list)
        }
        setHasMore(list.length >= PAGE_SIZE)
        nextOffsetRef.current = startOffset + list.length
      } catch (e: unknown) {
        if (gen !== fetchGenRef.current) return
        const msg = e instanceof Error ? e.message : 'Não foi possível carregar o catálogo.'
        if (!opts.append) {
          alertDialog('Erro', msg)
          setItems([])
        }
      } finally {
        if (gen !== fetchGenRef.current) return
        setLoading(false)
        setRefreshing(false)
        setLoadingMore(false)
      }
    },
    [],
  )

  useEffect(() => {
    if (!visible) return
    resetList()
    void fetchPage({ append: false, reset: true })
  }, [visible, resetList, fetchPage])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    resetList()
    void fetchPage({ append: false, reset: true, q: searchQ })
  }, [fetchPage, resetList, searchQ])

  const loadMore = useCallback(() => {
    if (!hasMore || loadingMore || loading) return
    void fetchPage({ append: true })
  }, [fetchPage, hasMore, loading, loadingMore])

  const notifyChanged = useCallback(() => {
    onCatalogChanged?.()
  }, [onCatalogChanged])

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm())
    setFormVisible(true)
  }

  const openEdit = (item: NfseCatalogCliente) => {
    const fiscal = parseCatalogClienteFiscalMeta(item.metadata_json ?? undefined)
    setEditingId(item.id)
    setForm({
      documento: item.documento ? formatDocumentDisplay(item.documento) : '',
      nome: item.nome ?? '',
      email: item.email ?? '',
      documentType: (item.document_type as DocumentType) || 'NFSE',
      indIEDest: fiscal.indIEDest ?? DEFAULT_DESTINATARIO_IND_IE_DEST,
      endereco: fiscal.endereco ?? getDefaultNfeDestinatarioEndereco(),
    })
    setFormVisible(true)
  }

  const lookupDocumentoEndereco = async () => {
    const digits = normalizeDoc(form.documento)
    if (digits.length !== 14) return
    setCnpjLookupLoading(true)
    try {
      const data = await lookupCnpj(digits)
      setForm((f) => ({
        ...f,
        nome: f.nome.trim() || data.razaoSocial || f.nome,
        email: f.email.trim() || data.email || f.email,
        endereco: enderecoFromCnpjLookup(data),
      }))
      showToast('Endereço preenchido pela Receita Federal.', 'success')
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Não foi possível consultar o CNPJ.', 'error')
    } finally {
      setCnpjLookupLoading(false)
    }
  }

  const lookupCepEndereco = async () => {
    const cep = normalizeDoc(form.endereco.cep)
    if (cep.length !== 8) return
    setCepLookupLoading(true)
    try {
      const data = await lookupNfseEnderecoPorCep(cep)
      setForm((f) => ({
        ...f,
        endereco: mergeEnderecoFromCepLookup(f.endereco, data),
      }))
      showToast('Endereço e código IBGE preenchidos pelo CEP.', 'success')
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Não foi possível consultar o CEP.', 'error')
    } finally {
      setCepLookupLoading(false)
    }
  }

  const handleSaveForm = async () => {
    const err = validateClienteForm(form.documento, form.nome)
    if (err) {
      alertDialog('Validação', err)
      return
    }
    const docDigits = normalizeDoc(form.documento)
    const nfeErr = validateCatalogClienteNfeFields(form.documentType, form.endereco)
    if (nfeErr) {
      alertDialog('Validação NF-e', nfeErr)
      return
    }
    const nfseErr = validateCatalogClienteNfseTomadorFields(form.documento, form.endereco)
    if (nfseErr) {
      alertDialog('Validação NFS-e', nfseErr)
      return
    }
    setSaving(true)
    try {
      const metadata_json = (() => {
        if (form.documentType === 'NFE') {
          return buildCatalogClienteMetadataJson({
            indIEDest: form.indIEDest,
            endereco: form.endereco,
          })
        }
        if (form.documentType === 'NFSE') {
          return buildCatalogClienteMetadataJson({ endereco: form.endereco })
        }
        return undefined
      })()
      if (editingId) {
        await atualizarCatalogoNfseCliente(editingId, {
          nome: form.nome.trim(),
          email: form.email.trim() || null,
          ...(metadata_json ? { metadata_json } : {}),
        })
        showToast('Cliente atualizado.', 'success')
      } else {
        await criarCatalogoNfseCliente({
          documento: normalizeDoc(form.documento),
          nome: form.nome.trim(),
          ...(form.email.trim() ? { email: form.email.trim() } : {}),
          documentType: form.documentType,
          ...(metadata_json ? { metadata_json } : {}),
        })
        showToast('Cliente criado.', 'success')
      }
      setFormVisible(false)
      resetList()
      await fetchPage({ append: false, reset: true, q: searchQ })
      notifyChanged()
    } catch (e: unknown) {
      alertDialog('Erro', e instanceof Error ? e.message : 'Falha ao salvar cliente.')
    } finally {
      setSaving(false)
    }
  }

  const requestDelete = (item: NfseCatalogCliente) => {
    setDeleteTarget(item)
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      await excluirCatalogoNfseCliente(deleteTarget.id)
      showToast('Cliente removido.', 'success')
      setDeleteTarget(null)
      resetList()
      await fetchPage({ append: false, reset: true, q: searchQ })
      notifyChanged()
    } catch (e: unknown) {
      alertDialog('Erro', e instanceof Error ? e.message : 'Falha ao excluir.')
    } finally {
      setDeleteLoading(false)
    }
  }

  const runSearch = () => {
    resetList()
    void fetchPage({ append: false, reset: true, q: searchQ })
  }

  const headerRight = useMemo(
    () => (
      <Pressable
        onPress={openCreate}
        style={flow.headerAdd}
        accessibilityRole="button"
        accessibilityLabel="Novo cliente"
      >
        <Ionicons name="add" size={22} color={theme.primary} />
      </Pressable>
    ),
    [flow.headerAdd, theme.primary, openCreate],
  )

  const docDigitsForm = normalizeDoc(form.documento)
  const showTomadorEndereco = form.documentType === 'NFE' || form.documentType === 'NFSE'
  const enderecoObrigatorio =
    form.documentType === 'NFE'
    || (form.documentType === 'NFSE' && docDigitsForm.length === 14)
  const enderecoSectionTitle = (() => {
    if (form.documentType === 'NFE') return 'Endereço (obrigatório na NF-e)'
    if (docDigitsForm.length === 14) return 'Endereço fiscal (obrigatório na NFS-e para CNPJ)'
    return 'Endereço fiscal (opcional para CPF)'
  })()

  return (
    <>
      <MeiFlowModalShell
        visible={visible}
        onClose={onClose}
        title="Catálogo de clientes"
        eyebrow=""
        closeIcon="close"
        headerRight={headerRight}
        flatListBody
      >
        <MeiSearchBar
          value={searchQ}
          onChangeText={setSearchQ}
          onSearch={runSearch}
          placeholder="Buscar por nome ou documento"
        />

        {loading && items.length === 0 ? (
          <View style={{ padding: 24, alignItems: 'center' }}>
            <ActivityIndicator size="small" color={theme.primary} />
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(it) => it.id}
            style={flow.listPad}
            keyboardShouldPersistTaps="handled"
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
            }
            onEndReached={loadMore}
            onEndReachedThreshold={0.35}
            ListFooterComponent={
              loadingMore ? (
                <View style={{ paddingVertical: 16 }}>
                  <ActivityIndicator size="small" color={theme.primary} />
                </View>
              ) : null
            }
            ListEmptyComponent={
              <Text style={flow.empty}>Nenhum cliente. Toque em + para adicionar.</Text>
            }
            renderItem={({ item }) => (
              <MeiCatalogListCard
                title={buildClienteCatalogLabel(item)}
                meta={item.document_type ?? undefined}
                onEdit={() => openEdit(item)}
                onDelete={() => requestDelete(item)}
              />
            )}
          />
        )}

        <Text style={flow.hint}>
          Lista até {PAGE_SIZE} itens por página; deslize para carregar mais.
        </Text>
      </MeiFlowModalShell>

      <MeiFormSheet
        visible={formVisible}
        title={editingId ? 'Editar cliente' : 'Novo cliente'}
        onClose={() => setFormVisible(false)}
        footer={
          <MeiFormSheetActions
            onCancel={() => setFormVisible(false)}
            onConfirm={handleSaveForm}
            loading={saving}
          />
        }
      >
        <MeiFormField
          label="CPF / CNPJ"
          required
          placeholder="Somente números ou formatado"
          value={form.documento}
          onChangeText={(t) => setForm((f) => ({ ...f, documento: formatDocumentDisplay(t) }))}
          onBlur={() => void lookupDocumentoEndereco()}
          keyboardType="numeric"
        />
        {cnpjLookupLoading ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <ActivityIndicator size="small" color={theme.primary} />
            <Text style={{ fontSize: 12, color: theme.textSecondary }}>Consultando CNPJ na Receita…</Text>
          </View>
        ) : null}
        <MeiFormField
          label="Nome ou razão social"
          required
          placeholder="Nome completo"
          value={form.nome}
          onChangeText={(t) => setForm((f) => ({ ...f, nome: t }))}
        />
        <MeiFormField
          label="E-mail"
          placeholder="opcional"
          value={form.email}
          onChangeText={(t) => setForm((f) => ({ ...f, email: t }))}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <MeiFormSectionLabel>Tipo de documento fiscal</MeiFormSectionLabel>
        <MeiTypeChips
          value={form.documentType as MeiDocType}
          onChange={(dt) => setForm((f) => ({ ...f, documentType: dt }))}
        />
        {showTomadorEndereco ? (
          <>
            <MeiFormSectionLabel>{enderecoSectionTitle}</MeiFormSectionLabel>
            <Text style={[flow.hint, { marginBottom: 8 }]}>
              {form.documentType === 'NFE'
                ? 'Ao informar CNPJ, buscamos logradouro e IBGE automaticamente. Confira o número se vier vazio.'
                : enderecoObrigatorio
                  ? 'Informe o CEP para preencher logradouro, cidade, UF e código IBGE.'
                  : 'Opcional para pessoa física. Se informar o CEP, preenchemos o restante automaticamente.'}
            </Text>
            {cepLookupLoading ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <ActivityIndicator size="small" color={theme.primary} />
                <Text style={{ fontSize: 12, color: theme.textSecondary }}>Consultando CEP…</Text>
              </View>
            ) : null}
            <MeiFormField
              label="CEP"
              required={enderecoObrigatorio}
              value={form.endereco.cep}
              onChangeText={(t) =>
                setForm((f) => ({
                  ...f,
                  endereco: { ...f.endereco, cep: t.replace(/\D/g, '').slice(0, 8) },
                }))
              }
              onBlur={() => void lookupCepEndereco()}
              keyboardType="numeric"
              maxLength={8}
            />
            <MeiFormField
              label="Logradouro"
              required={enderecoObrigatorio}
              value={form.endereco.logradouro}
              onChangeText={(t) =>
                setForm((f) => ({ ...f, endereco: { ...f.endereco, logradouro: t } }))
              }
            />
            <MeiFormField
              label="Número"
              required={enderecoObrigatorio}
              value={form.endereco.numero}
              onChangeText={(t) =>
                setForm((f) => ({ ...f, endereco: { ...f.endereco, numero: t } }))
              }
            />
            <MeiFormField
              label="Bairro"
              required={enderecoObrigatorio}
              value={form.endereco.bairro}
              onChangeText={(t) =>
                setForm((f) => ({ ...f, endereco: { ...f.endereco, bairro: t } }))
              }
            />
            <MeiFormField
              label="Código IBGE"
              required={enderecoObrigatorio}
              value={form.endereco.codigoCidade}
              editable={false}
              keyboardType="numeric"
              maxLength={7}
            />
            <Text style={[flow.hint, { marginTop: -4, marginBottom: 8 }]}>
              Preenchido automaticamente ao informar o CEP.
            </Text>
            <MeiFormField
              label="Cidade"
              required={enderecoObrigatorio}
              value={form.endereco.descricaoCidade}
              onChangeText={(t) =>
                setForm((f) => ({ ...f, endereco: { ...f.endereco, descricaoCidade: t } }))
              }
            />
            <MeiFormField
              label="UF"
              required={enderecoObrigatorio}
              value={form.endereco.estado}
              onChangeText={(t) =>
                setForm((f) => ({
                  ...f,
                  endereco: {
                    ...f.endereco,
                    estado: t.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 2),
                  },
                }))
              }
              maxLength={2}
              autoCapitalize="characters"
            />
          </>
        ) : null}
      </MeiFormSheet>

      <MeiConfirmDialog
        visible={deleteTarget != null}
        title="Excluir cliente"
        message="Remover este cliente do catálogo?"
        detail={deleteTarget ? buildClienteCatalogLabel(deleteTarget) : undefined}
        confirmLabel="Excluir"
        loading={deleteLoading}
        onConfirm={() => void handleConfirmDelete()}
        onCancel={() => {
          if (!deleteLoading) setDeleteTarget(null)
        }}
      />
    </>
  )
}
