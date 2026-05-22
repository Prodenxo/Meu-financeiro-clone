import React from 'react';
import LegalDocumentLayout from '../components/LegalDocumentLayout';

const CONTACT_EMAIL = 'suporte@meiinfinito.com.br';

export default function Privacidade() {
  return (
    <LegalDocumentLayout title="Política de Privacidade" lastUpdated="19 de maio de 2026">
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

      <h2>5. Compartilhamento com terceiros</h2>
      <p>Podemos utilizar provedores para operação do serviço, por exemplo:</p>
      <ul>
        <li>Supabase (autenticação e banco de dados);</li>
        <li>Google (Calendar API, quando você conectar a integração).</li>
      </ul>
      <p>
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
