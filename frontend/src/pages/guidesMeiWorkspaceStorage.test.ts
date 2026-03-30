// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  MEI_WORKSPACE_STORAGE_KEY,
  parseStoredWorkspace,
  readWorkspaceFromStorage,
  resolveInitialWorkspace
} from './guidesMeiWorkspaceStorage';

describe('guidesMeiWorkspaceStorage', () => {
  describe('parseStoredWorkspace', () => {
    it('devolve null para vazio ou inválido', () => {
      expect(parseStoredWorkspace(null)).toBeNull();
      expect(parseStoredWorkspace('')).toBeNull();
      expect(parseStoredWorkspace('   ')).toBeNull();
      expect(parseStoredWorkspace('hack')).toBeNull();
    });

    it('aceita valores conhecidos e trim', () => {
      expect(parseStoredWorkspace('  das  ')).toBe('das');
      expect(parseStoredWorkspace('parcelamentos')).toBe('parcelamentos');
      expect(parseStoredWorkspace('overview')).toBe('overview');
      expect(parseStoredWorkspace('nfse')).toBe('nfse');
    });
  });

  describe('resolveInitialWorkspace', () => {
    it('sem valor guardado → overview', () => {
      expect(resolveInitialWorkspace(null, true)).toBe('overview');
      expect(resolveInitialWorkspace(null, false)).toBe('overview');
    });

    it('nfse sem permissão → overview', () => {
      expect(resolveInitialWorkspace('nfse', false)).toBe('overview');
    });

    it('nfse com permissão mantém', () => {
      expect(resolveInitialWorkspace('nfse', true)).toBe('nfse');
    });

    it('outros workspaces mantêm-se (mesmo sem NFS-e)', () => {
      expect(resolveInitialWorkspace('das', false)).toBe('das');
      expect(resolveInitialWorkspace('parcelamentos', false)).toBe('parcelamentos');
    });
  });

  describe('readWorkspaceFromStorage', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it('sem chave → null', () => {
      expect(readWorkspaceFromStorage()).toBeNull();
    });

    it('lê valor válido', () => {
      localStorage.setItem(MEI_WORKSPACE_STORAGE_KEY, 'das');
      expect(readWorkspaceFromStorage()).toBe('das');
    });

    it('valor inválido → null', () => {
      localStorage.setItem(MEI_WORKSPACE_STORAGE_KEY, 'garbage');
      expect(readWorkspaceFromStorage()).toBeNull();
    });

    it('engole exceção de getItem', () => {
      const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('blocked');
      });
      expect(readWorkspaceFromStorage()).toBeNull();
      spy.mockRestore();
    });
  });
});
