import {
  findBankById,
  findBankByNome,
  filterBanksByQuery,
  resolveLibraryNome,
} from '../bankCatalog'

describe('bankCatalog', () => {
  it('findBankById retorna Nubank', () => {
    expect(findBankById('nubank')?.nome).toBe('Nubank')
  })

  it('findBankByNome ignora acentos e case', () => {
    expect(findBankByNome('itau')?.id).toBe('itau')
    expect(findBankByNome('BANCO DO BRASIL')?.id).toBe('bb')
  })

  it('filterBanksByQuery filtra por keyword', () => {
    const hits = filterBanksByQuery('nu')
    expect(hits.some((b) => b.id === 'nubank')).toBe(true)
  })

  it('resolveLibraryNome mapeia slug da lib bancos-brasil', () => {
    const bb = findBankById('bb')
    expect(resolveLibraryNome(bb)).toBe('bancodobrasil')
  })
})
