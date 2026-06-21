'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    // We check auth but we don't block the initial render of the Shell structure
    if (!isLoading && !isAuthenticated) {
      const redirect = typeof window !== 'undefined' ? window.location.pathname : '/admin';
      router.push(`/auth/login?redirect=${encodeURIComponent(redirect)}`);
    } else if (!isLoading && isAuthenticated && user?.role !== 'ADMIN') {
      router.push('/');
    }
  }, [isLoading, isAuthenticated, user, router]);

  // Close sidebar when navigating on mobile
  const handleNavClick = () => {
    setSidebarOpen(false);
  };

  // The structure is rendered immediately. Only the children (content) might wait for auth if needed.
  // But for the best UX, we show the sidebar and header right away.
  
  return (
    <div className="min-h-screen bg-[#f4f4f5]">
      {/* Sidebar overlay backdrop (mobile only) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden animate-fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Always rendered for SSR feel */}
      <AdminSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNavClick={handleNavClick}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
      />

      {/* Main content area */}
      <div className={`min-h-screen flex flex-col transition-all duration-300 ${sidebarCollapsed ? 'md:ml-[68px]' : 'md:ml-[260px]'}`}>
        <AdminHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 md:p-6">
          {/* Only show content if authenticated and admin, or if still loading show a skeleton */}
          {(!isLoading && isAuthenticated && user?.role === 'ADMIN') ? (
            <div className="animate-fade-in">
              {children}
            </div>
          ) : (
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-zinc-200 rounded-2xl w-1/4" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="h-32 bg-zinc-200 rounded-3xl" />
                <div className="h-32 bg-zinc-200 rounded-3xl" />
                <div className="h-32 bg-zinc-200 rounded-3xl" />
              </div>
              <div className="h-96 bg-zinc-200 rounded-[32px]" />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
