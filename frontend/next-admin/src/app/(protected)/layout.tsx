import Sidebar from '@/components/layout/Sidebar';
import Container from '@/components/layout/Container';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />

      <Container style={{ width: '100%' }}>
        <main style={{ flex: 1 }}>{children}</main>
      </Container>
    </div>
  );
}
