import { isValidContact, normalizeContact } from './contact.util';

describe('contact.util', () => {
  describe('normalizeContact', () => {
    it('e-mail: trim + lowercase', () => {
      expect(normalizeContact('  Joao@Example.COM ')).toBe('joao@example.com');
    });
    it('telefone: só dígitos', () => {
      expect(normalizeContact('(47) 99999-0000')).toBe('47999990000');
    });
    it('telefone com DDI 55 perde o DDI', () => {
      expect(normalizeContact('+55 47 99999-0000')).toBe('47999990000');
    });
    it('DDD 55 (RS) com 11 dígitos NÃO perde nada', () => {
      expect(normalizeContact('55 99999-0000')).toBe('55999990000');
    });
    it('texto com letras volta intacto (o validador recusa)', () => {
      expect(normalizeContact('abc 123')).toBe('abc 123');
    });
  });

  describe('isValidContact', () => {
    it.each([['a@b.com'], ['47999990000'], ['4733334444']])(
      'aceita %s',
      (v) => {
        expect(isValidContact(v)).toBe(true);
      },
    );
    it.each([['abc'], ['123'], ['479999900001234'], ['a@'], ['']])(
      'recusa "%s"',
      (v) => {
        expect(isValidContact(v)).toBe(false);
      },
    );
  });
});
