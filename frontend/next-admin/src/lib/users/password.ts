export const PASSWORD_RULES = 'A senha precisa ter de 8 a 72 caracteres, com pelo menos 1 letra e 1 número.';

export function passwordProblem(value: string): string | null {
  if (value.length < 8 || value.length > 72 || !/[A-Za-z]/.test(value) || !/\d/.test(value)) {
    return PASSWORD_RULES;
  }
  return null;
}