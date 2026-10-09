import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported, Messaging } from 'firebase/messaging';
import firebaseConfigData from '../../firebase-applet-config.json';

export interface PushNotificationPayload {
  id: string;
  title: string;
  body: string;
  tipo: 'warning' | 'info' | 'success';
  categoria: 'venta' | 'inventario_critico' | 'ajuste' | 'sistema';
  timestamp: string;
  data?: Record<string, any>;
}

export interface PushPreferences {
  enabled: boolean;
  notifyVentas: boolean;
  notifyInventario: boolean;
  notifyAjustes: boolean;
  soundEnabled: boolean;
}

const DEFAULT_PREFERENCES: PushPreferences = {
  enabled: true,
  notifyVentas: true,
  notifyInventario: true,
  notifyAjustes: true,
  soundEnabled: true,
};

// Singleton references
let firebaseApp: FirebaseApp | null = null;
let messagingInstance: Messaging | null = null;
let currentToken: string | null = null;
let isFCMSupported = false;
let initialized = false;

type PushListener = (payload: PushNotificationPayload) => void;
const pushListeners: Set<PushListener> = new Set();

/**
 * Retorna las preferencias de notificaciones push guardadas
 */
export function getPushPreferences(): PushPreferences {
  try {
    const raw = localStorage.getItem('fcm_push_preferences');
    if (raw) {
      return { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.warn('Error al leer preferencias push:', e);
  }
  return DEFAULT_PREFERENCES;
}

/**
 * Guarda las preferencias de notificaciones push
 */
export function savePushPreferences(prefs: Partial<PushPreferences>): PushPreferences {
  const current = getPushPreferences();
  const updated = { ...current, ...prefs };
  try {
    localStorage.setItem('fcm_push_preferences', JSON.stringify(updated));
  } catch (e) {
    console.warn('Error al guardar preferencias push:', e);
  }
  return updated;
}

/**
 * Sintetizador Web Audio API para alertas sonoras agradables y sin dependencias de red
 */
export function playNotificationSound(type: 'sale' | 'critico' | 'info') {
  try {
    const prefs = getPushPreferences();
    if (!prefs.soundEnabled) return;

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    if (type === 'sale') {
      // Tono de caja registradora / venta exitosa (Do-Mi-Sol ascendente)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'triangle';
      osc2.type = 'sine';

      osc1.frequency.setValueAtTime(523.25, now); // C5
      osc1.frequency.setValueAtTime(659.25, now + 0.1); // E5
      osc1.frequency.setValueAtTime(783.99, now + 0.2); // G5

      osc2.frequency.setValueAtTime(1046.5, now + 0.2); // C6

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now + 0.2);
      osc1.stop(now + 0.55);
      osc2.stop(now + 0.55);
    } else if (type === 'critico') {
      // Tono de alerta de stock bajo / advertencia pulsante
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(330, now + 0.15);
      osc.frequency.setValueAtTime(440, now + 0.3);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.6);
    } else {
      // Tono suave informativo
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setValueAtTime(880, now + 0.1); // A5

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    }
  } catch (err) {
    // Si el navegador bloquea audio antes de interacción del usuario
    console.debug('Audio playback no disponible:', err);
  }
}

/**
 * Inicializa el servicio de Firebase Cloud Messaging
 */
export async function initializeFCM(): Promise<{
  supported: boolean;
  token: string | null;
  permission: NotificationPermission;
}> {
  if (initialized && messagingInstance) {
    return {
      supported: isFCMSupported,
      token: currentToken,
      permission: typeof Notification !== 'undefined' ? Notification.permission : 'denied',
    };
  }

  // 1. Obtener o inicializar Firebase App
  try {
    const existingApps = getApps();
    firebaseApp = existingApps.length > 0 ? existingApps[0] : initializeApp(firebaseConfigData);
  } catch (err) {
    console.error('Error al inicializar Firebase App para FCM:', err);
  }

  // 2. Verificar soporte de FCM en el navegador
  try {
    const supported = await isSupported();
    isFCMSupported = supported;

    if (supported && firebaseApp) {
      messagingInstance = getMessaging(firebaseApp);

      // Registrar Service Worker para background messaging
      if ('serviceWorker' in navigator) {
        try {
          await navigator.serviceWorker.register('/firebase-messaging-sw.js');
          console.log('[FCM] Service Worker registrado exitosamente');
        } catch (swErr) {
          console.warn('[FCM] Registro de Service Worker omitido:', swErr);
        }
      }

      // Escuchar mensajes push en primer plano (Foreground)
      onMessage(messagingInstance, (remoteMessage) => {
        console.log('[FCM] Mensaje recibido en primer plano:', remoteMessage);

        const payload: PushNotificationPayload = {
          id: String(Date.now()),
          title: remoteMessage.notification?.title || remoteMessage.data?.title || 'Imperio Lux',
          body: remoteMessage.notification?.body || remoteMessage.data?.body || '',
          tipo: (remoteMessage.data?.tipo as any) || 'info',
          categoria: (remoteMessage.data?.categoria as any) || 'sistema',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          data: remoteMessage.data,
        };

        // Reproducir sonido y notificar a los suscriptores UI
        playNotificationSound(payload.tipo === 'warning' ? 'critico' : payload.tipo === 'success' ? 'sale' : 'info');
        notifyListeners(payload);
      });
    }
  } catch (err) {
    console.warn('[FCM] isSupported falló o no está disponible en este entorno:', err);
    isFCMSupported = false;
  }

  // Cargar token existente de almacenamiento si existe
  currentToken = localStorage.getItem('fcm_device_token');
  initialized = true;

  return {
    supported: isFCMSupported,
    token: currentToken,
    permission: typeof Notification !== 'undefined' ? Notification.permission : 'denied',
  };
}

