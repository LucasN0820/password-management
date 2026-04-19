import { Outlet } from 'react-router';
import { AppSidebar } from './components/AppSidebar';
import { SidebarProvider } from '@repo/ui/primitives/sidebar';
import { Toaster } from '@repo/ui/primitives/toaster';

function App() {
  return (
    <div className='flex h-screen flex-col'>
      <div className='header h-[35px] w-screen shrink-0 border-b border-border bg-sidebar/90 backdrop-blur-sm' />
      <SidebarProvider
        style={
          {
            '--sidebar-width': '240px',
          } as React.CSSProperties
        }
      >
        <div className='app flex-1 min-h-0'>
          <AppSidebar />
          <div className='flex-1 overflow-auto'>
            <Outlet />
          </div>
        </div>
      </SidebarProvider>
      <Toaster />
    </div>
  );
}

export default App;
