import { Fair, Sale, UnitType, PaymentType } from '../types';
import { FIRESTORE_COLLECTIONS } from '../constants';

// Declare firebase globally as it's loaded via CDN script
declare const firebase: any;

// Initialize Firebase (replace with your project's config)
const firebaseConfig = {
  projectId: 'lolaventas-5a9fa',
};

// Check if Firebase is already initialized
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const db = firebase.firestore();

// Fix: Update the type of fairData to correctly indicate that 'isActive' is not
// expected in the input, as it's set within the function.
export const addFair = async (fairData: Omit<Fair, 'id' | 'isActive'>): Promise<Fair> => {
  // First, deactivate any existing active fair
  const activeFairQuery = await db.collection(FIRESTORE_COLLECTIONS.FAIRS).where('isActive', '==', true).get();
  const batch = db.batch();
  activeFairQuery.forEach((doc: any) => {
    batch.update(doc.ref, { isActive: false });
  });

  // Add the new fair as active
  const docRef = db.collection(FIRESTORE_COLLECTIONS.FAIRS).doc();
  const newFair: Fair = { ...fairData, id: docRef.id, isActive: true };
  batch.set(docRef, newFair);
  await batch.commit();
  return newFair;
};

export const updateFair = async (fairId: string, updates: Partial<Fair>): Promise<void> => {
  await db.collection(FIRESTORE_COLLECTIONS.FAIRS).doc(fairId).update(updates);
};

export const getFairById = async (fairId: string): Promise<Fair | null> => {
  const doc = await db.collection(FIRESTORE_COLLECTIONS.FAIRS).doc(fairId).get();
  if (doc.exists) {
    return { id: doc.id, ...doc.data() } as Fair;
  }
  return null;
};

export const getActiveFair = async (): Promise<Fair | null> => {
  const snapshot = await db.collection(FIRESTORE_COLLECTIONS.FAIRS).where('isActive', '==', true).limit(1).get();
  if (!snapshot.empty) {
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Fair;
  }
  return null;
};

export const getFairs = async (): Promise<Fair[]> => {
  const snapshot = await db.collection(FIRESTORE_COLLECTIONS.FAIRS).orderBy('startDate', 'desc').get();
  return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })) as Fair[];
};

export const addSale = async (saleData: Omit<Sale, 'id'>): Promise<Sale> => {
  const docRef = await db.collection(FIRESTORE_COLLECTIONS.SALES).add({
    ...saleData,
    saleDate: firebase.firestore.FieldValue.serverTimestamp(), // Use server timestamp
  });
  const doc = await docRef.get(); // Fetch the created document to get the actual timestamp
  return { id: doc.id, ...doc.data() } as Sale;
};


export const getSalesForFair = async (fairId: string): Promise<Sale[]> => {
  const snapshot = await db.collection(FIRESTORE_COLLECTIONS.SALES)
    .where('fairId', '==', fairId)
    .orderBy('saleDate', 'desc')
    .get();
  return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })) as Sale[];
};

export const closeFairSales = async (fairId: string): Promise<void> => {
    await db.collection(FIRESTORE_COLLECTIONS.FAIRS).doc(fairId).update({ isActive: false });
};