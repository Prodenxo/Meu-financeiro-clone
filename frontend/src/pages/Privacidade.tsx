import React from 'react';
import LegalDocumentLayout from '../components/LegalDocumentLayout';

const CONTACT_EMAIL = 'suporte@meiinfinito.com.br';

export default function Privacidade() {
  return (
    <LegalDocumentLayout title="Política de Privacidade" lastUpdated="26 de maio de 2026">
      <p>
        Esta Política de Privacidade descreve como o <strong>Meu Financeiro</strong> (“nós”, “aplicativo”),
        disponível em <strong>meiinfinito.com.br</strong>, trata dados pessoais de usuários que criam conta
        e utilizam nossos serviços de gestão financeira pessoal.
      </p>

      <h2>1. Dados que coletamos</h2>
      <ul>
        <li>Dados de cadastro e autenticação (e-mail, nome, telefone quando informado).</li>
        <li>Dados financeiros inseridos por você (transações, categorias, orçamentos, recorrências).</li>
        <li>Dados técnicos de uso (logs, dispositivo, IP) para segurança e melhoria do serviço.</li>
        <li>
          Dados do <strong>Google Calendar</strong>, somente se você optar por conectar a integração (ver
          seção 4).
        </li>
      </ul>

      <h2>2. Finalidade do tratamento</h2>
      <p>Utilizamos os dados para:</p>
      <ul>
        <li>fornecer e manter o aplicativo;</li>
        <li>autenticar sua conta e proteger o acesso;</li>
        <li>exibir relatórios, agenda e funcionalidades solicitadas por você;</li>
        <li>atender suporte e obrigações legais.</li>
      </ul>
      <p>
        Não vendemos seus dados pessoais nem utilizamos informações do calendário para publicidade
        direcionada.
      </p>

      <h2>3. Base legal e consentimento</h2>
      <p>
        O tratamento baseia-se na execução do contrato de uso do serviço, no legítimo interesse de
        segurança e, quando aplicável, no seu consentimento — por exemplo, ao conectar o Google Calendar.
      </p>

      <h2>4. Integração com Google Calendar</h2>
      <p>
        Se você autorizar em <strong>Configurações → Google Agenda</strong>, solicitamos permissão para
        acessar eventos do seu calendário Google (escopo{' '}
        <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 rounded">calendar.events</code>
        ), permitindo:
      </p>
      <ul>
        <li>listar eventos na tela Agenda do Meu Financeiro;</li>
        <li>criar, editar e excluir eventos que você solicitar pelo aplicativo.</li>
      </ul>
      <p>
        Tokens de acesso OAuth são armazenados de forma segura em nossa infraestrutura de backend
        (Supabase), associados à sua conta, e usados apenas para chamadas à API do Google Calendar
        iniciadas por você.
      </p>
      <p>
        <strong>Como revogar:</strong> em Configurações → Desconectar Google Agenda, ou em{' '}
        <a
          href="https://myaccount.google.com/permissions"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline dark:text-blue-400"
        >
          myaccount.google.com/permissions
        </a>
        .
      </p>

      <h3>4.1 Dados do Google que coletamos</h3>
      <p>
        Com sua autorização, podemos acessar e processar <strong>dados de utilizador do Google</strong>{' '}
        limitados ao escopo <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 rounded">calendar.events</code>
        , incluindo: identificadores e metadados de eventos do calendário (título, data/hora, descrição quando
        presente, recorrência e identificadores técnicos do evento), além de tokens OAuth necessários para manter a
        conexão.
      </p>

      <h3>4.2 Como usamos os dados do Google</h3>
      <p>
        Utilizamos esses dados <strong>apenas</strong> para fornecer e melhorar funcionalidades voltadas ao
        utilizador na Agenda do Meu Financeiro (sincronizar, exibir, criar, editar ou excluir eventos que você
        solicitar). <strong>Não</strong> usamos dados do Google para publicidade, venda a terceiros, perfil de
        marketing, treinamento de modelos de IA genéricos nem para fins de crédito.
      </p>

      <h3>4.3 Com quem compartilhamos, transferimos ou divulgamos dados do Google</h3>
      <p>
        <strong>
          Não vendemos, alugamos nem divulgamos dados de utilizador do Google a terceiros para fins de publicidade
          ou marketing.
        </strong>{' '}
        Compartilhamos, transferimos ou divulgamos dados do Google somente nas situações abaixo, e sempre para
        viabilizar o serviço que você solicitou:
      </p>
      <ul>
        <li>
          <strong>Supabase</strong> (hospedagem de banco de dados e autenticação): armazenamento seguro de tokens
          OAuth e metadados de eventos sincronizados, na medida necessária para operar a integração.
        </li>
        <li>
          <strong>Google LLC</strong> (Google Calendar API): transmissão de dados quando você cria, altera ou
          consulta eventos pela integração — fluxo normal da API autorizada por você.
        </li>
        <li>
          <strong>Provedores de infraestrutura</strong> (ex.: hospedagem do backend): acesso restrito sob contrato,
          apenas para operar, proteger e manter o serviço, sem uso independente dos dados do Google.
        </li>
      </ul>
      <p>
        <strong>
          Não transferimos nem divulgamos dados de utilizador do Google a terceiros para finalidades diferentes
          das descritas acima
        </strong>{' '}
        (por exemplo: publicidade direcionada, corretores de dados, revenda de dados, determinação de
        creditworthiness ou treinamento de modelos de IA não relacionados à funcionalidade do app).
      </p>

      <h3>4.4 Proteção dos dados do Google</h3>
      <p>
        Aplicamos medidas técnicas e organizacionais razoáveis, incluindo comunicação cifrada (HTTPS/TLS), controle
        de acesso por conta e armazenamento de tokens com proteção no backend. O acesso interno é limitado ao
        necessário para suporte e operação do serviço.
      </p>

      <h3>4.5 Retenção e exclusão dos dados do Google</h3>
      <p>
        Mantemos tokens e dados de calendário sincronizados enquanto a integração estiver ativa ou enquanto sua
        conta existir, salvo obrigação legal. Ao desconectar o Google Agenda ou excluir sua conta, removemos ou
        anonimizamos tokens OAuth e deixamos de sincronizar novos dados do Google, em prazo razoável. Você também
        pode solicitar exclusão pelo e-mail{' '}
        <a href={`mailto:${CONTACT_EMAIL}`} className="text-blue-600 hover:underline dark:text-blue-400">
          {CONTACT_EMAIL}
        </a>
        .
      </p>
      <p>
        O uso e a transferência de informações recebidas das APIs do Google pelo Meu Financeiro obedecem à{' '}
        <a
          href="https://developers.google.com/terms/api-services-user-data-policy"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline dark:text-blue-400"
        >
          Política de dados do utilizador dos serviços de API do Google
        </a>
        , incluindo os requisitos de <strong>Uso limitado</strong>.
      </p>

      <h2>5. Compartilhamento com terceiros (dados gerais)</h2>
      <p>
        Para dados pessoais em geral (não apenas do Google), podemos utilizar provedores para operação do serviço,
        por exemplo Supabase (autenticação e banco de dados) e, quando você autorizar, a API do Google Calendar.
        Esses provedores tratam dados conforme seus próprios termos e apenas na medida necessária para o
        funcionamento do Meu Financeiro.
      </p>

      <h2>6. Retenção e segurança</h2>
      <p>
        Mantemos os dados enquanto sua conta estiver ativa ou conforme exigido por lei. Aplicamos medidas
        técnicas e organizacionais razoáveis para proteger informações contra acesso não autorizado.
      </p>

      <h2>7. Seus direitos</h2>
      <p>
        Nos termos da LGPD, você pode solicitar acesso, correção, exclusão, portabilidade ou revogação de
        consentimento, quando aplicável. Entre em contato pelo e-mail{' '}
        <a href={`mailto:${CONTACT_EMAIL}`} className="text-blue-600 hover:underline dark:text-blue-400">
          {CONTACT_EMAIL}
        </a>
        .
      </p>

      <h2>8. Alterações</h2>
      <p>
        Podemos atualizar esta política. A data no topo indica a última revisão. O uso continuado após
        alterações relevantes pode exigir novo consentimento quando exigido por lei.
      </p>
    </LegalDocumentLayout>
  );
}
