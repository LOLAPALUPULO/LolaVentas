import { Timestamp } from 'firebase/firestore'; // Import Timestamp type

/**
 * Represents the different user levels in the application.
 */
export enum UserLevel {
  ADMIN = 'admin',
  VENTA = 'venta',
}

/**
 * Represents the configuration data for a feria (event).
 */
export interface FeriaConfig {
  id?: string; // Optional ID for Firestore document
  nombreFeria: string;
  fechaInicio: string; // Stored as YYYY-MM-DD for forms
  fechaFin: string;   // Stored as YYYY-MM-DD for forms
  valorPinta: number;
  valorLitro: number;
}

/**
 * Represents the type of unit sold.
 */
export enum ProductType {
  PINTA = 'Pinta',
  LITRO = 'Litro',
}

/**
 * Represents the payment method used for a sale.
 */
export enum PaymentType {
  DIGITAL = 'Digital',
  BILLETA = 'Billete',
}

/**
 * Represents a single sales transaction.
 */
export interface SaleTransaction {
  id?: string; // Optional ID for Firestore document
  fechaVenta: Timestamp; // Using Firebase Timestamp for accurate date/time
  tipoUnidad: ProductType;
  cantidadUnidades: number;
  montoTotal: number;
  tipoPago: PaymentType;
  usuarioVenta: string; // e.g., 'lol'
}

/**
 * Interface for the report data.
 */
export interface SalesReport {
  totalPintas: number;
  totalLitros: number;
  montoTotalGeneral: number;
  montoTotalDigital: number;
  montoTotalBillete: number;
}
