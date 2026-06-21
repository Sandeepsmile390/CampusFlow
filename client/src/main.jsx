import React, { useEffect, useRef } from 'react';
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
  const initTheme   = useThemeStore((state) => state.initTheme);
  const setSession  = useAuthStore((state) => state.setSession);
  const setLoading  = useAuthStore((state) => state.setLoading);
  const hasRun      = useRef(false); // ref-based guard — survives StrictMode double-mount

  useEffect(() => {
    initTheme();

    // Prevent duplicate restore calls (StrictMode mounts twice in dev)
    if (hasRun.current) return;
    hasRun.current = true;

    const restoreSession = async () => {
      try {
        const res = await axiosInstance.post('/auth/refresh');
        const { accessToken, user } = res.data.data;
        setSession(accessToken, user); // also sets isLoading: false inside authStore
      } catch {
        // No valid session — signal guards to stop waiting and show login
        setLoading(false);
      }
    };

    restoreSession();
  }, []); // empty deps — run once on mount only

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
