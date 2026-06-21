import { AdminShell } from '@/components/admin/AdminShell';
import { AdminProviders } from '@/components/admin/AdminProviders';

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminProviders>
      <AdminShell>{children}</AdminShell>
    </AdminProviders>
  );
}
