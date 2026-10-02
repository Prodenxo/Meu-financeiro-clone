/** Conteúdo canônico: frontend/public/privacidade.html (15 de junho de 2026). */

export const privacyDocument = {
  path: '/privacidade',
  updatedLabel: '15 de junho de 2026',
  meta: {
    title: 'Política de Privacidade',
    description: 'Como o Meu Financeiro trata seus dados pessoais, integrações e seus direitos na LGPD.',
  },
  hero: {
    title: 'Política de Privacidade',
    lead: [
      { text: 'Transparência sobre o que coletamos, por quê e como você controla seus dados ao usar o Meu Financeiro em ' },
      { text: 'meiinfinito.com.br', strong: true },
      { text: ' e nos apps associados.' },
    ],
  },
  sections: [
    {
      id: 'quem-somos',
      title: 'Quem somos',
      level: 2,
      blocks: [
        {
          type: 'p',
          parts: [
            { text: 'O ' },
            { text: 'Meu Financeiro', strong: true },
            {
              text:
                ' é uma plataforma de organização financeira pessoal. Esta política vale para contas criadas no site e em aplicativos vinculados ao mesmo serviço.',
            },
          ],
        },
      ],
    },
    {
      id: 'dados-que-voce-nos-fornece',
      title: 'Dados que você nos fornece',
      level: 2,
      blocks: [
        {
          type: 'ul',
          items: [
            [
              { text: 'Cadastro e login:', strong: true },
              { text: ' e-mail, nome e telefone (quando informado).' },
            ],
            [
              { text: 'Uso do produto:', strong: true },
              { text: ' transações, categorias, orçamentos, recorrências e demais informações que você registra.' },
            ],
            [
              { text: 'Suporte:', strong: true },
              { text: ' mensagens enviadas ao nosso time, quando você entra em contato.' },
            ],
          ],
        },
      ],
    },
    {
      id: 'dados-gerados-automaticamente',
      title: 'Dados gerados automaticamente',
      level: 2,
      blocks: [
        {
          type: 'p',
          parts: [
            {
              text:
                'Registramos informações técnicas mínimas para manter o serviço seguro e estável — por exemplo, tipo de dispositivo, logs de erro e endereço IP em operações sensíveis. Não usamos esses dados para vender publicidade ou montar perfil de marketing.',
            },
          ],
        },
      ],
    },
    {
      id: 'para-que-usamos-suas-informacoes',
      title: 'Para que usamos suas informações',
      level: 2,
      blocks: [
        {
          type: 'ul',
          items: [
            [{ text: 'Autenticar sua conta e proteger o acesso.' }],
            [{ text: 'Exibir dashboards, relatórios, agenda e demais funções que você ativa.' }],
            [{ text: 'Responder solicitações de suporte e cumprir obrigações legais.' }],
            [{ text: 'Melhorar estabilidade e segurança da plataforma.' }],
          ],
        },
      ],
    },
    {
      id: 'google-agenda-opcional',
      title: 'Google Agenda (opcional)',
      level: 2,
      blocks: [
        {
          type: 'p',
          parts: [
            { text: 'A conexão com o Google Calendar só acontece se você autorizar em ' },
            { text: 'Configurações → Google Agenda', strong: true },
            { text: '. Nesta seção explicamos ' },
            {
              text: 'quais dados de usuário do Google coletamos, como usamos e com quem compartilhamos, transferimos ou divulgamos esses dados',
              strong: true,
            },
            { text: ' para operar o Meu Financeiro com a integração ao Google Agenda.' },
          ],
        },
        {
          type: 'p',
          parts: [
            { text: 'Quando você ativa a integração, pedimos permissão para o escopo ' },
            { text: 'calendar.events', code: true },
            { text: ', que permite:' },
          ],
        },
        {
          type: 'ul',
          items: [
            [{ text: 'listar eventos na sua Agenda dentro do Meu Financeiro;' }],
            [{ text: 'criar, editar ou excluir eventos quando você solicitar.' }],
          ],
        },
        {
          type: 'callout',
          title: 'Armazenamento e revogação',
          body: [
            {
              text:
                'Tokens OAuth ficam guardados de forma segura no backend (Supabase), ligados à sua conta, e só são usados para chamadas que você dispara. Para desconectar: use a opção na configuração do app ou remova o acesso em ',
            },
            {
              text: 'Conta Google → Segurança → Acesso de terceiros',
              href: 'https://myaccount.google.com/permissions',
              external: true,
            },
            { text: '.' },
          ],
        },
      ],
    },
    {
      id: 'google-dados-coletados',
      title: 'Dados do Google que coletamos',
      level: 3,
      blocks: [
        {
          type: 'p',
          parts: [
            { text: 'Com sua autorização, acessamos ' },
            { text: 'dados de usuário do Google', strong: true },
            { text: ' limitados ao escopo ' },
            { text: 'calendar.events', code: true },
            {
              text:
                ': metadados de eventos (título, data/hora, descrição quando houver, recorrência, identificadores do evento) e tokens OAuth para manter a conexão.',
            },
          ],
        },
        {
          type: 'p',
          parts: [
            {
              text:
                'Não coletamos conteúdos fora do necessário para listar e gerenciar eventos na sua Agenda conforme as ações que você executa no Meu Financeiro.',
            },
          ],
        },
      ],
    },
    {
      id: 'google-como-usamos',
      title: 'Como usamos os dados do Google',
      level: 3,
      blocks: [
        {
          type: 'p',
          parts: [
            { text: 'Usamos esses dados ' },
            { text: 'somente', strong: true },
            {
              text:
                ' para funcionalidades da Agenda que você solicita (exibir, sincronizar, criar, editar ou excluir eventos). ',
            },
            { text: 'Não', strong: true },
            {
              text:
                ' usamos para publicidade, venda a terceiros, marketing, treinamento de IA genérico nem fins de crédito.',
            },
          ],
        },
      ],
    },
    {
      id: 'google-compartilhamento',
      title: 'Com quem compartilhamos, transferimos ou divulgamos dados do Google',
      level: 3,
      blocks: [
        {
          type: 'p',
          parts: [
            {
              text: 'Não vendemos nem divulgamos dados de usuário do Google para publicidade ou marketing.',
              strong: true,
            },
            {
              text: ' Compartilhamos, transferimos ou divulgamos dados do Google apenas para operar o serviço que você pediu:',
            },
          ],
        },
        {
          type: 'ul',
          items: [
            [
              { text: 'Supabase', strong: true },
              {
                text:
                  ' — armazenamento seguro de tokens OAuth e, quando aplicável, metadados de eventos necessários para sincronização.',
              },
            ],
            [
              { text: 'Google LLC', strong: true },
              {
                text:
                  ' — API do Google Calendar, quando você cria, altera, exclui ou consulta eventos a partir do Meu Financeiro.',
              },
            ],
            [
              { text: 'Provedores de hospedagem e infraestrutura', strong: true },
              {
                text:
                  ' — operação, monitoramento e segurança do backend e dos serviços de nuvem usados pelo Meu Financeiro, ',
              },
              {
                text: 'sem qualquer uso independente dos dados de usuário do Google',
                strong: true,
              },
              { text: '.' },
            ],
          ],
        },
        {
          type: 'p',
          parts: [
            {
              text: 'Não transferimos nem divulgamos dados de usuário do Google a terceiros para finalidades diferentes das acima',
              strong: true,
            },
            {
              text:
                ' (ex.: publicidade direcionada, corretores de dados, revenda, credit scoring ou treinamento de IA não relacionado ao app).',
            },
          ],
        },
      ],
    },
    {
      id: 'google-protecao-retencao',
      title: 'Proteção e retenção dos dados do Google',
      level: 3,
      blocks: [
        {
          type: 'p',
          parts: [
            {
              text:
                'Usamos HTTPS/TLS, controle de acesso por conta e proteção de tokens no backend. Mantemos dados enquanto a integração estiver ativa; ao desconectar ou excluir a conta, removemos tokens e paramos novas sincronizações em prazo razoável. Solicitações: ',
            },
            { text: 'suporte@meiinfinito.com.br', href: 'mailto:suporte@meiinfinito.com.br' },
            { text: '.' },
          ],
        },
        {
          type: 'p',
          parts: [
            { text: 'O uso de informações das APIs do Google segue a ' },
            {
              text: 'Política de dados do usuário dos serviços de API do Google',
              href: 'https://developers.google.com/terms/api-services-user-data-policy',
              external: true,
            },
            { text: ' (requisitos de ' },
            { text: 'Uso limitado', strong: true },
            { text: ').' },
          ],
        },
      ],
    },
    {
      id: 'parceiros-de-infraestrutura',
      title: 'Parceiros de infraestrutura (dados gerais)',
      level: 2,
      blocks: [
        {
          type: 'p',
          parts: [
            {
              text:
                'Para dados pessoais em geral, utilizamos provedores como Supabase e, com sua autorização, a API do Google Calendar, apenas na medida necessária para o Meu Financeiro.',
            },
          ],
        },
      ],
    },
    {
      id: 'retencao-e-seguranca',
      title: 'Retenção e segurança',
      level: 2,
      blocks: [
        {
          type: 'p',
          parts: [
            {
              text:
                'Mantemos seus dados enquanto a conta estiver ativa ou enquanto a lei exigir. Aplicamos controles técnicos e organizacionais razoáveis contra acesso não autorizado, perda ou alteração indevida.',
            },
          ],
        },
      ],
    },
    {
      id: 'seus-direitos-lgpd',
      title: 'Seus direitos (LGPD)',
      level: 2,
      blocks: [
        {
          type: 'p',
          parts: [{ text: 'Você pode, conforme a lei brasileira:' }],
        },
        {
          type: 'ul',
          items: [
            [{ text: 'confirmar se tratamos seus dados e solicitar cópia;' }],
            [{ text: 'corrigir dados incompletos ou desatualizados;' }],
            [{ text: 'pedir exclusão ou portabilidade, quando aplicável;' }],
            [{ text: 'revogar consentimento de integrações opcionais (como o Google Agenda).' }],
          ],
        },
        {
          type: 'p',
          parts: [
            { text: 'Para exercer qualquer direito, escreva para ' },
            { text: 'suporte@meiinfinito.com.br', href: 'mailto:suporte@meiinfinito.com.br' },
            { text: '. Respondemos em prazo razoável.' },
          ],
        },
      ],
    },
    {
      id: 'alteracoes-nesta-politica',
      title: 'Alterações nesta política',
      level: 2,
      blocks: [
        {
          type: 'p',
          parts: [
            {
              text:
                'Podemos atualizar este texto para refletir mudanças no produto ou na legislação. A data no topo indica a versão vigente. Mudanças relevantes podem ser comunicadas por e-mail ou aviso no app.',
            },
          ],
        },
      ],
    },
  ],
};
