import { Outlet } from 'react-router';
import { AppSidebar } from './components/AppSidebar';
import { SidebarProvider } from '@repo/ui/primitives/sidebar';
import { Toaster } from '@repo/ui/primitives/toaster';

function App() {
  return (
    <div className='h-screen'>
      <div className='h-[25px] w-screen header' />
      <SidebarProvider
        style={
          {
            '--sidebar-width': '240px',
          } as React.CSSProperties
        }
      >
        <div className='app'>
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
