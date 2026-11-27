import { expect, type Page } from '@playwright/test';

export const USERS = {
  admin: 'admin@paroquia.org',
  secretaria: 'secretaria@paroquia.org',
  coordenador: 'coordenador.liturgia@paroquia.org',
} as const;
export const PASSWORD = 'senha12345';

export async function login(page: Page, email: string) {
  await page.goto('/login');
  await page.getByLabel(/e-?mail/i).fill(email);
  await page.getByLabel(/senha/i).fill(PASSWORD);
  await page.getByRole('button', { name: /entrar/i }).click();
  await expect(page).not.toHaveURL(/\/login/);
}