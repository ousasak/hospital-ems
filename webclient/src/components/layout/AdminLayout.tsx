import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useThemeStore } from '../../stores/themeStore';
import { cn } from '@/utils';

export const AdminLayout: React.FC = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { sidebarCollapsed } = useThemeStore();

  return (
    <div
      data-slot="app-shell"
      className="min-h-screen bg-background font-sans text-foreground antialiased selection:bg-[#bbf451]/30 selection:text-foreground"
    >
      {/* Mobile Backdrop Overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-xs transition-opacity lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* SmartHR FSM Replicated Sidebar */}
      <Sidebar
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />

      {/* Main Container */}
      <div
        className={cn(
          'flex min-h-screen flex-1 flex-col transition-all duration-300 ease-in-out ml-0',
          sidebarCollapsed ? 'lg:ml-[68px]' : 'lg:ml-[260px]'
        )}
      >
        <Header onToggleSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)} />

        <main className="flex-1 bg-slate-50/60 dark:bg-slate-950/40 px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
          <div className="mx-auto w-full max-w-[1600px] space-y-5 lg:space-y-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export const AppLayout = AdminLayout;
export default AdminLayout;
