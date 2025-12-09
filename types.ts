export enum UserRole {
  Admin = 'admin',
  Seller = 'seller',
}

export interface Fair {
  id?: string;
  nameFeria: string;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  pintaPrice: number;
  literPrice: number;
  isActive: boolean;
  closedDate?: string;
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
  id?: string;
  fairId: string;
  saleDate: string; // ISO date string
  unitType: UnitType;
  quantityUnits: number;
  totalAmount: number;
  paymentType: PaymentType;
  sellerUser: string;
}

export interface ReportSummary {
  totalPintas: number;
  totalLitros: number;
  totalRevenue: number;
  digitalRevenue: number;
  billeteRevenue: number;
  pintaPrice: number;
  literPrice: number;
}
