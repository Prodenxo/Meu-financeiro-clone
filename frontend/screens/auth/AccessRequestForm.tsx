import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  ActivityIndicator,
  useWindowDimensions,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { AuthLayoutWeb } from '../../components/auth/AuthLayoutWeb';
import { AuthLayoutMobile } from '../../components/auth/AuthLayoutMobile';
import { AuthSectionHeader } from '../../components/auth/AuthSectionHeader';
import {
  AuthAlert,
  AuthButton,
  AuthInput,
  AuthLink,
} from '../../components/auth/AuthFormControls';
import { AuthPhoneInput } from '../../components/auth/AuthPhoneInput';
import {
  AUTH_FORM_TWO_COL_MIN_WIDTH,
  AUTH_FORM_WIDE_PANEL_MAX_WIDTH,
  getAuthPalette,
} from '../../components/auth/authTokens';
import { mfTechInsetSurface } from '../../lib/techDesign';
import { mfSpacing } from '../../lib/theme';
import { useThemeStore } from '../../store/themeStore';
import { validateSignupEmail, validateOptionalDisplayName } from '../../lib/authValidation';
import {
  validateStrongPassword,
  strongPasswordRequirementBullets,
} from '../../lib/passwordPolicy';
import { isValidCnpjDigits, isValidCpfDigits } from '../../lib/validateCnpj';

export type AccessRequestFormProps = {
  onGoToLogin: () => void;
  onDone: () => void;
};

type PessoaTipo = 'pj' | 'pf';

function maskCnpj(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 14);
  if (d.length > 12) {
    return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
  }
  if (d.length > 8) {
    return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  }
  if (d.length > 5) {
    return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  }
  if (d.length > 2) {
    return `${d.slice(0, 2)}.${d.slice(2)}`;
  }
  return d;
}

function maskCpf(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 11);
  if (d.length > 9) {
    return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
  }
  if (d.length > 6) {
    return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  }
  if (d.length > 3) {
    return `${d.slice(0, 3)}.${d.slice(3)}`;
  }
  return d;
}

