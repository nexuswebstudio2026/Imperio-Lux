export interface GoogleUser { uid: string; email: string; displayName: string; photoURL: string | null }
let currentUser: GoogleUser | null = null;
const serviceToken = 'server-managed-service-account';
export const initAuth = (onAuthSuccess?: (user: GoogleUser, token: string) => void, onAuthFailure?: () => void) => { fetch('/api/sheets/status').then(async (r) => { const data = await r.json(); if (!r.ok || !data.connected) throw new Error(data.error); currentUser = { uid: 'google-service-account', email: data.email, displayName: 'Cuenta de servicio', photoURL: null }; onAuthSuccess?.(currentUser, serviceToken); }).catch(() => { currentUser = null; onAuthFailure?.(); }); return () => {}; };
export async function googleSignIn() { const response = await fetch('/api/sheets/status'); const data = await response.json(); if (!response.ok || !data.connected) throw new Error(data.error || 'Configura la cuenta de servicio en el servidor.'); currentUser = { uid: 'google-service-account', email: data.email, displayName: 'Cuenta de servicio', photoURL: null }; return { user: currentUser, accessToken: serviceToken }; }
export async function logout() { currentUser = null; }
export const getAccessToken = async () => currentUser ? serviceToken : null;
export const getCurrentUser = () => currentUser;
