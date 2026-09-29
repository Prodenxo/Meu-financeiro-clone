import {
  parseGoogleCalendarCallbackUrl,
  GOOGLE_CALENDAR_CALLBACK_PREFIX,
} from '../googleCalendarDeepLinkParse';

describe('parseGoogleCalendarCallbackUrl', () => {
  it('retorna ignored para URL irrelevante', () => {
    expect(parseGoogleCalendarCallbackUrl('https://example.com/cb')).toEqual({ kind: 'ignored' });
    expect(parseGoogleCalendarCallbackUrl('')).toEqual({ kind: 'ignored' });
  });

  it('extrai code e state', () => {
    const url = `${GOOGLE_CALENDAR_CALLBACK_PREFIX}?code=abc&state=xyz`;
    expect(parseGoogleCalendarCallbackUrl(url)).toEqual({
      kind: 'oauth_callback',
      code: 'abc',
      state: 'xyz',
      success: undefined,
    });
  });

  it('extrai success=true', () => {
    const url = `${GOOGLE_CALENDAR_CALLBACK_PREFIX}?success=true`;
    expect(parseGoogleCalendarCallbackUrl(url)).toEqual({
      kind: 'oauth_callback',
      code: undefined,
      state: undefined,
      success: true,
    });
  });

  it('extrai success=false', () => {
    const url = `${GOOGLE_CALENDAR_CALLBACK_PREFIX}?success=false`;
    expect(parseGoogleCalendarCallbackUrl(url)).toMatchObject({
      kind: 'oauth_callback',
      success: false,
    });
  });

  it('retorna oauth_callback sem params se só o prefixo', () => {
    expect(parseGoogleCalendarCallbackUrl(GOOGLE_CALENDAR_CALLBACK_PREFIX)).toEqual({
      kind: 'oauth_callback',
    });
  });
});
