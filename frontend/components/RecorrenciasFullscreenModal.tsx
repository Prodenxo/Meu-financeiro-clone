import React from 'react';
import { Modal } from 'react-native';
import RecorrenciasScreen from '../screens/RecorrenciasScreen';

/** Mesmo invólucro que `TransactionsScreen`: um único ponto para IV-1/IV-2 e paridade com `/recorrencias`. */
export function RecorrenciasFullscreenModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <RecorrenciasScreen onClose={onClose} />
    </Modal>
  );
}
