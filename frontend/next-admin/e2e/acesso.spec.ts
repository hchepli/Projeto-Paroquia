import { expect, test } from '@playwright/test';
import { USERS, login } from './helpers';

test('sem login, qualquer rota leva ao /login', async ({ page }) => {
  await page.goto('/missas');
  await expect(page).toHaveURL(/\/login/);
});

test('Admin Geral entra e vê Pessoas no menu', async ({ page }) => {
  await login(page, USERS.admin);
  await expect(page.getByRole('link', { name: /pessoas/i }).first()).toBeVisible();
});

test('Coordenador não tem acesso à área de Usuários', async ({ page }) => {
  await login(page, USERS.coordenador);
  await expect(page.getByRole('link', { name: /usu[aá]rios/i })).toHaveCount(0);

  await page.goto('/pessoas/usuarios');
  // Fica na rota, mas só mostra o aviso: nada da tela de gestão aparece.
  await expect(page.getByText('Só quem tem acesso total pode ver os usuários.')).toBeVisible();
  await expect(page.getByText('Cadastrar usuário')).toHaveCount(0);
});