export function AccessRequestForm({ onGoToLogin, onDone }: AccessRequestFormProps) {
  const isDarkMode = useThemeStore((s) => s.isDarkMode);
  const palette = getAuthPalette(isDarkMode);
  const { width } = useWindowDimensions();
  const twoCol = width >= AUTH_FORM_TWO_COL_MIN_WIDTH;
  const stackInlineFields = width < 520;

  // Dados do usuário
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Dados da empresa (PJ = CNPJ | PF = CPF, ambos viram admin após aprovação)
  const [pessoaTipo, setPessoaTipo] = useState<PessoaTipo>('pj');
  const [cnpj, setCnpj] = useState('');
  const [cpf, setCpf] = useState('');
  const [razaoSocial, setRazaoSocial] = useState('');
  const [nomeFantasia, setNomeFantasia] = useState('');
  const [cep, setCep] = useState('');
  const [logradouro, setLogradouro] = useState('');
  const [numero, setNumero] = useState('');
  const [complemento, setComplemento] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
  const [empresaTelefone, setEmpresaTelefone] = useState('');
  const [empresaEmail, setEmpresaEmail] = useState('');
  // UI
  const [cnpjLoading, setCnpjLoading] = useState(false);
  const [cnpjMessage, setCnpjMessage] = useState('');
  const [error, setError] = useState('');
  const [showErrors, setShowErrors] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const passwordPolicyInvalid =
    Boolean(password.trim()) && !validateStrongPassword(password).ok;

  const cellHalf = twoCol ? styles.cellHalf : styles.cellFull;
  const cellFull = styles.cellFull;
  const inlineRowStyle = stackInlineFields ? styles.rowStacked : styles.row;

  const lookupCnpj = async () => {
    const digits = cnpj.replace(/\D/g, '');
    if (digits.length !== 14) return;
    setCnpjLoading(true);
    setCnpjMessage('');
    try {
      const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${digits}`);
      if (!res.ok) {
        setCnpjMessage('Não encontramos esse CNPJ — você pode preencher os dados manualmente.');
        return;
      }
      const d = await res.json();
      if (d.razao_social) setRazaoSocial(String(d.razao_social));
      if (d.cep) setCep(String(d.cep).replace(/\D/g, ''));
      const rua = [d.descricao_tipo_de_logradouro, d.logradouro].filter(Boolean).join(' ').trim();
      if (rua) setLogradouro(rua);
      if (d.numero) setNumero(String(d.numero));
      if (d.complemento) setComplemento(String(d.complemento));
      if (d.bairro) setBairro(String(d.bairro));
      if (d.municipio) setCidade(String(d.municipio));
      if (d.uf) setEstado(String(d.uf));
      if (d.ddd_telefone_1) setEmpresaTelefone(String(d.ddd_telefone_1));
      if (d.email) setEmpresaEmail(String(d.email));
      setCnpjMessage('Dados da empresa preenchidos automaticamente. Confira e ajuste se necessário.');
    } catch {
      setCnpjMessage('Não foi possível consultar o CNPJ agora — preencha os dados manualmente.');
    } finally {
      setCnpjLoading(false);
    }
  };

  const handleSubmit = async () => {
    setError('');
    setShowErrors(true);

    if (
      !fullName.trim() ||
      !email.trim() ||
      !phone.trim() ||
      !password.trim() ||
      !confirmPassword.trim()
    ) {
      setError('Preencha todos os campos obrigatórios da seção "Seus dados".');
      return;
    }
    const eEmail = validateSignupEmail(email);
    if (eEmail) {
      setError(eEmail);
      return;
    }
    const eName = validateOptionalDisplayName(fullName);
    if (eName) {
      setError(eName);
      return;
    }
    const pwd = validateStrongPassword(password);
    if (!pwd.ok) {
      setError(pwd.message);
      return;
    }
    if (password !== confirmPassword) {
      setError('As senhas não conferem.');
      return;
    }
    const docDigits =
      pessoaTipo === 'pf'
        ? cpf.replace(/\D/g, '')
        : cnpj.replace(/\D/g, '');

    if (pessoaTipo === 'pj') {
      if (docDigits.length !== 14 || !isValidCnpjDigits(docDigits)) {
        setError('Informe um CNPJ válido.');
        return;
      }
      if (!razaoSocial.trim() && !nomeFantasia.trim()) {
        setError('Informe a razão social ou o nome fantasia.');
        return;
      }
    } else {
      if (docDigits.length !== 11 || !isValidCpfDigits(docDigits)) {
        setError('Informe um CPF válido.');
        return;
      }
      if (!razaoSocial.trim() && !nomeFantasia.trim() && !fullName.trim()) {
        setError('Informe como você quer ser chamado no sistema (ou use o nome completo).');
        return;
      }
    }

    const nomeEmpresaPf =
      nomeFantasia.trim()
      || razaoSocial.trim()
      || fullName.trim();

    setLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('submit-access-request', {
        body: {
          user: {
            fullName: fullName.trim(),
            email: email.trim(),
            phone: phone.trim() || null,
            password,
          },
          empresa: {
            tipoPessoa: pessoaTipo,
            cnpj: docDigits,
            razaoSocial:
              pessoaTipo === 'pf'
                ? (razaoSocial.trim() || nomeEmpresaPf)
                : razaoSocial.trim(),
            nomeFantasia:
              pessoaTipo === 'pf'
                ? (nomeFantasia.trim() || nomeEmpresaPf)
                : nomeFantasia.trim(),
            cep: cep.replace(/\D/g, ''),
            logradouro: logradouro.trim(),
            numero: numero.trim(),
            complemento: complemento.trim(),
            bairro: bairro.trim(),
            cidade: cidade.trim(),
            estado: estado.trim().toUpperCase(),
            telefone: empresaTelefone.trim(),
            email: empresaEmail.trim(),
          },
          observacao: null,
        },
      });

      if (fnError) {
        let msg = 'Não foi possível enviar a solicitação. Tente novamente.';
        try {
          const ctx = (fnError as { context?: { json?: () => Promise<{ error?: string }> } })
            ?.context;
          if (ctx?.json) {
            const b = await ctx.json();
            if (typeof b?.error === 'string') msg = b.error;
          }
        } catch {
          /* mantém mensagem padrão */
        }
        throw new Error(msg);
      }
      if (data && typeof data.error === 'string') {
        throw new Error(data.error);
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const successContent = (
    <View style={styles.successWrap}>
      <View style={[styles.successIcon, { backgroundColor: palette.alertSuccessBg }]}>
        <Ionicons name="checkmark-circle" size={48} color={palette.alertSuccessText} />
      </View>
      <Text style={[styles.successTitle, { color: palette.titleText }]}>Solicitação enviada!</Text>
      <Text style={[styles.successText, { color: palette.subtitleText }]}>
        Recebemos seus dados. A CF Contabilidade vai analisar a solicitação e liberar seu acesso.
        Você poderá entrar no app assim que a aprovação for concluída.
      </Text>
      <AuthButton label="Voltar ao início" onPress={onDone} palette={palette} />
    </View>
  );

  const formContent = (
    <View style={twoCol ? styles.gridRow : styles.gridStack}>
      <View style={cellFull}>
        <AuthSectionHeader title="Seus dados" palette={palette} />
      </View>

      <View style={cellHalf}>
        <AuthInput
          label="Nome completo"
          required
          palette={palette}
          placeholder="Seu nome completo"
          value={fullName}
          onChangeText={setFullName}
          autoCapitalize="words"
          leftIcon="person-outline"
        />
      </View>
      <View style={cellHalf}>
        <AuthInput
          label="E-mail"
          required
          palette={palette}
          placeholder="seu@email.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          leftIcon="mail-outline"
        />
      </View>
      <View style={cellFull}>
        <AuthPhoneInput
          label="Telefone"
          required
          palette={palette}
          value={phone}
          onChange={setPhone}
          hasError={showErrors && !phone.trim()}
          isDarkMode={isDarkMode}
        />
      </View>
      <View style={cellHalf}>
        <AuthInput
          label="Senha"
          required
          palette={palette}
          placeholder="••••••••"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          rightIconToggle={{
            iconWhenSecure: 'eye-off-outline',
            iconWhenVisible: 'eye-outline',
            isVisible: showPassword,
            onToggle: () => setShowPassword(!showPassword),
            accessibilityLabelShow: 'Mostrar senha',
            accessibilityLabelHide: 'Ocultar senha',
          }}
        />
        <View
          style={[
            styles.requirementsList,
            mfTechInsetSurface(isDarkMode),
            { marginTop: mfSpacing.sm },
          ]}
        >
          {strongPasswordRequirementBullets().map((line) => (
            <Text key={line} style={{ color: palette.subtitleText, fontSize: 12, lineHeight: 18 }}>
              • {line}
            </Text>
          ))}
        </View>
        {passwordPolicyInvalid && showErrors ? (
          <Text style={{ color: palette.alertErrorText, fontSize: 12, marginTop: 4 }}>
            {(validateStrongPassword(password) as { ok: false; message: string }).message}
          </Text>
        ) : null}
      </View>
      <View style={cellHalf}>
        <AuthInput
          label="Confirmar senha"
          required
          palette={palette}
          placeholder="••••••••"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={!showConfirm}
          autoCapitalize="none"
          rightIconToggle={{
            iconWhenSecure: 'eye-off-outline',
            iconWhenVisible: 'eye-outline',
            isVisible: showConfirm,
            onToggle: () => setShowConfirm(!showConfirm),
            accessibilityLabelShow: 'Mostrar senha',
            accessibilityLabelHide: 'Ocultar senha',
          }}
        />
      </View>

      <View style={cellFull}>
        <AuthSectionHeader
          title={pessoaTipo === 'pf' ? 'Seus dados' : 'Dados da empresa'}
          palette={palette}
        />
      </View>

      <View style={cellFull}>
        <Text style={[styles.tipoLabel, { color: palette.subtitleText }]}>
          Tipo de cadastro
        </Text>
        <View style={styles.tipoRow} accessibilityRole="radiogroup">
          {([
            { key: 'pj' as const, label: 'Pessoa jurídica (CNPJ)' },
            { key: 'pf' as const, label: 'Pessoa física (CPF)' },
          ]).map((opt) => {
            const selected = pessoaTipo === opt.key;
            return (
              <Pressable
                key={opt.key}
                onPress={() => {
                  setPessoaTipo(opt.key);
                  setCnpjMessage('');
                  setError('');
                }}
                style={[
                  styles.tipoChip,
                  {
                    borderColor: selected ? palette.linkText : palette.inputBorder,
                    backgroundColor: selected ? palette.linkText + '18' : palette.inputBg,
                  },
                ]}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={opt.label}
              >
                <Text
                  style={{
                    color: selected ? palette.linkText : palette.titleText,
                    fontWeight: selected ? '700' : '500',
                    fontSize: 13,
                  }}
                >
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        {pessoaTipo === 'pf' ? (
          <Text style={{ color: palette.subtitleText, fontSize: 12, marginTop: 8, lineHeight: 18 }}>
            Após a aprovação você fica como administrador. MEI e notas fiscais só liberam
            depois de cadastrar um CNPJ.
          </Text>
        ) : null}
      </View>

      <View style={cellFull}>
        <AuthInput
          label={pessoaTipo === 'pf' ? 'Nome no sistema' : 'Nome fantasia'}
          palette={palette}
          placeholder={
            pessoaTipo === 'pf'
              ? 'Como você quer aparecer no app'
              : 'Nome comercial da empresa'
          }
          value={nomeFantasia}
          onChangeText={setNomeFantasia}
        />
      </View>
      <View style={cellHalf}>
        {pessoaTipo === 'pj' ? (
          <>
            <AuthInput
              label="CNPJ"
              required
              palette={palette}
              placeholder="00.000.000/0000-00"
              value={cnpj}
              onChangeText={(v) => setCnpj(maskCnpj(v))}
              onBlur={lookupCnpj}
              keyboardType="numeric"
              leftIcon="business-outline"
            />
            {cnpjLoading ? (
              <View style={styles.cnpjHintRow}>
                <ActivityIndicator size="small" color={palette.linkText} />
                <Text style={{ color: palette.subtitleText, fontSize: 12, marginLeft: 8 }}>
                  Buscando dados do CNPJ...
                </Text>
              </View>
            ) : cnpjMessage ? (
              <Text style={{ color: palette.subtitleText, fontSize: 12, marginTop: 6 }}>
                {cnpjMessage}
              </Text>
            ) : null}
          </>
        ) : (
          <AuthInput
            label="CPF"
            required
            palette={palette}
            placeholder="000.000.000-00"
            value={cpf}
            onChangeText={(v) => setCpf(maskCpf(v))}
            keyboardType="numeric"
            leftIcon="card-outline"
          />
        )}
      </View>
      <View style={cellHalf}>
        <AuthInput
          label={pessoaTipo === 'pf' ? 'Nome completo' : 'Razão social'}
          required={pessoaTipo === 'pj'}
          palette={palette}
          placeholder={
            pessoaTipo === 'pf'
              ? 'Opcional — usa o nome do cadastro se ficar em branco'
              : 'Razão social da empresa'
          }
          value={razaoSocial}
          onChangeText={setRazaoSocial}
        />
      </View>
      <View style={cellHalf}>
        <AuthInput
          label="CEP"
          palette={palette}
          placeholder="Somente números"
          value={cep}
          onChangeText={(v) => setCep(v.replace(/\D/g, '').slice(0, 8))}
          keyboardType="numeric"
        />
      </View>
      <View style={cellHalf}>
        <AuthInput
          label="Logradouro"
          palette={palette}
          placeholder="Rua, avenida..."
          value={logradouro}
          onChangeText={setLogradouro}
        />
      </View>
      <View style={cellFull}>
        <View style={inlineRowStyle}>
          <View style={stackInlineFields ? styles.rowItemStacked : styles.rowItem}>
            <AuthInput
              label="Número"
              palette={palette}
              placeholder="Nº"
              value={numero}
              onChangeText={setNumero}
            />
          </View>
          <View style={stackInlineFields ? styles.rowItemStacked : styles.rowItem}>
            <AuthInput
              label="Complemento"
              palette={palette}
              placeholder="Sala, andar..."
              value={complemento}
              onChangeText={setComplemento}
            />
          </View>
        </View>
      </View>
      <View style={cellFull}>
        <View style={inlineRowStyle}>
          <View style={stackInlineFields ? styles.rowItemStacked : styles.rowItemWide}>
            <AuthInput
              label="Bairro"
              palette={palette}
              placeholder="Bairro"
              value={bairro}
              onChangeText={setBairro}
            />
          </View>
          <View style={stackInlineFields ? styles.rowItemStacked : styles.rowItemWide}>
            <AuthInput
              label="Cidade"
              palette={palette}
              placeholder="Cidade"
              value={cidade}
              onChangeText={setCidade}
            />
          </View>
          <View style={stackInlineFields ? styles.rowItemStacked : styles.rowItemNarrow}>
            <AuthInput
              label="UF"
              palette={palette}
              placeholder="UF"
              value={estado}
              onChangeText={(v) =>
                setEstado(v.replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase())
              }
              autoCapitalize="characters"
              maxLength={2}
            />
          </View>
        </View>
      </View>
      <View style={cellHalf}>
        <AuthInput
          label={pessoaTipo === 'pf' ? 'Telefone' : 'Telefone da empresa'}
          palette={palette}
          placeholder={pessoaTipo === 'pf' ? 'Seu telefone' : 'Telefone comercial'}
          value={empresaTelefone}
          onChangeText={setEmpresaTelefone}
          keyboardType="phone-pad"
        />
      </View>
      <View style={cellHalf}>
        <AuthInput
          label={pessoaTipo === 'pf' ? 'E-mail de contato' : 'E-mail da empresa'}
          palette={palette}
          placeholder={pessoaTipo === 'pf' ? 'seu@email.com' : 'contato@empresa.com'}
          value={empresaEmail}
          onChangeText={setEmpresaEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      {error ? (
        <View style={cellFull}>
          <AuthAlert kind="error" message={error} palette={palette} />
        </View>
      ) : null}

      <View style={cellFull}>
        <AuthButton
          label="Enviar solicitação"
          loadingLabel="Enviando..."
          loading={loading}
          onPress={handleSubmit}
          palette={palette}
        />
        <View style={styles.bottomRow}>
          <Text style={{ color: palette.subtitleText, fontSize: 14 }}>Já tem acesso? </Text>
          <AuthLink label="Fazer login" palette={palette} onPress={onGoToLogin} />
        </View>
      </View>
    </View>
  );

  const title = submitted ? 'Solicitação enviada' : 'Quero garantir meu acesso';
  const subtitle = submitted
    ? undefined
    : pessoaTipo === 'pf'
      ? 'Preencha seus dados. A CF Contabilidade analisa e libera o acesso.'
      : 'Preencha seus dados e os da sua empresa. A CF Contabilidade analisa e libera o acesso.';
  const content = submitted ? successContent : formContent;

  if (Platform.OS === 'web') {
    return (
      <AuthLayoutWeb
        title={title}
        subtitle={subtitle}
        showIllustration={false}
        formMaxWidth={AUTH_FORM_WIDE_PANEL_MAX_WIDTH}
      >
        {content}
      </AuthLayoutWeb>
    );
  }

  return (
    <AuthLayoutMobile title={title} subtitle={subtitle}>
      {content}
    </AuthLayoutMobile>
  );
}

const styles = StyleSheet.create({
  gridStack: {
    gap: mfSpacing.md,
  },
  gridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    rowGap: mfSpacing.md,
    columnGap: mfSpacing.md,
  },
  cellHalf: {
    width: '48%',
    minWidth: 240,
    flexGrow: 1,
  },
  cellFull: {
    width: '100%',
  },
  tipoLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  tipoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tipoChip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: 'row',
    gap: mfSpacing.md,
  },
  rowStacked: {
    flexDirection: 'column',
    gap: mfSpacing.md,
  },
  rowItem: {
    flex: 1,
    minWidth: 0,
  },
  rowItemStacked: {
    width: '100%',
  },
  rowItemWide: {
    flex: 2,
    minWidth: 0,
  },
  rowItemNarrow: {
    flex: 1,
    minWidth: 72,
    maxWidth: 120,
  },
  requirementsList: {
    gap: mfSpacing.xs,
    paddingHorizontal: mfSpacing.md,
    paddingVertical: mfSpacing.sm,
  },
  cnpjHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: mfSpacing.md,
    gap: mfSpacing.xs,
  },
  successWrap: {
    alignItems: 'center',
    gap: mfSpacing.md,
    paddingVertical: mfSpacing.sm,
    width: '100%',
    alignSelf: 'center',
  },
  successIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  successText: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
});
