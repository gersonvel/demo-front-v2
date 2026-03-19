export interface User {
  id: number;
  nombre: string;
  email: string;
}
export interface Category {
  id: number;
  name: string;
  icon?: string | null;
  color?: string | null;
  user?: User | null;
}

export interface Gasto {
  id: number;
  description: string;
  amount: number;
  date: string; // Viene como "YYYY-MM-DD" del backend
  category: Category;
  user: User;
  relatedDebt?: any | null; // Cambiar 'any' por el tipo Deuda si lo tienes
}

export interface AuthContextType {
  user: User | null;
  // Agregamos el tercer parámetro aquí:
  login: (token: string, refreshToken: string, userData: User) => void;
  logout: () => void;
  loading: boolean;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
}

export interface ApiResponse<T = any> {
        status: number;
        error: boolean;
        message: string;
        data: T;
      }

export interface GastosCategoria {
  nombre: string;
  valor: number;
}

export interface DashboardData {
  totalAhorrado: number;
  totalDeuda: number;
  patrimonioNeto: number;
  gastosMesActual: number;
  gastosPorCategoria: GastosCategoria[]; // Ej: { "Comida": 500, "Deuda": 1000 }
}

export interface ResponseDTO<T> {
  status: number;
  error: boolean;
  message: string;
  data: T;
}

export interface Deuda {
  id: number;
  name: string;           // Nombre de la tarjeta o préstamo
  totalAmount: number;    // Monto total original
  balance: number;        // Lo que debes actualmente
  monthlyPayment: number; // El pago mensual sugerido
  dueDateDay: number;     // Día del mes que vence (1-31)
  startDate: string;      // Fecha en formato ISO (YYYY-MM-DD)
  user?: User;         // Relación con el usuario (opcional en el front)
}