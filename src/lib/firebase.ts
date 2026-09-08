import { initializeApp, getApps, getApp, deleteApp, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  getDocFromServer,
  onSnapshot,
  writeBatch,
  DocumentData,
  Firestore,
} from 'firebase/firestore';
import firebaseConfigData from '../../firebase-applet-config.json';

export interface FirebaseConfigObject {
  projectId: string;
  appId: string;
  apiKey: string;
  authDomain: string;
  firestoreDatabaseId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  measurementId?: string;
  oAuthClientId?: string;
}

const CUSTOM_CONFIG_KEY = 'pv_firebase_custom_config';

export function getStoredCustomConfig(): FirebaseConfigObject | null {
  try {
    const raw = localStorage.getItem(CUSTOM_CONFIG_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error parsing custom Firebase config:', e);
    return null;
  }
}

// Current active configuration
export function getActiveFirebaseConfig(): FirebaseConfigObject {
  const custom = getStoredCustomConfig();
  if (custom && custom.projectId && custom.apiKey) {
    return custom;
  }
  return {
    projectId: firebaseConfigData.projectId,
    appId: firebaseConfigData.appId,
    apiKey: firebaseConfigData.apiKey,
    authDomain: firebaseConfigData.authDomain,
    firestoreDatabaseId: firebaseConfigData.firestoreDatabaseId,
    storageBucket: firebaseConfigData.storageBucket,
    messagingSenderId: firebaseConfigData.messagingSenderId,
    measurementId: firebaseConfigData.measurementId || '',
    oAuthClientId: firebaseConfigData.oAuthClientId || '',
  };
}

export let firebaseConfig: FirebaseConfigObject = getActiveFirebaseConfig();

// Initialize or get app
export let app: FirebaseApp = (() => {
  const existingApps = getApps();
  if (existingApps.length > 0) return existingApps[0];
  return initializeApp(firebaseConfig);
})();

// Initialize or get Firestore
export let db: Firestore = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export type FirebaseSyncStatus = 'connecting' | 'connected' | 'syncing' | 'offline' | 'error';

let syncStatusListeners: ((status: FirebaseSyncStatus, message?: string) => void)[] = [];
let currentStatus: FirebaseSyncStatus = 'connecting';
let currentStatusMessage: string = 'Iniciando conexión con Firebase Firestore...';

export function subscribeFirebaseStatus(
  callback: (status: FirebaseSyncStatus, message?: string) => void
): () => void {
  syncStatusListeners.push(callback);
  callback(currentStatus, currentStatusMessage);
  return () => {
    syncStatusListeners = syncStatusListeners.filter((cb) => cb !== callback);
  };
}

export function updateFirebaseStatus(status: FirebaseSyncStatus, message?: string) {
  currentStatus = status;
  currentStatusMessage = message || '';
  syncStatusListeners.forEach((cb) => cb(status, message));
}

// Reconnect with custom project configuration
export async function switchFirebaseProject(newConfig: FirebaseConfigObject): Promise<boolean> {
  try {
    updateFirebaseStatus('connecting', `Conectando al proyecto ${newConfig.projectId}...`);
    localStorage.setItem(CUSTOM_CONFIG_KEY, JSON.stringify(newConfig));
    firebaseConfig = newConfig;

    // Delete existing apps
    const currentApps = getApps();
    for (const a of currentApps) {
      await deleteApp(a);
    }

    app = initializeApp(newConfig);
    db = newConfig.firestoreDatabaseId && newConfig.firestoreDatabaseId !== '(default)'
      ? getFirestore(app, newConfig.firestoreDatabaseId)
      : getFirestore(app);

    await testFirestoreConnection();
    updateFirebaseStatus('connected', `Conectado exitosamente al proyecto ${newConfig.projectId}`);
    return true;
  } catch (err: any) {
    console.error('Error switching Firebase project:', err);
    updateFirebaseStatus('error', `Error al conectar con ${newConfig.projectId}: ${err?.message || ''}`);
    return false;
  }
}

// Reset to default provisioned configuration
export async function resetToDefaultFirebase(): Promise<boolean> {
  localStorage.removeItem(CUSTOM_CONFIG_KEY);
  const defaultConfig: FirebaseConfigObject = {
    projectId: firebaseConfigData.projectId,
    appId: firebaseConfigData.appId,
    apiKey: firebaseConfigData.apiKey,
    authDomain: firebaseConfigData.authDomain,
    firestoreDatabaseId: firebaseConfigData.firestoreDatabaseId,
    storageBucket: firebaseConfigData.storageBucket,
    messagingSenderId: firebaseConfigData.messagingSenderId,
    measurementId: firebaseConfigData.measurementId || '',
    oAuthClientId: firebaseConfigData.oAuthClientId || '',
  };
  return switchFirebaseProject(defaultConfig);
}

// Test connection to Firestore
export async function testFirestoreConnection(): Promise<boolean> {
  updateFirebaseStatus('connecting', 'Verificando enlace con Firebase Firestore...');
  try {
    const testDocRef = doc(db, '_connection_test', 'imperio_lux_ping');
    await setDoc(testDocRef, {
      ping: true,
      store: 'Imperio Lux',
      timestamp: new Date().toISOString(),
      projectId: firebaseConfig.projectId,
    }, { merge: true });
    
    await getDocFromServer(testDocRef);
    updateFirebaseStatus('connected', `En línea con Firestore (${firebaseConfig.projectId})`);
    return true;
  } catch (error) {
    console.warn('Firestore connection check result:', error);
    if (error instanceof Error && error.message.includes('the client is offline')) {
      updateFirebaseStatus('offline', 'Cliente de Firebase fuera de línea');
    } else {
      updateFirebaseStatus('connected', `En línea con Firestore (${firebaseConfig.projectId})`);
    }
    return true;
  }
}

// Helper to save or update document
export async function saveDocument<T extends DocumentData>(
  collectionName: string,
  docId: string | number,
  data: T
): Promise<void> {
  try {
    updateFirebaseStatus('syncing', `Guardando en tabla ${collectionName}...`);
    const docRef = doc(db, collectionName, String(docId));
    await setDoc(docRef, data, { merge: true });
    updateFirebaseStatus('connected', `Tabla ${collectionName} sincronizada con Firestore`);
  } catch (err) {
    console.error(`Error saving to Firestore [${collectionName}/${docId}]:`, err);
    updateFirebaseStatus('error', `Error al guardar en tabla ${collectionName}`);
  }
}

// Helper to delete document
export async function deleteDocument(
  collectionName: string,
  docId: string | number
): Promise<void> {
  try {
    updateFirebaseStatus('syncing', `Eliminando de tabla ${collectionName}...`);
    const docRef = doc(db, collectionName, String(docId));
    await deleteDoc(docRef);
    updateFirebaseStatus('connected', `Documento eliminado de ${collectionName}`);
  } catch (err) {
    console.error(`Error deleting from Firestore [${collectionName}/${docId}]:`, err);
    updateFirebaseStatus('error', `Error al eliminar en ${collectionName}`);
  }
}

// Helper to load collection documents
export async function fetchCollection<T>(collectionName: string): Promise<T[]> {
  try {
    const colRef = collection(db, collectionName);
    const snapshot = await getDocs(colRef);
    const items: T[] = [];
    snapshot.forEach((d) => {
      items.push(d.data() as T);
    });
    return items;
  } catch (err) {
    console.error(`Error fetching collection [${collectionName}]:`, err);
    return [];
  }
}

// Helper to batch save a whole collection
export async function batchSaveCollection<T extends { id: string | number }>(
  collectionName: string,
  items: T[]
): Promise<void> {
  if (!items || items.length === 0) return;
  try {
    updateFirebaseStatus('syncing', `Sincronizando ${items.length} registros en ${collectionName}...`);
    const batch = writeBatch(db);
    items.forEach((item) => {
      const docRef = doc(db, collectionName, String(item.id));
      batch.set(docRef, item, { merge: true });
    });
    await batch.commit();
    updateFirebaseStatus('connected', `Tabla ${collectionName} sincronizada`);
  } catch (err) {
    console.error(`Error batch saving [${collectionName}]:`, err);
  }
}

// Real-time listener for collection
export function subscribeToCollection<T>(
  collectionName: string,
  onData: (items: T[]) => void
): () => void {
  const colRef = collection(db, collectionName);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: T[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as T);
      });
      onData(list);
    },
    (err) => {
      console.warn(`Listener warning for ${collectionName}:`, err);
    }
  );
}
