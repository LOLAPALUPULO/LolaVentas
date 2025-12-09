import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import { FIREBASE_CONFIG, COLLECTIONS } from '../constants';
import { FeriaConfig, SaleTransaction, SalesReport, ProductType, PaymentType, UserLevel } from '../types';

// Initialize Firebase only once
if (!firebase.apps.length) {
  firebase.initializeApp(FIREBASE_CONFIG);
}

const db = firebase.firestore();

/**
 * Saves or updates the feria configuration.
 * @param config The FeriaConfig object to save.
 * @returns The saved FeriaConfig with its ID.
 */
export const saveFeriaConfig = async (config: FeriaConfig): Promise<FeriaConfig> => {
  const configRef = db.collection(COLLECTIONS.FERIA_CONFIG).doc('currentFeria');
  await configRef.set(config);
  return { ...config, id: 'currentFeria' };
};

/**
 * Fetches the current feria configuration.
 * @returns The current FeriaConfig or null if not found.
 */
export const getFeriaConfig = async (): Promise<FeriaConfig | null> => {
  const doc = await db.collection(COLLECTIONS.FERIA_CONFIG).doc('currentFeria').get();
  if (doc.exists) {
    return { ...doc.data() as FeriaConfig, id: doc.id };
  }
  return null;
};

/**
 * Deletes the current feria configuration.
 */
export const deleteFeriaConfig = async (): Promise<void> => {
  await db.collection(COLLECTIONS.FERIA_CONFIG).doc('currentFeria').delete();
};

/**
 * Saves a new sales transaction.
 * @param sale The SaleTransaction object to save.
 */
export const saveSale = async (sale: SaleTransaction): Promise<void> => {
  await db.collection(COLLECTIONS.SALES).add(sale);
};

/**
 * Fetches all sales transactions.
 * @returns An array of SaleTransaction objects.
 */
export const getAllSales = async (): Promise<SaleTransaction[]> => {
  const snapshot = await db.collection(COLLECTIONS.SALES).orderBy('fechaVenta', 'asc').get();
  return snapshot.docs.map(doc => ({
    ...doc.data() as Omit<SaleTransaction, 'fechaVenta'>,
    id: doc.id,
    fechaVenta: doc.data().fechaVenta as firebase.firestore.Timestamp, // Ensure Timestamp type
  }));
};

/**
 * Clears all sales data from the database.
 */
export const clearAllSales = async (): Promise<void> => {
  const snapshot = await db.collection(COLLECTIONS.SALES).get();
  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  await batch.commit();
};

/**
 * Calculates a detailed sales report from a list of transactions.
 * @param sales An array of SaleTransaction objects.
 * @returns A SalesReport object.
 */
export const calculateSalesReport = (sales: SaleTransaction[]): SalesReport => {
  let totalPintas = 0;
  let totalLitros = 0;
  let montoTotalGeneral = 0;
  let montoTotalDigital = 0;
  let montoTotalBillete = 0;

  for (const sale of sales) {
    if (sale.tipoUnidad === ProductType.PINTA) {
      totalPintas += sale.cantidadUnidades;
    } else if (sale.tipoUnidad === ProductType.LITRO) {
      totalLitros += sale.cantidadUnidades;
    }
    montoTotalGeneral += sale.montoTotal;

    if (sale.tipoPago === PaymentType.DIGITAL) {
      montoTotalDigital += sale.montoTotal;
    } else if (sale.tipoPago === PaymentType.BILLETA) {
      montoTotalBillete += sale.montoTotal;
    }
  }

  return {
    totalPintas,
    totalLitros,
    montoTotalGeneral,
    montoTotalDigital,
    montoTotalBillete,
  };
};

/**
 * Converts a string date (YYYY-MM-DD) to a Firebase Timestamp.
 * @param dateString The date string in YYYY-MM-DD format.
 * @returns A Firebase Timestamp object.
 */
export const toTimestamp = (dateString: string): firebase.firestore.Timestamp => {
  const date = new Date(dateString + 'T00:00:00Z'); // Ensure UTC for consistent conversion
  return firebase.firestore.Timestamp.fromDate(date);
};

/**
 * Converts a Firebase Timestamp to a date string (YYYY-MM-DD).
 * @param timestamp The Firebase Timestamp object.
 * @returns A date string in YYYY-MM-DD format.
 */
export const toDateString = (timestamp: firebase.firestore.Timestamp): string => {
  return timestamp.toDate().toISOString().split('T')[0];
};
