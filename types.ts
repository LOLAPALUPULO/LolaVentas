export enum UserRole {
  Admin = 'admin',
  Sales = 'sales',
}

// Define a minimal interface for Firebase's Timestamp to provide type safety
// given that Firebase is loaded via CDN and its types are not imported directly.
export interface FirebaseTimestamp {
  toDate(): Date;
  seconds: number;
  nanoseconds: number;
}

export interface Fair {
  id: string;
  name: string;
  startDate: string; // ISO date string 'YYYY-MM-DD'
  endDate: string;   // ISO date string 'YYYY-MM-DD'
  pintaValue: number;
  literValue: number;
  isActive: boolean;
}

export enum UnitType {
  Pinta = 'Pinta',
  Litro = 'Litro',
}

export enum PaymentType {
  Digital = 'Digital',
  Billete = 'Billete',
}

export interface Sale {
  id?: string; // Optional for new sales before saving
  fairId: string;
  // Use the custom FirebaseTimestamp interface
  saleDate: FirebaseTimestamp;
  unitType: UnitType;
  quantity: number;
  totalAmount: number;
  paymentType: PaymentType;
  userName: string;
}