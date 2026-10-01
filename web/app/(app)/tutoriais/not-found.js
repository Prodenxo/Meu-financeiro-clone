import Link from 'next/link';
import { Card, EmptyState } from '@/components/ui';

export default function TutorialNotFound() {
  return (
    <Card>
      <EmptyState
        icon="book-open"
        title="Tutorial não disponível"
        text="Esse conteúdo não existe ou não está publicado."
        action={<Link href="/tutoriais">Voltar para a central</Link>}
      />
    </Card>
  );
}
