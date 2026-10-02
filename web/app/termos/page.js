import { LegalDocumentPage } from '@/components/legal/LegalDocumentPage';
import { termsDocument } from '@/lib/legal/terms';

export const metadata = {
  title: termsDocument.meta.title,
  description: termsDocument.meta.description,
};

export default function TermosPage() {
  return <LegalDocumentPage document={termsDocument} />;
}
