import { Outlet } from 'react-router';
import { AppSidebar } from './components/AppSidebar';
import { SidebarProvider } from './components/ui/sidebar';
import { Toaster } from './components/ui/toaster';

export interface Password {
  id: number;
  title: string;
  username: string;
  password: string;
  url: string;
  notes: string;
  category: string;
  favorite: number;
  icon?: string;
  created_at: string;
  updated_at: string;
}

function App() {
  return (
    <div className='h-screen'>
      <div className='h-[25px] w-screen header' />
      <SidebarProvider
        style={
          {
            '--sidebar-width': '350px',
          } as React.CSSProperties
        }
      >
        <div className='app'>
          <AppSidebar />
          <div className='flex-1 overflow-auto p-4'>
            <Outlet />
          </div>
        </div>
      </SidebarProvider>
      <Toaster />
    </div>
  );
}

export default App;
