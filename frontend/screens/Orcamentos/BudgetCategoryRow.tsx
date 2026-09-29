import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Platform,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MfTechKpiCard } from '../../components/ui';
import { useMfTheme } from '../../components/ui/useMfTheme';
import { getCategorySliceColorForId } from '../../lib/categoryColors';
import { getCategoryIconName } from '../../lib/categoryIcons';
import { formatCurrencyBR } from '../../lib/numberFormat';
import { mfRadius, mfSpacing } from '../../lib/theme';
import type { CategoryBudgetSummary } from '../../lib/categoryService';

type Categoria = {
  id: number;
  nome: string;
  tipo: string;
  user_id: string | null;
};

type Props = {
  cat: Categoria;
  budgetValue: number | null | undefined;
  summary?: CategoryBudgetSummary;
  onPress: () => void;
  onDelete: () => void;
  /** @deprecated use gridColumns */
  equalFlex?: boolean;
  /** Colunas do grid (1–3). Define largura fixa por card — evita 31 cards numa linha. */
  gridColumns?: 1 | 2 | 3;
};

const monoFont = Platform.select({
  web: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
  ios: 'Menlo',
  android: 'monospace',
  default: undefined,
}) as ViewStyle['fontFamily'];

export function BudgetCategoryRow({
  cat,
  budgetValue,
  summary,
  onPress,
  onDelete,
  equalFlex = false,
  gridColumns,
}: Props) {
  const { theme, isDarkMode } = useMfTheme();
  const accent = getCategorySliceColorForId(cat.id, isDarkMode);
  const orcado = typeof budgetValue === 'number' ? budgetValue : 0;
  const realizado =
    cat.tipo === 'entrada'
      ? Number(summary?.valor_recebido ?? 0)
      : Number(summary?.valor_gasto ?? 0);
  const pct = orcado > 0 ? Math.min(100, (realizado / orcado) * 100) : 0;
  const overBudget = orcado > 0 && realizado > orcado;
  const iconName = getCategoryIconName(cat.nome);
  const cols = gridColumns ?? (equalFlex ? 2 : 1);
  const styles = useMemo(
    () => createStyles(theme, accent, cols, overBudget),
    [theme, accent, cols, overBudget],
  );

  return (
    <View style={styles.shell}>
      <MfTechKpiCard level="metric" style={styles.card}>
        <View style={styles.cardTop}>
          <View style={[styles.iconWrap, { backgroundColor: `${accent}18` }]}>
            <Ionicons name={iconName} size={18} color={accent} />
          </View>
          <Pressable
            onPress={onPress}
            style={styles.cardBody}
            accessibilityRole="button"
            accessibilityLabel={`${cat.nome}, orçado ${formatCurrencyBR(orcado)}`}
          >
            <Text style={styles.name} numberOfLines={1}>
              {cat.nome}
            </Text>
            <Text style={styles.budgetHint}>
              Orçado: {typeof budgetValue === 'number' ? formatCurrencyBR(budgetValue) : '—'}
            </Text>
          </Pressable>
          <View style={styles.cardActions}>
            <TouchableOpacity
              onPress={onPress}
              style={styles.actionBtn}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Editar orçamento"
            >
              <Ionicons name="pencil-outline" size={17} color={theme.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onDelete}
              style={styles.actionBtn}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Remover orçamento"
            >
              <Ionicons name="trash-outline" size={17} color={theme.textTertiary} />
            </TouchableOpacity>
          </View>
        </View>

        <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel="Editar orçamento">
          <View style={styles.track}>
            <View
              style={[
                styles.fill,
                {
                  width: `${pct}%`,
                  backgroundColor: overBudget ? theme.financeOverdue : accent,
                },
              ]}
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.realizado}>
              Realizado: {formatCurrencyBR(realizado)}
            </Text>
            <Text style={styles.pct}>{orcado > 0 ? `${pct.toFixed(0)}%` : '—'}</Text>
          </View>
        </Pressable>
      </MfTechKpiCard>
    </View>
  );
}

function gridCellWidth(cols: 1 | 2 | 3): ViewStyle {
  const gap = mfSpacing.md;
  if (cols === 3) {
    const basis = `calc((100% - ${2 * gap}px) / 3)`;
    return Platform.select({
      web: {
        flexGrow: 0,
        flexShrink: 0,
        flexBasis: basis,
        maxWidth: basis,
        width: basis,
      },
      default: {
        flexGrow: 0,
        flexShrink: 0,
        flexBasis: '31%',
        maxWidth: '31%',
        width: '31%',
      },
    }) as ViewStyle;
  }
  if (cols === 2) {
    const basis = `calc((100% - ${gap}px) / 2)`;
    return Platform.select({
      web: {
        flexGrow: 0,
        flexShrink: 0,
        flexBasis: basis,
        maxWidth: basis,
        width: basis,
      },
      default: {
        flexGrow: 0,
        flexShrink: 0,
        flexBasis: '48%',
        maxWidth: '48%',
        width: '48%',
      },
    }) as ViewStyle;
  }
  return { width: '100%', flexGrow: 0, flexShrink: 0 };
}

function createStyles(
  theme: ReturnType<typeof useMfTheme>['theme'],
  accent: string,
  gridColumns: 1 | 2 | 3,
  overBudget: boolean,
) {
  return StyleSheet.create({
    shell: {
      ...gridCellWidth(gridColumns),
      marginBottom: mfSpacing.sm,
    },
    card: {
      flex: 1,
      alignSelf: 'stretch',
    },
    cardTop: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: mfSpacing.sm,
      marginBottom: mfSpacing.sm,
    },
    iconWrap: {
      width: 36,
      height: 36,
      borderRadius: mfRadius.md,
      borderWidth: 1,
      borderColor: `${accent}44`,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    cardBody: {
      flex: 1,
      minWidth: 0,
    },
    name: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.text,
      letterSpacing: -0.2,
    },
    budgetHint: {
      fontSize: 12,
      color: theme.textSecondary,
      marginTop: 2,
    },
    cardActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
      flexShrink: 0,
    },
    actionBtn: {
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
    track: {
      height: 4,
      borderRadius: mfRadius.pill,
      backgroundColor: theme.border,
      overflow: 'hidden',
    },
    fill: {
      height: '100%',
      borderRadius: mfRadius.pill,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: mfSpacing.sm,
    },
    realizado: {
      fontSize: 12,
      fontWeight: '600',
      color: overBudget ? theme.financeOverdue : theme.text,
      fontFamily: monoFont,
      fontVariant: ['tabular-nums'],
    },
    pct: {
      fontSize: 12,
      color: theme.textTertiary,
      fontFamily: monoFont,
      fontVariant: ['tabular-nums'],
    },
  });
}
