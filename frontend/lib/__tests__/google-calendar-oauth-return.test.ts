import { Platform } from 'react-native';
import {
  buildGoogleOAuthReturnTo,
  captureGoogleCalendarReturnFromUrlSync,
  tryNotifyOpenerAndClosePopup,
} from '../google-calendar-oauth-return';

describe('google-calendar-oauth-return', () => {
  beforeAll(() => {
    Object.defineProperty(Platform, 'OS', { get: () => 'web' });
  });
  const originalLocation = window.location;

  beforeEach(() => {
    sessionStorage.clear();
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    });
  });

  it('buildGoogleOAuthReturnTo usa /configuracoes no web', () => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        ...originalLocation,
        origin: 'http://localhost:8081',
        pathname: '/configuracoes',
        search: '',
      },
    });
    expect(buildGoogleOAuthReturnTo()).toBe('http://localhost:8081/configuracoes');
  });

  it('captureGoogleCalendarReturnFromUrlSync guarda connected e limpa a URL', () => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        ...originalLocation,
        origin: 'http://localhost:8081',
        pathname: '/configuracoes',
        search: '?googleCalendar=connected',
      },
    });
    const replaceState = jest.spyOn(window.history, 'replaceState').mockImplementation(() => {});

    captureGoogleCalendarReturnFromUrlSync();

    expect(sessionStorage.getItem('mf_google_calendar_oauth_v1')).toBe('connected');
    expect(replaceState).toHaveBeenCalledWith({}, document.title, '/configuracoes');

    replaceState.mockRestore();
  });

  it('tryNotifyOpenerAndClosePopup envia postMessage e fecha popup', () => {
    const postMessage = jest.fn();
    const close = jest.fn();
    const opener = { closed: false, postMessage } as unknown as Window;
    Object.defineProperty(window, 'opener', { configurable: true, value: opener });
    Object.defineProperty(window, 'close', { configurable: true, value: close });
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...originalLocation, origin: 'https://meiinfinito.com.br' },
    });

    expect(tryNotifyOpenerAndClosePopup('connected')).toBe(true);
    expect(postMessage).toHaveBeenCalled();
    expect(close).toHaveBeenCalled();

    Object.defineProperty(window, 'opener', { configurable: true, value: null });
  });
});
