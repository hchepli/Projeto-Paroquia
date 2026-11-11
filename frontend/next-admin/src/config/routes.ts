// src/config/routes.ts
// Fonte única das rotas do admin (front) e das rotas internas de API (Route Handlers).
// Obs.: o back (nest-api) NÃO muda de nome; só o front usa "avisos", "albuns", etc.

export const ROUTES = {
  login: '/login',
  inicio: '/inicio', // hoje ainda é /painel até a Fase 2 migrar a página
  calendario: '/calendario',
  missas: '/missas',
  escalas: '/escalas',
  eventos: '/eventos',
  sacramentos: '/sacramentos',
  avisos: '/avisos',
  albuns: '/albuns',
  pessoas: '/pessoas',
  pastorais: '/pastorais',
  configuracoes: '/configuracoes',
} as const;

export const API_ROUTES = {
  me: '/api/auth/me',
  logout: '/api/auth/logout',
} as const;
