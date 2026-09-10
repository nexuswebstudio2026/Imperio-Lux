import { initializeApp, getApps, deleteApp, FirebaseApp } from 'firebase/app';
import {
  initializeFirestore,
  getFirestore,
  doc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  getDocsFromServer,
  getDocFromServer,
  onSnapshot,
  writeBatch,
  query,
  limit,
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
    if (typeof window === 'undefined' || !window.localStorage) return null;
    const raw = localStorage.getItem(CUSTOM_CONFIG_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
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
    firestoreDatabaseId: (firebaseConfigData as any).firestoreDatabaseId || '(default)',
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

export type FirebaseSyncStatus = 'connecting' | 'connected' | 'syncing' | 'offline' | 'error' | 'disconnected';

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

    const diag = await testFirestoreConfig(newConfig);
    if (diag.success) {
      updateFirebaseStatus('connected', `Conectado exitosamente al proyecto ${newConfig.projectId} (${diag.databaseId})`);
      return true;
    } else {
      if (diag.statusCode === 404) {
        updateFirebaseStatus('disconnected', diag.message);
      } else {
        updateFirebaseStatus('error', diag.message);
      }
      return false;
    }
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
    firestoreDatabaseId: (firebaseConfigData as any).firestoreDatabaseId || '(default)',
    storageBucket: firebaseConfigData.storageBucket,
    messagingSenderId: firebaseConfigData.messagingSenderId,
    measurementId: firebaseConfigData.measurementId || '',
    oAuthClientId: firebaseConfigData.oAuthClientId || '',
  };
  return switchFirebaseProject(defaultConfig);
}

export interface ConnectionDiagnostic {
  success: boolean;
  statusCode: number;
  statusText: string;
  message: string;
  databaseId: string;
  projectId: string;
}

