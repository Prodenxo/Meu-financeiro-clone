import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  useWindowDimensions,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LegalWebLink } from '@/components/LegalWebLink';
import { LegalHomepageStrip } from '@/components/LegalHomepageStrip';

const MAX_WIDTH = 1100;
const BREAKPOINT = 768;

// ─── Mini dashboard mockup ────────────────────────────────────────────────────

function DashboardMockup() {
  return (
    <View style={mock.phone}>
      <View style={mock.statusBar}>
        <Text style={mock.statusTime}>9:41</Text>
        <View style={{ flexDirection: 'row', gap: 4 }}>
          <Ionicons name="wifi" size={11} color="#64748B" />
          <Ionicons name="battery-full" size={11} color="#64748B" />
        </View>
      </View>

      <View style={mock.header}>
        <Text style={mock.greeting}>Bom dia, Fernando 👋</Text>
        <Text style={mock.balance}>R$ 8.450,00</Text>
        <Text style={mock.balanceLabel}>saldo disponível</Text>
      </View>

      <View style={mock.statsRow}>
        {[
          { icon: 'arrow-down' as const, color: '#2563EB', bg: '#1E3A5F', label: 'Receitas', value: 'R$ 3.200' },
          { icon: 'arrow-up' as const, color: '#EF4444', bg: '#3B1F1F', label: 'Gastos', value: 'R$ 1.850' },
        ].map((s) => (
          <View key={s.label} style={[mock.statCard, { backgroundColor: s.bg }]}>
            <Ionicons name={s.icon} size={12} color={s.color} />
            <Text style={mock.statValue}>{s.value}</Text>
            <Text style={mock.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      <View style={mock.divider} />

      <Text style={mock.catTitle}>Por categoria</Text>
      {[
        { label: 'Alimentação', color: '#F59E0B', pct: '38%' },
        { label: 'Moradia', color: '#8B5CF6', pct: '28%' },
        { label: 'Transporte', color: '#10B981', pct: '18%' },
        { label: 'Outros', color: '#3B82F6', pct: '16%' },
      ].map((c) => (
        <View key={c.label} style={mock.catRow}>
          <View style={[mock.catDot, { backgroundColor: c.color }]} />
          <Text style={mock.catName}>{c.label}</Text>
          <View style={mock.catBarTrack}>
            <View style={[mock.catBarFill, { width: c.pct as any, backgroundColor: c.color, opacity: 0.6 }]} />
          </View>
          <Text style={mock.catPct}>{c.pct}</Text>
        </View>
      ))}
    </View>
  );
}

const mock = StyleSheet.create({
  phone: {
    width: 248,
    backgroundColor: '#0F1C2E',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#1E2F45',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.35,
    shadowRadius: 32,
    elevation: 16,
  },
  statusBar: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  statusTime: { color: '#64748B', fontSize: 10, fontWeight: '600' },
  header: { marginBottom: 14 },
  greeting: { color: '#64748B', fontSize: 11, marginBottom: 6 },
  balance: { color: '#FFFFFF', fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  balanceLabel: { color: '#334155', fontSize: 10, marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  statCard: { flex: 1, borderRadius: 10, padding: 10, gap: 2 },
  statValue: { color: '#FFFFFF', fontSize: 12, fontWeight: '700', marginTop: 4 },
  statLabel: { color: '#64748B', fontSize: 9 },
  divider: { height: 1, backgroundColor: '#1E293B', marginBottom: 12 },
  catTitle: { color: '#475569', fontSize: 9, fontWeight: '700', letterSpacing: 1, marginBottom: 10 },
  catRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 7 },
  catDot: { width: 6, height: 6, borderRadius: 3, flexShrink: 0 },
  catName: { color: '#94A3B8', fontSize: 10, width: 72 },
  catBarTrack: { flex: 1, height: 4, backgroundColor: '#1E293B', borderRadius: 2, overflow: 'hidden' },
  catBarFill: { height: '100%', borderRadius: 2 },
  catPct: { color: '#475569', fontSize: 9, fontWeight: '600', width: 24, textAlign: 'right' },
});

// ─── Feature card ─────────────────────────────────────────────────────────────

function FeatureCard({
  icon, iconBg, iconColor, title, desc,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconBg: string;
  iconColor: string;
  title: string;
  desc: string;
}) {
  return (
    <View style={feat.card}>
      <View style={[feat.iconBox, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={22} color={iconColor} />
      </View>
      <Text style={feat.title}>{title}</Text>
      <Text style={feat.desc}>{desc}</Text>
    </View>
  );
}

const feat = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 240,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 28,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  title: { fontSize: 17, fontWeight: '700', color: '#0F172A', marginBottom: 8 },
  desc: { fontSize: 14, color: '#64748B', lineHeight: 22 },
});

// ─── Step ─────────────────────────────────────────────────────────────────────

function Step({ n, title, desc }: { n: string; title: string; desc: string }) {
  return (
    <View style={step.wrap}>
      <View style={step.badge}>
        <Text style={step.n}>{n}</Text>
      </View>
      <Text style={step.title}>{title}</Text>
      <Text style={step.desc}>{desc}</Text>
    </View>
  );
}

const step = StyleSheet.create({
  wrap: { flex: 1, minWidth: 180, alignItems: 'center', paddingHorizontal: 12 },
  badge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    borderWidth: 2,
    borderColor: '#BFDBFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  n: { fontSize: 15, fontWeight: '800', color: '#2563EB' },
  title: { fontSize: 15, fontWeight: '700', color: '#0F172A', textAlign: 'center', marginBottom: 8 },
  desc: { fontSize: 13, color: '#64748B', textAlign: 'center', lineHeight: 20 },
});

// ─── Logo component ───────────────────────────────────────────────────────────

function AppLogo({ size = 30, textStyle }: { size?: number; textStyle?: object }) {
  return (
    <View style={s.logo}>
      <Image
        source={require('../assets/icon.png')}
        style={{ width: size, height: size, borderRadius: size * 0.267 }}
        resizeMode="cover"
      />
      <Text style={[s.logoText, textStyle]}>Meu Financeiro</Text>
    </View>
  );
}

// ─── Landing Page ─────────────────────────────────────────────────────────────

export default function LandingPage() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < BREAKPOINT;

  const cx = {
    maxWidth: MAX_WIDTH,
    width: '100%' as const,
    alignSelf: 'center' as const,
    paddingHorizontal: isMobile ? 20 : 48,
  };

  const goLogin = () => router.push('/(auth)/login');
  const goRequestAccess = () => router.push('/(auth)/solicitar-acesso');

  return (
    <ScrollView
      style={s.root}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
      stickyHeaderIndices={[0]}
    >
      {/* ── Navbar ───────────────────────────────────────────────────────── */}
      <View style={s.nav}>
        <View style={[s.navRow, cx]}>
          <AppLogo size={32} />
          <TouchableOpacity style={s.navEntrar} onPress={goLogin} activeOpacity={0.8}>
            <Text style={s.navEntrarText}>Entrar</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <View style={s.hero}>
        <View style={[
          s.heroRow,
          cx,
          isMobile && { flexDirection: 'column', alignItems: 'center' },
        ]}>
          {/* Left: copy */}
          <View style={s.heroLeft}>
            <Image
              source={require('../assets/icon.png')}
              style={s.heroLogo}
              resizeMode="contain"
            />

            <View style={s.pill}>
              <View style={s.pillDot} />
              <Text style={s.pillText}>Exclusivo para clientes CF Contabilidade</Text>
            </View>

            <Text style={[s.h1, isMobile && { fontSize: 36, lineHeight: 44 }]}>
              Suas finanças,{'\n'}sem complicação.
            </Text>

            <Text style={s.heroSub}>
              Ferramenta exclusiva para clientes da CF Contabilidade. Registre gastos, defina orçamentos e acompanhe seu dinheiro de qualquer lugar.
            </Text>

            <View style={s.heroBtnGroup}>
              <TouchableOpacity style={s.heroBtn} onPress={goLogin} activeOpacity={0.88}>
                <Text style={s.heroBtnText}>Já tenho acesso — Entrar</Text>
                <Ionicons name="arrow-forward" size={17} color="#FFFFFF" />
              </TouchableOpacity>

              <TouchableOpacity style={s.heroSecondaryBtn} onPress={goRequestAccess} activeOpacity={0.88}>
                <Text style={s.heroSecondaryBtnText}>Quero garantir meu acesso</Text>
                <Ionicons name="arrow-forward" size={17} color="#2563EB" />
              </TouchableOpacity>
            </View>

            <LegalHomepageStrip />
          </View>

          {/* Right: mockup */}
          {!isMobile && (
            <View style={s.heroRight}>
              <DashboardMockup />
            </View>
          )}
        </View>
      </View>

      {/* ── Social proof strip ───────────────────────────────────────────── */}
      <View style={s.strip}>
        <View style={[cx, s.stripRow]}>
          {[
            { n: '10k+', label: 'Usuários ativos' },
            { n: 'R$2M+', label: 'Gerenciados' },
            { n: '99.9%', label: 'Disponibilidade' },
            { n: '4.8 ★', label: 'Avaliação média' },
          ].map((item, i) => (
            <View key={i} style={s.stripItem}>
              <Text style={s.stripN}>{item.n}</Text>
              <Text style={s.stripLabel}>{item.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ── Features ─────────────────────────────────────────────────────── */}
      <View style={s.section}>
        <View style={cx}>
          <Text style={s.eyebrow}>FUNCIONALIDADES</Text>
          <Text style={[s.h2, isMobile && { fontSize: 26 }]}>
            Tudo que você precisa{'\n'}para controlar seu dinheiro
          </Text>
          <View style={[s.grid, isMobile && { flexDirection: 'column' }]}>
            <FeatureCard
              icon="card-outline"
              iconBg="#EFF6FF"
              iconColor="#2563EB"
              title="Controle total"
              desc="Registre entradas e saídas, visualize extratos e categorize cada transação facilmente."
            />
            <FeatureCard
              icon="wallet-outline"
              iconBg="#F0FDF4"
              iconColor="#059669"
              title="Orçamentos inteligentes"
              desc="Defina limites mensais por categoria e saiba exatamente onde seu dinheiro está indo."
            />
            <FeatureCard
              icon="calendar-outline"
              iconBg="#FFF7ED"
              iconColor="#EA580C"
              title="Agenda financeira"
              desc="Planeje pagamentos futuros e contas recorrentes. Nunca mais esqueça um vencimento."
            />
          </View>
        </View>
      </View>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <View style={[s.section, s.sectionGray]}>
        <View style={cx}>
          <Text style={s.eyebrow}>COMO FUNCIONA</Text>
          <Text style={[s.h2, isMobile && { fontSize: 26 }]}>Comece em 3 passos</Text>
          <View style={[s.stepsRow, isMobile && { flexDirection: 'column', gap: 32 }]}>
            <Step
              n="1"
              title="Fale com seu franqueado"
              desc="Entre em contato com a unidade CF Contabilidade mais próxima e solicite seu acesso ao sistema."
            />
            <View style={[s.stepLine, isMobile && { display: 'none' }]} />
            <Step
              n="2"
              title="Registre seus gastos"
              desc="Adicione transações e categorize com um toque. Importe ou insira manualmente."
            />
            <View style={[s.stepLine, isMobile && { display: 'none' }]} />
            <Step
              n="3"
              title="Veja os resultados"
              desc="Acompanhe gráficos, relatórios e saiba exatamente sua situação financeira."
            />
          </View>
        </View>
      </View>

      {/* ── CTA banner ───────────────────────────────────────────────────── */}
      <View style={s.cta}>
        <View style={[cx, { alignItems: 'center' }]}>
          <Text style={[s.ctaTitle, isMobile && { fontSize: 26 }]}>
            Quer ter acesso ao Meu Financeiro?
          </Text>
          <Text style={s.ctaSub}>
            O acesso é exclusivo para clientes das franquias da CF Contabilidade.{'\n'}
            Fale com o franqueado da sua região e solicite seu cadastro.
          </Text>
          <View style={[s.ctaBtns, isMobile && { flexDirection: 'column', width: '100%' }]}>
            <TouchableOpacity style={s.ctaBtn} onPress={goLogin} activeOpacity={0.9}>
              <Ionicons name="log-in-outline" size={16} color="#1E3A8A" />
              <Text style={s.ctaBtnText}>Já tenho acesso</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.ctaBtnOutline}
              onPress={() => Linking.openURL('https://cfcontabilidade.com.br/onde-estamos/')}
              activeOpacity={0.9}
            >
              <Ionicons name="location-outline" size={16} color="#FFFFFF" />
              <Text style={s.ctaBtnOutlineText}>Encontrar franqueado CF</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <View style={s.footer}>
        <View style={[cx, isMobile ? s.footerColMobile : s.footerRow]}>
          <AppLogo size={28} textStyle={s.footerLogoText} />
          <View style={s.footerLinks}>
            <LegalWebLink href="/privacidade" label="Política de Privacidade" textStyle={s.footerLink} />
            <LegalWebLink href="/termos" label="Termos de Uso" textStyle={s.footerLink} />
            <Text style={s.footerLink}>Suporte</Text>
          </View>
        </View>
        <View style={[cx, s.footerBottom]}>
          <Text style={s.copyright}>© 2026 CF Contabilidade. Todos os direitos reservados.</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { flexGrow: 1 },

  // Nav
  nav: {
    backgroundColor: 'rgba(12,22,40,0.97)',
    borderBottomWidth: 1,
    borderBottomColor: '#1E2F45',
    paddingVertical: 14,
  },
  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  logo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  navEntrar: {
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  navEntrarText: { fontSize: 14, fontWeight: '600', color: '#CBD5E1' },

  // Hero
  hero: { backgroundColor: '#0C1628', paddingVertical: 80 },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 60 },
  heroLeft: { flex: 1, maxWidth: 540 },
  heroLogo: { width: 216, height: 187, borderRadius: 32, marginBottom: 20, marginLeft: 20 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(37,99,235,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.25)',
    borderRadius: 100,
    paddingHorizontal: 14,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    marginBottom: 28,
  },
  pillDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#3B82F6' },
  pillText: { fontSize: 12, color: '#93C5FD', fontWeight: '500' },
  h1: {
    fontSize: 52,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 60,
    letterSpacing: -1.5,
    marginBottom: 20,
  },
  heroSub: { fontSize: 17, color: '#94A3B8', lineHeight: 28, marginBottom: 40, maxWidth: 460 },
  heroBtnGroup: {
    alignSelf: 'flex-start',
    gap: 12,
  },
  heroBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingHorizontal: 28,
    paddingVertical: 15,
    alignSelf: 'stretch',
  },
  heroBtnText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  heroSecondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 2,
    borderColor: '#2563EB',
    borderRadius: 12,
    paddingHorizontal: 28,
    paddingVertical: 15,
    alignSelf: 'stretch',
  },
  heroSecondaryBtnText: { fontSize: 15, fontWeight: '700', color: '#2563EB' },
  heroRight: { alignItems: 'center', justifyContent: 'center', flexShrink: 0 },

  // Strip
  strip: {
    backgroundColor: '#060E1A',
    borderTopWidth: 1,
    borderTopColor: '#0F1C2E',
    paddingVertical: 36,
  },
  stripRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 0,
    justifyContent: 'space-around',
  },
  stripItem: { alignItems: 'center', gap: 4, paddingHorizontal: 16 },
  stripN: { fontSize: 26, fontWeight: '800', color: '#FFFFFF' },
  stripLabel: { fontSize: 12, color: '#475569' },

  // Sections
  section: { paddingVertical: 80, backgroundColor: '#FFFFFF' },
  sectionGray: { backgroundColor: '#F8FAFC' },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
    letterSpacing: 2,
    marginBottom: 12,
  },
  h2: {
    fontSize: 34,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 42,
    letterSpacing: -0.5,
    marginBottom: 48,
  },
  grid: { flexDirection: 'row', gap: 20, flexWrap: 'wrap' },

  // Steps
  stepsRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 0 },
  stepLine: {
    width: 60,
    height: 2,
    backgroundColor: '#E2E8F0',
    marginTop: 19,
    flexShrink: 0,
  },

  // CTA
  cta: { backgroundColor: '#1E3A8A', paddingVertical: 80 },
  ctaTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  ctaSub: {
    fontSize: 16,
    color: '#BFDBFE',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 40,
  },
  ctaBtns: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  ctaBtnText: { fontSize: 15, fontWeight: '700', color: '#1E3A8A' },
  ctaBtnOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  ctaBtnOutlineText: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },

  // Footer
  footer: {
    backgroundColor: '#060E1A',
    paddingTop: 44,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderTopColor: '#0F1C2E',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 0,
  },
  footerColMobile: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 24,
  },
  footerLogoText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  footerLinks: { flexDirection: 'row', gap: 28 },
  footerLink: { fontSize: 13, color: '#475569' },
  footerBottom: {
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#0F1C2E',
  },
  copyright: { fontSize: 12, color: '#334155', textAlign: 'center' },
});
