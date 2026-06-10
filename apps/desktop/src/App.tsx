import { Outlet } from 'react-router';
import { SidebarProvider } from '@repo/ui/primitives/sidebar';
import { Toaster } from '@repo/ui/primitives/toaster';
import { AppSidebar } from './components/AppSidebar';

function App() {
  return (
    <div className='flex h-screen flex-col bg-background'>
      <div className='header h-[35px] w-screen shrink-0 border-b border-sidebar-border bg-sidebar/95' />
      <SidebarProvider
        style={
          {
            '--sidebar-width': '240px',
          } as React.CSSProperties
        }
      >
        <div className='app min-h-0 flex-1'>
          <AppSidebar />
          <div className='flex-1 overflow-auto bg-background'>
            <Outlet />
          </div>
        </div>
      </SidebarProvider>
      <Toaster />
    </div>
  );
}

export default App;
