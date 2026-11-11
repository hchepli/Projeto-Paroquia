// src/app/(protected)/layout.tsx
import AppSidebar from '@/components/layout/AppSidebar';
import Container from '@/components/layout/Container';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <AppSidebar />

      <Container style={{ width: '100%' }}>
        <main>{children}</main>
      </Container>
    </div>
  );
}
