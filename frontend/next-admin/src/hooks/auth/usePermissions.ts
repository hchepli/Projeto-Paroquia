import { useCurrentUser } from '@/hooks/auth/useCurrentUser';

function normalize(value: string | undefined): string {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

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
    canManageEvents: canManage,
    canManageSacraments: canManage,
    canManageAnnouncements: canManage,
    canManageAlbums: canManage,
    // Últimas alterações e Configurações: só Admin Geral.
    canViewAuditLogs: canManage,
    canViewSettings: isAdmin,
  };
}