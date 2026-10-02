import { LegalDocumentPage } from '@/components/legal/LegalDocumentPage';
import { privacyDocument } from '@/lib/legal/privacy';

export const metadata = {
  title: privacyDocument.meta.title,
  description: privacyDocument.meta.description,
};

export default function PrivacidadePage() {
  return <LegalDocumentPage document={privacyDocument} />;
}
