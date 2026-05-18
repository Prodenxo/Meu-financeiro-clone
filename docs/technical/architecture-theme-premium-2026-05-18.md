# Arquitetura Técnica: Evolução Visual Premium "Meu Financeiro"

**Data:** 18 de Maio de 2026
**Autor:** Aria (Architect)
**Status:** Proposto

## 1. Visão Geral
O objetivo é elevar a qualidade visual do "Meu Financeiro" para um padrão Fintech/SaaS Premium (semelhante ao "Meu Assessor"), mantendo a identidade da marca (Azul). A nova arquitetura visual foca em fundos ultra-escuros (Deep Dark), Glassmorphism, alto contraste tipográfico e gráficos vibrantes com brilho (glow).

## 2. Unificação de Design Tokens (Web e Mobile)
Atualmente, a Web (`Site/frontend`) e o Mobile (`App/`) gerenciam estilos de forma isolada (`index.css`/`tailwind.config.js` vs `themeStore.ts`).

### 2.1. O "Single Source of Truth" (SSOT)
Criaremos um pacote/diretório compartilhado contendo a definição estrita dos Design Tokens.
- **Arquivo Central:** `App/shared/theme/tokens.ts` (ou local equivalente).
- **Estrutura:** Um objeto JSON/TS contendo as definições de `colors`, `spacing`, `shadows` e `radii`.

```typescript
// Exemplo de tokens.ts
export const designTokens = {
  colors: {
    primary: {
      neon: '#3B82F6',   // Azul elétrico principal
      glow: 'rgba(59, 130, 246, 0.5)',
      dim: 'rgba(59, 130, 246, 0.1)',
    },
    background: {
      app: '#05050A',    // Ultra-escuro
      card: '#111827',   // Base para o glassmorphism
    },
    border: {
      glass: 'rgba(255, 255, 255, 0.05)',
    }
  },
  effects: {
    glassShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.36)',
    neonGlow: '0 0 15px rgba(59, 130, 246, 0.4)',
  }
};
```

### 2.2. Integração na Web (Vite + Tailwind)
O `tailwind.config.js` importará esse arquivo central e mapeará as propriedades para o tema do Tailwind.
As classes utilitárias continuarão sendo usadas, mas agora os valores virão do SSOT. Efeitos complexos (Grid de fundo) serão adicionados como plugins do Tailwind ou no `@layer utilities` do `index.css`.

### 2.3. Integração no Mobile (React Native / Expo)
O `themeStore.ts` (Zustand ou Context) importará o mesmo `tokens.ts`. 
Criaremos hooks customizados (ex: `useAppTheme()`) que retornam os valores absolutos para serem usados em componentes com `StyleSheet.create` ou styled-components.

## 3. Seleção de Bibliotecas Gráficas

Para reproduzir os gráficos de linhas suaves com preenchimento em degradê (fading) e anéis neon:

### 3.1. Web: `Recharts`
- **Por que:** Altamente customizável, leve, e suporta SVGs nativos para injeção de gradientes.
- **Implementação:** Usar `<defs>` com `<linearGradient>` no topo do gráfico, e referenciar o gradiente no `fill` do componente `<Area>`. O stroke pode usar a cor Neon com um filtro SVG de `<feDropShadow>` para o brilho.

### 3.2. Mobile: `react-native-gifted-charts`
- **Por que:** O `react-native-chart-kit` tem limitações visuais para efeitos avançados de glow. O `gifted-charts` oferece suporte nativo e excelente para gráficos de área com gradientes fluídos, além de ser altamente responsivo.
- **Alternativa (High-End):** `@shopify/react-native-skia`. Exige mais código manual, mas oferece renderização a 60fps com efeitos de blur e glow perfeitos. Recomendo **Skia** se a performance for crítica, ou **Gifted Charts** para velocidade de desenvolvimento.

## 4. Estratégia de Refatoração (Sem Quebrar Telas Atuais)

A refatoração será feita utilizando o padrão **"Strangler Fig"** para o CSS:

### Fase 1: Fundação (Setup)
1. Criar o arquivo `tokens.ts`.
2. Atualizar `tailwind.config.js` para adicionar (não substituir) as novas cores (ex: prefixar com `premium-`).
3. Atualizar o `themeStore.ts` de forma similar.

### Fase 2: Componentes Core (Isolados)
1. Criar um novo conjunto de utilitários no `index.css`:
   - `.card-premium` (substituirá o `.planner-card` gradativamente).
   - `.btn-premium` (com o efeito glow).
2. Criar componentes Wrapper no React/RN (ex: `<PremiumCard>`).

### Fase 3: Migração de Telas (Página a Página)
1. Iniciar pelo **Dashboard Principal**, trocando `.planner-card` por `.card-premium`.
2. Substituir a biblioteca de gráficos no Dashboard.
3. Testar regressões visuais e contraste.

### Fase 4: Limpeza (Depreciação)
1. Remover classes antigas (`bg-slate-900`, `.planner-card` antigo).
2. Oficializar o novo design system como padrão no `body` da aplicação.

## 5. Próximos Passos (Action Items para o @dev)

1. **[Backend/Infra]** N/A para esta sprint.
2. **[Setup]** Criar `shared/theme/tokens.ts` e exportar a paleta Azul Neon / Deep Dark.
3. **[Frontend Web]** Mapear tokens no `tailwind.config.js` e criar os componentes `.card-premium` e utilitários de background grid no `index.css`.
4. **[Frontend Mobile]** Integrar os mesmos tokens no `themeStore.ts`.
5. **[PoC Gráficos]** Implementar um gráfico de área (Receitas x Despesas) com gradiente translúcido como Prova de Conceito nas duas plataformas.
