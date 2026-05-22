import React from 'react';
import { Link } from 'react-router-dom';
import LegalDocumentLayout from '../components/LegalDocumentLayout';

const CONTACT_EMAIL = 'suporte@meiinfinito.com.br';

export default function Termos() {
  return (
    <LegalDocumentLayout title="Termos de Uso" lastUpdated="19 de maio de 2026">
      <p>
        Estes Termos de Uso regem o acesso e a utilização do <strong>Meu Financeiro</strong>, serviço
        disponível em <strong>meiinfinito.com.br</strong> e aplicativos associados. Ao criar conta ou
        utilizar o serviço, você declara ter lido e concordado com estes termos e com nossa{' '}
        <Link to="/privacidade" className="text-blue-600 hover:underline dark:text-blue-400">
          Política de Privacidade
        </Link>
        .
      </p>

      <h2>1. Serviço</h2>
      <p>
        O Meu Financeiro oferece ferramentas de organização financeira pessoal (transações, categorias,
        orçamentos, agenda e integrações opcionais). O serviço é fornecido “no estado em que se encontra”,
        com evolução contínua de funcionalidades.
      </p>

      <h2>2. Conta e responsabilidades</h2>
      <ul>
        <li>Você deve fornecer informações verdadeiras e manter suas credenciais em sigilo.</li>
        <li>É responsável por toda atividade realizada na sua conta.</li>
        <li>Não utilize o serviço para fins ilícitos ou que violem direitos de terceiros.</li>
      </ul>

      <h2>3. Integrações de terceiros</h2>
      <p>
        Funcionalidades como o <strong>Google Calendar</strong> dependem de serviços de terceiros e da sua
        autorização expressa. O uso dessas integrações também está sujeito aos termos do Google. Você pode
        desconectar integrações a qualquer momento nas configurações do aplicativo.
      </p>

      <h2>4. Propriedade intelectual</h2>
      <p>
        O software, marca e interface do Meu Financeiro pertencem aos titulares do serviço. Os dados
        financeiros que você insere permanecem seus.
      </p>

      <h2>5. Limitação de responsabilidade</h2>
      <p>
        O Meu Financeiro auxilia na organização de informações, mas não substitui assessoria contábil,
        fiscal ou jurídica. Não nos responsabilizamos por decisões tomadas com base exclusivamente em
        relatórios ou lembretes do aplicativo, nem por indisponibilidade temporária de terceiros (ex.:
        Google, provedores de nuvem).
      </p>

      <h2>6. Suspensão e encerramento</h2>
      <p>
        Podemos suspender ou encerrar contas em caso de violação destes termos, fraude ou exigência legal.
        Você pode deixar de usar o serviço e solicitar exclusão de dados conforme a Política de Privacidade.
      </p>

      <h2>7. Alterações</h2>
      <p>
        Podemos alterar estes Termos. Publicaremos a versão atualizada nesta página. O uso continuado após
        mudanças relevantes constitui aceite, salvo quando a lei exigir consentimento específico.
      </p>

      <h2>8. Contato</h2>
      <p>
        Dúvidas sobre estes Termos:{' '}
        <a href={`mailto:${CONTACT_EMAIL}`} className="text-blue-600 hover:underline dark:text-blue-400">
          {CONTACT_EMAIL}
        </a>
        .
      </p>
    </LegalDocumentLayout>
  );
}
