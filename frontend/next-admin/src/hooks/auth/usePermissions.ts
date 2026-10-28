// src/hooks/auth/usePermissions.ts
import { useCurrentUser } from '@/hooks/auth/useCurrentUser';

function normalize(value: string | undefined): string {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

/**
 * Permissões de UI derivadas do cargo. O back continua sendo a barreira real
 * (403); aqui só escondemos o que o usuário não pode fazer.
 * Admin Geral e Secretaria gerenciam Missas e Templates (RN005).
 */
export function usePermissions() {
  const { data: user, isLoading } = useCurrentUser();
  const role = normalize(user?.role?.name);

  const isAdmin = role.includes('admin');
  const isSecretary = role.includes('secretaria') || role.includes('secretary');
  const canManage = isAdmin || isSecretary;
  return {
    isLoading,
    user: user ?? null,
    canManageMasses: canManage,
    // Eventos e Confirmações de Presença: Admin Geral e Secretaria (Coordenador = leitura).
    canManageEvents: canManage,
    canManageSacraments: canManage,
    canManageAnnouncements: canManage,
  };
}
