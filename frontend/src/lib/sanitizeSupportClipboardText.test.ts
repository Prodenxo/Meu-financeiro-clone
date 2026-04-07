import { describe, it, expect } from 'vitest';
import { sanitizeSupportClipboardText } from './sanitizeSupportClipboardText';

describe('sanitizeSupportClipboardText', () => {
  it('remove Bearer e JWT-like', () => {
    const raw =
      'algo falhou Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.signature e mais texto';
    const out = sanitizeSupportClipboardText(raw);
    expect(out).not.toMatch(/Bearer\s+eyJ/);
    expect(out).toContain('[redacted]');
  });

  it('remove token= em query', () => {
    expect(sanitizeSupportClipboardText('url?token=secret123&x=1')).toMatch(/token=\[redacted\]/);
  });

  it('remove cabeçalho Authorization em linha', () => {
    const out = sanitizeSupportClipboardText('X\nAuthorization: Bearer abc.def.ghi\nY');
    expect(out).toContain('[redacted]');
    expect(out).not.toContain('abc.def.ghi');
  });
});