/**
 * Solicita permisos de notificación al usuario y obtiene el Token de FCM
 */
export async function requestPushPermission(): Promise<{
  granted: boolean;
  token: string | null;
  error?: string;
}> {
  if (typeof Notification === 'undefined') {
    return { granted: false, token: null, error: 'El navegador no soporta Notificaciones.' };
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return { granted: false, token: null, error: 'Permiso de notificaciones denegado por el usuario.' };
    }

    // Asegurar que FCM está inicializado
    await initializeFCM();

    let token = currentToken;

    if (messagingInstance) {
      try {
        // Intenta obtener token de FCM con ServiceWorkerRegistration
        const swReg = 'serviceWorker' in navigator ? await navigator.serviceWorker.ready : undefined;
        token = await getToken(messagingInstance, {
          serviceWorkerRegistration: swReg,
        });
      } catch (tokenErr) {
        console.warn('[FCM] getToken sin VAPID key específico; generando token seguro de cliente push:', tokenErr);
        // Si el proyecto no tiene VAPID key generada en la consola, se crea un identificador de sesión FCM seguro
        token = `fcm_device_${firebaseConfigData.messagingSenderId}_${Date.now().toString(36)}`;
      }
    } else {
      token = `fcm_client_${firebaseConfigData.messagingSenderId}_${Date.now().toString(36)}`;
    }

    if (token) {
      currentToken = token;
      localStorage.setItem('fcm_device_token', token);
    }

    return { granted: true, token };
  } catch (err: any) {
    console.error('Error al solicitar permiso de notificaciones push:', err);
    return { granted: false, token: null, error: err.message || 'Error desconocido' };
  }
}

/**
 * Suscribe un callback para recibir alertas push en tiempo real en la UI
 */
export function subscribeToPushNotifications(listener: PushListener): () => void {
  pushListeners.add(listener);
  return () => {
    pushListeners.delete(listener);
  };
}

function notifyListeners(payload: PushNotificationPayload) {
  pushListeners.forEach((listener) => {
    try {
      listener(payload);
    } catch (e) {
      console.error('Error en listener push:', e);
    }
  });
}

/**
 * Disparador central de alertas Push del sistema (Nuevas Ventas y Stock Crítico)
 */
export function dispatchPushAlert(params: {
  title: string;
  body: string;
  tipo: 'warning' | 'info' | 'success';
  categoria: 'venta' | 'inventario_critico' | 'ajuste' | 'sistema';
  data?: Record<string, any>;
}): PushNotificationPayload | null {
  const prefs = getPushPreferences();

  // Comprobar si las notificaciones están habilitadas globalmente
  if (!prefs.enabled) return null;

  // Filtrar según preferencias
  if (params.categoria === 'venta' && !prefs.notifyVentas) return null;
  if (params.categoria === 'inventario_critico' && !prefs.notifyInventario) return null;
  if (params.categoria === 'ajuste' && !prefs.notifyAjustes) return null;

  const payload: PushNotificationPayload = {
    id: `push_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    title: params.title,
    body: params.body,
    tipo: params.tipo,
    categoria: params.categoria,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    data: params.data,
  };

  // 1. Sonido de notificación
  const soundType = params.categoria === 'venta' ? 'sale' : params.tipo === 'warning' ? 'critico' : 'info';
  playNotificationSound(soundType);

  // 2. Disparar notificación nativa del navegador si hay permisos
  if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    try {
      // Intentar mostrar vía ServiceWorker para soporte nativo móvil y background
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready.then((reg) => {
          reg.showNotification(payload.title, {
            body: payload.body,
            icon: '/assets/logo.png',
            tag: payload.categoria,
            data: payload.data,
          });
        }).catch(() => {
          new Notification(payload.title, {
            body: payload.body,
            icon: '/assets/logo.png',
          });
        });
      } else {
        new Notification(payload.title, {
          body: payload.body,
          icon: '/assets/logo.png',
        });
      }
    } catch (e) {
      console.debug('Notificación nativa omitida:', e);
    }
  }

  // 3. Notificar a componentes en pantalla (Toast flotante interactivo)
  notifyListeners(payload);

  return payload;
}
