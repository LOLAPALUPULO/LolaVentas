import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import { FIREBASE_CONFIG } from '../constants';
import { Fair, Sale } from '../types';

let db: firebase.firestore.Firestore;

export const initializeFirebase = () => {
  if (!firebase.apps.length) {
    firebase.initializeApp(FIREBASE_CONFIG);
    // Enable Firestore offline persistence
    firebase.firestore().enablePersistence()
      .then(() => {
        console.log("Firestore offline persistence enabled.");
      })
      .catch((err) => {
        if (err.code === 'failed-precondition') {
          // Multiple tabs open, persistence can only be enabled in one tab at a time.
          // Or another instance of Firebase is already using persistence.
          console.warn("Firestore persistence could not be enabled: failed-precondition (multiple tabs or another instance).");
        } else if (err.code === 'unimplemented') {
          // The current browser does not support all of the features required to enable persistence.
          console.warn("Firestore persistence could not be enabled: unimplemented (browser support).");
        } else {
          console.error("Error enabling Firestore persistence:", err);
        }
      });
  }
  db = firebase.firestore();
};

export const getDb = () => {
  if (!db) {
    throw new Error('Firebase not initialized. Call initializeFirebase() first.');
  }
  return db;
};

// Fair operations
export const createFair = async (fair: Omit<Fair, 'id'>): Promise<Fair> => {
  const fairsCollection = db.collection('fairs');
  const docRef = await fairsCollection.add({ ...fair, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
  return { id: docRef.id, ...fair };
};

export const updateFair = async (fairId: string, fairUpdates: Partial<Fair>): Promise<void> => {
  const fairRef = db.collection('fairs').doc(fairId);
  await fairRef.update({ ...fairUpdates, updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
};

export const getFair = async (fairId: string): Promise<Fair | null> => {
  const fairRef = db.collection('fairs').doc(fairId);
  // Get from cache first if offline, then try server
  const doc = await fairRef.get({ source: 'default' }); // 'default' tries server, then cache
  if (doc.exists) {
    return { id: doc.id, ...doc.data() } as Fair;
  }
  return null;
};

export const getActiveFair = async (): Promise<Fair | null> => {
  const fairsCollection = db.collection('fairs');
  // Get from cache first if offline, then try server
  const querySnapshot = await fairsCollection.where('isActive', '==', true).limit(1).get({ source: 'default' });
  if (!querySnapshot.empty) {
    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Fair;
  }
  return null;
};

export const getAllFairs = async (): Promise<Fair[]> => {
  const fairsCollection = db.collection('fairs');
  // Get from cache first if offline, then try server
  const querySnapshot = await fairsCollection.orderBy('startDate', 'desc').get({ source: 'default' });
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Fair));
};


// Sale operations
export const addSale = async (sale: Omit<Sale, 'id'>): Promise<Sale> => {
  const salesCollection = db.collection('sales');
  const docRef = await salesCollection.add({ ...sale, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
  return { id: docRef.id, ...sale };
};

export const getSalesForFair = async (fairId: string): Promise<Sale[]> => {
  const salesCollection = db.collection('sales');
  // Get from cache first if offline, then try server
  const querySnapshot = await salesCollection.where('fairId', '==', fairId).orderBy('saleDate', 'desc').get({ source: 'default' });
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sale));
};