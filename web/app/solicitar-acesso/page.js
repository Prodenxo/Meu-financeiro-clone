import { AuthShell } from '@/components/auth/AuthShell';
import { AccessRequestForm } from './AccessRequestForm';

export const metadata = { title: 'Cadastre-se' };

export default function SolicitarAcessoPage() {
  return (
    <AuthShell
      wide
      eyebrow="Cadastro"
      title="Quero garantir meu acesso"
      subtitle="Preencha seus dados e os da sua empresa. A CF Contabilidade analisa e libera o acesso."
    >
      <AccessRequestForm />
    </AuthShell>
  );
}
