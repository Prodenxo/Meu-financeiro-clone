/** Conteúdo canônico: frontend/public/termos.html (19 de maio de 2026). */

export const termsDocument = {
  path: '/termos',
  updatedLabel: '19 de maio de 2026',
  meta: {
    title: 'Termos de Uso',
    description: 'Regras de uso do Meu Financeiro: conta, integrações, responsabilidades e contato.',
  },
  hero: {
    title: 'Termos de Uso',
    lead: [
      { text: 'Ao criar uma conta ou usar o Meu Financeiro, você aceita estas regras. Leia também nossa ' },
      { text: 'Política de Privacidade', href: '/privacidade' },
      { text: '.' },
    ],
  },
  sections: [
    {
      id: 'o-servico',
      title: 'O serviço',
      level: 2,
      blocks: [
        {
          type: 'p',
          parts: [
            {
              text:
                'O Meu Financeiro oferece ferramentas para organizar finanças pessoais: lançamentos, categorias, orçamentos, agenda e integrações opcionais (como Google Agenda). O produto evolui com melhorias contínuas; algumas funções podem mudar ou ser descontinuadas com aviso prévio quando possível.',
            },
          ],
        },
      ],
    },
    {
      id: 'sua-conta',
      title: 'Sua conta',
      level: 2,
      blocks: [
        {
          type: 'ul',
          items: [
            [{ text: 'Forneça informações verdadeiras e mantenha sua senha em sigilo.' }],
            [{ text: 'Você é responsável pela atividade feita na sua conta.' }],
            [{ text: 'Não use a plataforma para fins ilegais, fraudulentos ou que prejudiquem terceiros.' }],
            [{ text: 'Uma pessoa física não deve compartilhar credenciais com terceiros não autorizados.' }],
          ],
        },
      ],
    },
    {
      id: 'integracoes-de-terceiros',
      title: 'Integrações de terceiros',
      level: 2,
      blocks: [
        {
          type: 'p',
          parts: [
            {
              text:
                'Recursos como o Google Agenda dependem de serviços externos e da sua autorização explícita. O uso dessas integrações também segue os termos do provedor (por exemplo, Google). Você pode desconectar a qualquer momento nas configurações do Meu Financeiro.',
            },
          ],
        },
      ],
    },
    {
      id: 'conteudo-e-propriedade',
      title: 'Conteúdo e propriedade',
      level: 2,
      blocks: [
        {
          type: 'p',
          parts: [
            {
              text:
                'Os dados financeiros que você insere são seus. O software, a marca e o design da interface pertencem aos titulares do Meu Financeiro. É proibido copiar, engenharia reversa ou redistribuir o serviço sem autorização.',
            },
          ],
        },
      ],
    },
    {
      id: 'limitacoes-importantes',
      title: 'Limitações importantes',
      level: 2,
      blocks: [
        {
          type: 'callout',
          title: 'Não é assessoria profissional',
          body: [
            {
              text:
                'Relatórios, lembretes e visualizações ajudam na organização, mas não substituem contador, advogado ou consultor fiscal. Decisões financeiras e tributárias são de sua responsabilidade.',
            },
          ],
        },
        {
          type: 'p',
          parts: [
            {
              text:
                'O serviço é oferecido com esforço razoável de disponibilidade. Interrupções podem ocorrer por manutenção, falhas de provedores de nuvem ou de integrações (Google, Supabase, entre outros).',
            },
          ],
        },
      ],
    },
    {
      id: 'suspensao-e-encerramento',
      title: 'Suspensão e encerramento',
      level: 2,
      blocks: [
        {
          type: 'p',
          parts: [
            {
              text:
                'Podemos suspender ou encerrar contas em caso de violação destes termos, suspeita de fraude ou exigência legal. Você pode parar de usar o serviço a qualquer momento e solicitar exclusão de dados conforme a ',
            },
            { text: 'Política de Privacidade', href: '/privacidade' },
            { text: '.' },
          ],
        },
      ],
    },
    {
      id: 'alteracoes',
      title: 'Alterações',
      level: 2,
      blocks: [
        {
          type: 'p',
          parts: [
            {
              text:
                'Estes termos podem ser atualizados. Publicamos a versão vigente nesta página. O uso continuado após mudanças relevantes indica concordância, salvo quando a lei exigir consentimento específico.',
            },
          ],
        },
      ],
    },
    {
      id: 'contato',
      title: 'Contato',
      level: 2,
      blocks: [
        {
          type: 'p',
          parts: [
            { text: 'Dúvidas sobre estes Termos: ' },
            { text: 'suporte@meiinfinito.com.br', href: 'mailto:suporte@meiinfinito.com.br' },
            { text: '.' },
          ],
        },
      ],
    },
  ],
};
