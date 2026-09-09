import { initializeApp, getApps, deleteApp, FirebaseApp } from 'firebase/app';
import {
  initializeFirestore,
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
  setLogLevel,
} from 'firebase/firestore';
import firebaseConfigData from '../../firebase-applet-config.json';

// Silence benign connection retry warnings in console
setLogLevel('error');

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

// Factory to initialize Firestore with robust transport settings
export function initFirestoreInstance(targetApp: FirebaseApp, databaseId?: string): Firestore {
  const dbId = databaseId && databaseId !== '(default)' ? databaseId : undefined;
  try {
    // experimentalForceLongPolling avoids WebChannel streaming drops in iframe sandboxes
    return initializeFirestore(
      targetApp,
      {
        experimentalForceLongPolling: true,
      },
      dbId
    );
  } catch (err) {
    // If already initialized for this app, retrieve instance
    return dbId ? getFirestore(targetApp, dbId) : getFirestore(targetApp);
  }
}

// Initialize or get Firestore
export let db: Firestore = initFirestoreInstance(app, firebaseConfig.firestoreDatabaseId);

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
    db = initFirestoreInstance(app, newConfig.firestoreDatabaseId);

    const isConnected = await testFirestoreConnection();
    if (isConnected) {
      updateFirebaseStatus('connected', `Conectado exitosamente al proyecto ${newConfig.projectId}`);
    }
    return isConnected;
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
    const testDocRef = doc(db, 'test', 'connection');
    await getDocFromServer(testDocRef);
    updateFirebaseStatus('connected', `En línea con Firestore (${firebaseConfig.projectId})`);
    return true;
  } catch (error: any) {
    const isOffline =
      (error instanceof Error && error.message.includes('the client is offline')) ||
      error?.code === 'unavailable';

    if (isOffline) {
      console.warn('Firebase en modo offline o esperando backend:', error?.message || error);
      updateFirebaseStatus('offline', 'Modo offline: Los datos se conservan localmente');
      return false;
    }
    // Any other response (such as document not found) confirms the server was reached successfully
    updateFirebaseStatus('connected', `En línea con Firestore (${firebaseConfig.projectId})`);
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
  } catch (err: any) {
    console.warn(`Aviso al guardar en Firestore [${collectionName}/${docId}]:`, err?.message || err);
    if (err?.code === 'unavailable') {
      updateFirebaseStatus('offline', 'Guardado localmente. Se sincronizará al reconectar.');
    } else {
      updateFirebaseStatus('error', `Error al guardar en tabla ${collectionName}`);
    }
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
  } catch (err: any) {
    console.warn(`Aviso al eliminar en Firestore [${collectionName}/${docId}]:`, err?.message || err);
    if (err?.code === 'unavailable') {
      updateFirebaseStatus('offline', 'Eliminado localmente. Se sincronizará al reconectar.');
    } else {
      updateFirebaseStatus('error', `Error al eliminar en ${collectionName}`);
    }
  }
}

// Helper to load collection documents
export async function fetchCollection<T>(collectionName: string): Promise<T[]> {
  try {
    const colRef = collection(db, collectionName);
    const snapshot = await getDocs(colRef);
    const items: T[] = [];
    snapshot.forEach((d) => {
      const data = d.data();
      items.push({ ...data, id: data.id !== undefined ? data.id : (Number(d.id) || d.id) } as T);
    });
    items.sort((a: any, b: any) => (Number(a.id) || 0) - (Number(b.id) || 0));
    return items;
  } catch (err: any) {
    console.warn(`Aviso al obtener colección [${collectionName}]:`, err?.message || err);
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
  } catch (err: any) {
    console.warn(`Aviso al guardar lote en [${collectionName}]:`, err?.message || err);
    if (err?.code === 'unavailable') {
      updateFirebaseStatus('offline', 'Lote registrado localmente.');
    }
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
        const data = d.data();
        list.push({ ...data, id: data.id !== undefined ? data.id : (Number(d.id) || d.id) } as T);
      });
      list.sort((a: any, b: any) => (Number(a.id) || 0) - (Number(b.id) || 0));
      onData(list);
    },
    (err) => {
      console.warn(`Aviso en tiempo real para ${collectionName}:`, err?.message || err);
    }
  );
}
