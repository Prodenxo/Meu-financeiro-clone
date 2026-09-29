import React, { useMemo } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import type { AuthPalette } from './authTokens'
import { authTypography } from './authTokens'
import {
  getPasswordStrength,
  type PasswordStrengthLevel,
} from '../../lib/authValidation'

type Props = {
  password: string
  palette: AuthPalette
}

function barColor (level: PasswordStrengthLevel, palette: AuthPalette): string {
  if (level === 'strong') return '#059669'
  if (level === 'medium') return '#D97706'
  if (level === 'weak') return palette.alertErrorText
  return palette.inputBorder
}

export function AuthPasswordStrength ({ password, palette }: Props) {
  const strength = useMemo(() => getPasswordStrength(password), [password])
  const activeBars = strength.level === 'empty'
    ? 0
    : strength.level === 'weak'
      ? 1
      : strength.level === 'medium'
        ? 2
        : 3
  const color = barColor(strength.level, palette)

  return (
    <View
      style={styles.wrap}
      accessibilityRole="text"
      accessibilityLabel={
        strength.label
          ? `Força da senha: ${strength.label}`
          : 'Requisitos de senha'
      }
    >
      <View style={styles.meterRow}>
        {[0, 1, 2].map((index) => (
          <View
            key={index}
            style={[
              styles.meterBar,
              {
                backgroundColor: index < activeBars ? color : palette.inputBorder,
              },
            ]}
          />
        ))}
        {strength.label ? (
          <Text style={[styles.meterLabel, { color }]}>{strength.label}</Text>
        ) : null}
      </View>

      <View style={styles.rules}>
        {strength.rules.map((rule) => (
          <View key={rule.key} style={styles.ruleRow}>
            <Ionicons
              name={rule.ok ? 'checkmark-circle' : 'ellipse-outline'}
              size={16}
              color={rule.ok ? '#059669' : palette.iconNeutral}
            />
            <Text
              style={[
                styles.ruleText,
                { color: rule.ok ? palette.labelText : palette.subtitleText },
              ]}
            >
              {rule.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    gap: 10,
    marginTop: 4,
    marginBottom: 4,
  },
  meterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  meterBar: {
    flex: 1,
    height: 6,
    borderRadius: 999,
  },
  meterLabel: {
    fontSize: 12,
    fontWeight: '700',
    minWidth: 48,
    textAlign: 'right',
  },
  rules: {
    gap: 6,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ruleText: {
    fontSize: Math.max(12, authTypography.labelSize - 1),
    fontWeight: '500',
    flex: 1,
  },
})
