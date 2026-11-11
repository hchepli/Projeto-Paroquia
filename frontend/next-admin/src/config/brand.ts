// src/config/brand.ts
// Identidade da paróquia. É o ÚNICO lugar com nome/logo — os componentes de layout só recebem por props.
import logoIgreja from '@/assets/img/logo/logo-igreja.svg';

export const BRAND = {
  name: 'Paróquia Divino\nEspírito Santo', // "\n" quebra a linha na Sidebar
  logo: logoIgreja,
  logoAlt: 'Logo da Paróquia Divino Espírito Santo',
} as const;

export const APP_META = {
  title: 'Portal Paroquial',
  description: 'Painel administrativo da Paróquia Divino Espírito Santo',
} as const;
