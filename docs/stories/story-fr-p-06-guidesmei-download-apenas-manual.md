# Story — FR-P-06: Download de guia DAE só por ação explícita (GuidesMei)

**ID:** STORY-FR-P-06  
**Prioridade (PRD):** Must  
**Fonte:** `docs/brief-event1-1.md`, PRD §5.3  
**Relacionado:** `docs/prd/PRD-meu-financeiro-produto-brownfield-2026-03-26.md`

## User story

**Como** utilizador MEI ou admin na Guia MEI,  
**quero** que o PDF da guia (DAE) só seja descarregado quando clicar explicitamente em «Baixar guia»,  
**para** confiar que «Atualizar histórico» não dispara downloads inesperados.

## Contexto técnico

- **Frontend:** `frontend/src/pages/GuidesMei.tsx` — auditar `useEffect` e handlers que chamam `loadMeiPeriods`, `handleDownload`, `downloadMeiGuide`.
- **Arquitetura:** apenas camada de apresentação; sem mudança de contrato de API salvo necessidade de regressão.

## Critérios de aceite

- [ ] «Atualizar histórico» chama apenas atualização de períodos/listagem — **sem** download automático.
- [ ] Download ocorre **somente** por clique (ou ação explícita equivalente) no botão de baixar guia.
- [ ] Não há regressão nos fluxos de geração/visualização de guias quando o utilizador **quer** baixar.
- [ ] `npm run lint` e `npm run typecheck` no `frontend/` (e raiz se aplicável) passam nos ficheiros alterados.

## Fora de escopo

- Alterar regras de negócio Serpro ou backend de emissão de DAS.

## Definition of Done

- Checklist acima completo; revisão manual rápida do fluxo na Guia MEI.

## Qualidade / CodeRabbit

- Foco: efeitos React (`useEffect` deps) e handlers duplicados; evitar novos side-effects ocultos.
