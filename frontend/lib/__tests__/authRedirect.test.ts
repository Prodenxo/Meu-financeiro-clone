import { isAuthPublicPath, pathToExpoHref } from '../authRedirect'

describe('authRedirect', () => {
  it('pathToExpoHref mapeia rotas do app', () => {
    expect(pathToExpoHref('/configuracoes/solicitacoes')).toBe(
      '/(app)/configuracoes/solicitacoes',
    )
    expect(pathToExpoHref('/transacoes')).toBe('/(app)/transacoes')
    expect(pathToExpoHref('/')).toBe('/(app)/')
  })

  it('pathToExpoHref preserva query string', () => {
    expect(pathToExpoHref('/configuracoes?googleCalendar=connected')).toBe(
      '/(app)/configuracoes?googleCalendar=connected',
    )
  })

  it('isAuthPublicPath identifica rotas públicas', () => {
    expect(isAuthPublicPath('/login')).toBe(true)
    expect(isAuthPublicPath('/configuracoes')).toBe(false)
  })
})
