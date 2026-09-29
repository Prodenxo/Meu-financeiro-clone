import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { RecorrenciasFullscreenModal } from '../RecorrenciasFullscreenModal';

jest.mock('../../screens/RecorrenciasScreen', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- factory Jest (hoisting)
  const { View, Text } = require('react-native');
  return function MockRecorrenciasScreen() {
    return (
      <View testID="mock-recorrencias-screen">
        <Text>MockRecorrencias</Text>
      </View>
    );
  };
});

describe('RecorrenciasFullscreenModal (QA 1.6 — smoke)', () => {
  it('exporta componente utilizável', () => {
    expect(typeof RecorrenciasFullscreenModal).toBe('function');
  });

  it('monta e desmonta sem erro (visible false e true)', () => {
    act(() => {
      const root = renderer.create(
        <RecorrenciasFullscreenModal visible={false} onClose={() => {}} />
      );
      root.unmount();
    });
    act(() => {
      const root = renderer.create(
        <RecorrenciasFullscreenModal visible onClose={() => {}} />
      );
      root.unmount();
    });
  });
});
