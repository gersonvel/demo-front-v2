import axios, { 
  AxiosInstance, 
  InternalAxiosRequestConfig, 
  AxiosError, 
  AxiosResponse 
} from 'axios';

// 1. Definimos una interfaz para extender la configuración interna de Axios
// Esto nos permite añadir la propiedad '_retry' sin que TS se queje.
interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const api: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});

// Interceptor de Petición
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// Interceptor de Respuesta
// Interceptor de Respuesta
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as CustomAxiosRequestConfig;

    // --- CAMBIO AQUÍ ---
    // Si el error es 401 pero la petición fue a /auth/login, NO HACEMOS NADA.
    // Simplemente rechazamos para que el catch del componente LoginPage funcione.
    if (originalRequest?.url?.includes('/auth/login')) {
      return Promise.reject(error);
    }

    // Lógica normal para el resto de la app (Dashboard, Perfil, etc.)
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const rt = localStorage.getItem('refreshToken');
        if (!rt) throw new Error("No hay refresh token");

        const res = await axios.post(
          'http://localhost:8085/api/auth/refresh', 
          { refreshToken: rt },
          { withCredentials: true }
        );

        const { accessToken } = res.data;
        localStorage.setItem('accessToken', accessToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }

        return api(originalRequest);
      } catch (err) {
        localStorage.clear();
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

export default api;