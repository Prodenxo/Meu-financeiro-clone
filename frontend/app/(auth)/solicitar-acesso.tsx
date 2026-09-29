import React from 'react';
import { useRouter } from 'expo-router';
import { AccessRequestForm } from '@/screens/auth/AccessRequestForm';

export default function SolicitarAcessoScreen() {
  const router = useRouter();
  return (
    <AccessRequestForm
      onGoToLogin={() => router.replace('/(auth)/login')}
      onDone={() => router.replace('/')}
    />
  );
}
