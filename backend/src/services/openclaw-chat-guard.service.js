import { normalizeInboundCommandText } from './zapi-inbound-text.service.js';

/** Respostas fixas — não revelam stack, modelo nem detalhes internos. */
export const CHAT_GUARD_REPLY = {
  internal_probe:
    'Sou o Midas, assistente do Meu Financeiro. Ajudo com finanças, MEI, DAS, NFSe, categorias, lançamentos e a app. Não falo sobre como o sistema foi construído por dentro.',
  off_topic:
    'Atendo somente assuntos financeiros: organização, transações, MEI, DAS, NFSe e a app Meu Financeiro. Para outros temas, use outro canal.',
};

/**
 * @param {string} text
 */
const normalizeForGuard = (text) => {
  const t = normalizeInboundCommandText(text).toLowerCase();
  return t.normalize('NFD').replace(/\p{M}/gu, '');
};

const FINANCE_HINTS = [
  /\b(financeir|financas|dinheiro|saldo|transac|lancament|despesa|receita|gasto|orcament|orcamento)\b/,
  /\b(fluxo de caixa|contas a pagar|contas a receber)\b/,
  /\b(mei\b|das\b|nfse|nota fiscal|imposto|tribut|faturament|divida|invest|juros|credito|debito)\b/,
  /\b(conta\b|extrato|banco|pix\b|pagamento|receb|agenda|calendario|compromiss)\b/,
  /\b(mf\b|meu financeiro|midas|aprovar|pendente|cadastro|categoria|categorias|classificacao)\b/,
  /\b(reais|real\b|rs\b|r\$|salario|salário|prolabore|aluguel|mercado)\b/,
  /\b(entrada|saida|saída|lucro|prejuizo|prejuízo|economia|economizar|gastei|recebi|paguei)\b/,
  /\b(visao geral|dashboard|transacoes|lançamento|lancar|registrar|registra)\b/,
];

const GREETING_ONLY =
  /^(oi|ola|olá|bom dia|boa tarde|boa noite|e ai|e aí|tudo bem|obrigad|valeu|thanks|ok+|sim|nao|não)[\s!.?]*$/i;

const INTERNAL_PROBE_PATTERNS = [
  /\b(qual|que|which)\s+(api|modelo|model|llm|ia|inteligencia artificial|gpt|claude|gemini|openai|anthropic)\b/,
  /\b(qual|que)\s+(robo|robô|bot|agente)\s+(voce|você|vc|é|eh|usa|usas)\b/,
  /\b(voce|você|vc)\s+(é|eh)\s+(qual|que)\s+(robo|robô|bot|ia|modelo|api)\b/,
  /\bopenclaw\b/,
  /\bn8n\b/,
  /\bmf-curl\b/,
  /\bsoul\.md\b/,
  /\b(z-api|zapi|webhook secret|openclaw_webhook)\b/,
  /\b(seu|teu)\s+(prompt|system prompt|instrucoes|instruções|codigo|código)\b/,
  /\b(webhook|token|secret)\s+(intern|interno|sistema|seu|teu|do bot)\b/,
  /\bcomo\s+(voce|você|vc)\s+(funciona|foi feito|foi criado|programado|treinado)\b/,
  /\b(stack|backend|infraestrutura|servidor)\s+(do|da)\s+(bot|robo|robô|sistema|assistente)\b/,
  /\b(revela|mostra|informa|diz)\s+(o|a|seu|teu)?\s*(codigo|código|arquitetura|endpoint|endpoints)\b/,
  /\bqual\s+(servico|serviço|tecnologia|framework)\s+(voce|você|vc)\s+(usa|usas|utiliza)\b/,
];

const OFF_TOPIC_PATTERNS = [
  /\b(porn|pornograf|xxx|hentai|sexo explicit|conteudo adult|site adult|sites adult)\b/,
  /\b(melhor|qual|quais)\s+(site|sites)\s+(de|para)\s+(porn|adult|xxx|sexo)\b/,
  /\b(receita de|como fazer)\s+(bolo|pizza|macarrao|macarrão)\b/,
  /\b(melhor|qual)\s+(filme|serie|série|novela|musica|música|jogo|games)\b/,
  /\b(conte|conta)\s+(uma\s+)?(piada|historia|história)\b/,
  /\b(quem\s+ganhou|placar|campeonato)\b(?!.*\b(aposta|invest|finance)\b)/,
  /\b(receita\s+culinaria|cozinhar)\b/,
  /\b(hackear|invadir|keygen|crack)\b/,
];

const RECOMMENDATION_WITHOUT_FINANCE =
  /\b(melhor|pior|top|recomenda|me indica|me sugere|qual site|quais sites)\b/;

/**
 * @param {string} normalized
 */
const hasFinanceHint = (normalized) =>
  FINANCE_HINTS.some((re) => re.test(normalized));

/**
 * Pré-filtro antes do relay OpenClaw (defesa em profundidade; SOUL.md é a regra principal).
 * @param {string} text
 * @returns {{
 *   block: boolean,
 *   reason: 'internal_probe' | 'off_topic' | null,
 *   reply: string | null
 * }}
 */
export const evaluateChatGuard = (text) => {
  const raw = String(text || '').trim();
  if (!raw) {
    return { block: false, reason: null, reply: null };
  }

  const normalized = normalizeForGuard(raw);

  if (GREETING_ONLY.test(normalized)) {
    return { block: false, reason: null, reply: null };
  }

  for (const re of INTERNAL_PROBE_PATTERNS) {
    if (re.test(normalized)) {
      return {
        block: true,
        reason: 'internal_probe',
        reply: CHAT_GUARD_REPLY.internal_probe,
      };
    }
  }

  if (hasFinanceHint(normalized)) {
    return { block: false, reason: null, reply: null };
  }

  for (const re of OFF_TOPIC_PATTERNS) {
    if (re.test(normalized)) {
      return {
        block: true,
        reason: 'off_topic',
        reply: CHAT_GUARD_REPLY.off_topic,
      };
    }
  }

  if (RECOMMENDATION_WITHOUT_FINANCE.test(normalized)) {
    const financeAdjacent =
      /\b(financ|mei\b|das\b|nfse|app\b|invest|econom|divida|orcament|salario|salário)\b/.test(
        normalized,
      );
    if (!financeAdjacent) {
      return {
        block: true,
        reason: 'off_topic',
        reply: CHAT_GUARD_REPLY.off_topic,
      };
    }
  }

  return { block: false, reason: null, reply: null };
};
