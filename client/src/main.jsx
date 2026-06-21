import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AppRoutes from './routes/AppRoutes';
import { useThemeStore } from './store/themeStore';
import { useAuthStore } from './store/authStore';
import axiosInstance from './utils/axios';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  const initTheme = useThemeStore((state) => state.initTheme);
  const setSession = useAuthStore((state) => state.setSession);
  const setLoading = useAuthStore((state) => state.setLoading);

  // Initialize theme and attempt silent session refresh on load
  useEffect(() => {
    initTheme();
    
    const restoreSession = async () => {
      try {
        const res = await axiosInstance.post('/auth/refresh');
        const { accessToken, user } = res.data.data;
        setSession(accessToken, user);
      } catch (err) {
        // No active session cookie, redirect to login (handled in route guards)
        setLoading(false);
      }
    };
    
    restoreSession();
  }, [initTheme, setSession, setLoading]);

  return <AppRoutes />;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