// Diagnostic tester for any Firebase configuration
export async function testFirestoreConfig(targetConfig: FirebaseConfigObject): Promise<ConnectionDiagnostic> {
  const dbId =
    targetConfig.firestoreDatabaseId && targetConfig.firestoreDatabaseId.trim() !== ''
      ? targetConfig.firestoreDatabaseId.trim()
      : '(default)';
  const projectId = (targetConfig.projectId || '').trim();
  const apiKey = (targetConfig.apiKey || '').trim();

  if (!projectId || !apiKey) {
    return {
      success: false,
      statusCode: 0,
      statusText: 'CONFIG_INCOMPLETE',
      message: 'Project ID y API Key son campos obligatorios para conectar a Firebase.',
      databaseId: dbId,
      projectId,
    };
  }

  try {
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${dbId}/documents?key=${apiKey}`;
    const res = await fetch(url);

    if (res.status === 200 || res.status === 403) {
      return {
        success: true,
        statusCode: res.status,
        statusText: res.statusText || 'OK',
        message: `¡Base de datos '${dbId}' activa y lista en el proyecto '${projectId}'!`,
        databaseId: dbId,
        projectId,
      };
    }

    if (res.status === 404) {
      return {
        success: false,
        statusCode: 404,
        statusText: 'NOT_FOUND',
        message: `La base de datos '${dbId}' no existe en el proyecto '${projectId}'. Si creaste la base de datos principal en Firebase Console, escribe '(default)' como Database ID. Si creaste una con nombre personalizado, verifica que el nombre sea exacto.`,
        databaseId: dbId,
        projectId,
      };
    }

    if (res.status === 400) {
      return {
        success: false,
        statusCode: 400,
        statusText: 'BAD_REQUEST',
        message: `API Key inválida o proyecto '${projectId}' no encontrado (HTTP 400). Verifica las credenciales copiadas de Firebase.`,
        databaseId: dbId,
        projectId,
      };
    }

    return {
      success: false,
      statusCode: res.status,
      statusText: res.statusText,
      message: `Respuesta de Google Cloud Firestore: HTTP ${res.status} (${res.statusText || 'Estado no esperado'})`,
      databaseId: dbId,
      projectId,
    };
  } catch (err: any) {
    return {
      success: false,
      statusCode: 0,
      statusText: 'NETWORK_ERROR',
      message: `Error de red al conectar con Google Cloud Firestore: ${err?.message || 'Verifica tu conexión a internet.'}`,
      databaseId: dbId,
      projectId,
    };
  }
}

// Test connection to the currently active Firestore
export async function testFirestoreConnection(): Promise<boolean> {
  updateFirebaseStatus('connecting', 'Verificando enlace con Firebase Firestore...');
  const diag = await testFirestoreConfig(firebaseConfig);
  if (diag.success) {
    updateFirebaseStatus('connected', `En línea con Firestore (${firebaseConfig.projectId} / ${diag.databaseId})`);
    return true;
  }
  if (diag.statusCode === 404) {
    updateFirebaseStatus('disconnected', diag.message);
    return false;
  }
  updateFirebaseStatus('offline', diag.message);
  return false;
}

// Universal parser for Firebase Config: handles raw JSON or JS SDK snippet
export function parseFirebaseConfigSnippet(input: string): { config: Partial<FirebaseConfigObject>; error?: string } {
  const trimmed = input.trim();
  if (!trimmed) {
    return { config: {}, error: 'El texto ingresado está vacío.' };
  }

  // 1. Try standard JSON.parse
  try {
    const parsed = JSON.parse(trimmed);
    if (typeof parsed === 'object' && parsed !== null) {
      return {
        config: {
          projectId: parsed.projectId || parsed.project_id || '',
          apiKey: parsed.apiKey || parsed.api_key || '',
          authDomain: parsed.authDomain || parsed.auth_domain || '',
          firestoreDatabaseId: parsed.firestoreDatabaseId || parsed.databaseId || parsed.database_id || '',
          storageBucket: parsed.storageBucket || parsed.storage_bucket || '',
          messagingSenderId: parsed.messagingSenderId || parsed.messaging_sender_id || '',
          appId: parsed.appId || parsed.app_id || '',
          measurementId: parsed.measurementId || parsed.measurement_id || '',
        },
      };
    }
  } catch {
    // Continue with regex pattern extraction
  }

  // 2. Regex matching for JavaScript object snippet (e.g. const firebaseConfig = { apiKey: "..." })
  const extractField = (keys: string[]): string => {
    for (const key of keys) {
      // Matches key: "value", key: 'value', or "key": "value"
      const regex = new RegExp(`['"]?${key}['"]?\\s*:\\s*['"]([^'"]+)['"]`, 'i');
      const match = trimmed.match(regex);
      if (match && match[1]) return match[1].trim();
    }
    return '';
  };

  const projectId = extractField(['projectId', 'project_id']);
  const apiKey = extractField(['apiKey', 'api_key']);
  const authDomain = extractField(['authDomain', 'auth_domain']);
  const firestoreDatabaseId = extractField(['firestoreDatabaseId', 'databaseId', 'database_id']);
  const storageBucket = extractField(['storageBucket', 'storage_bucket']);
  const messagingSenderId = extractField(['messagingSenderId', 'messaging_sender_id']);
  const appId = extractField(['appId', 'app_id']);
  const measurementId = extractField(['measurementId', 'measurement_id']);

  if (!projectId && !apiKey) {
    return {
      config: {},
      error: 'No se encontraron las propiedades "projectId" o "apiKey". Asegúrate de copiar el fragmento de configuración de tu app web en Firebase Console.',
    };
  }

  return {
    config: {
      projectId,
      apiKey,
      authDomain,
      firestoreDatabaseId,
      storageBucket,
      messagingSenderId,
      appId,
      measurementId,
    },
  };
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

// Helper to load collection documents with server priority
export async function fetchCollection<T>(collectionName: string): Promise<T[]> {
  try {
    const colRef = collection(db, collectionName);
    let snapshot;
    try {
      snapshot = await getDocsFromServer(colRef);
    } catch {
      snapshot = await getDocs(colRef);
    }
    const items: T[] = [];
    snapshot.forEach((d) => {
      const data = d.data();
      const rawId = data.id !== undefined ? data.id : d.id;
      const numId = Number(rawId);
      const id = !isNaN(numId) ? numId : rawId;
      items.push({ ...data, id } as T);
    });
    items.sort((a: any, b: any) => {
      const idA = Number(a.id) || 0;
      const idB = Number(b.id) || 0;
      return idA - idB;
    });
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
    // Firestore batch limit is 500 operations; we chunk by 400 safely
    const CHUNK_SIZE = 400;
    for (let i = 0; i < items.length; i += CHUNK_SIZE) {
      const chunk = items.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(db);
      chunk.forEach((item) => {
        const docRef = doc(db, collectionName, String(item.id));
        batch.set(docRef, item, { merge: true });
      });
      await batch.commit();
    }
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
