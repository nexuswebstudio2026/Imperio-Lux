import { checkDatabaseConnection } from './databaseApi';

export interface GoogleUser { uid: string; email: string; displayName: string; photoURL: string | null }
let currentUser: GoogleUser | null = null;
// This marker is only for legacy UI state. It is not a Google credential;
// all Google API requests are authenticated by the server-side service account.
const serviceToken = 'server-managed-service-account';
export const initAuth = (onAuthSuccess?: (user: GoogleUser, token: string) => void, onAuthFailure?: () => void) => { checkDatabaseConnection().then((data) => { currentUser = { uid: 'google-service-account', email: data.serviceAccount || '', displayName: 'Cuenta de servicio', photoURL: null }; onAuthSuccess?.(currentUser, serviceToken); }).catch(() => { currentUser = null; onAuthFailure?.(); }); return () => {}; };
export async function googleSignIn() { const data = await checkDatabaseConnection(); currentUser = { uid: 'google-service-account', email: data.serviceAccount || '', displayName: 'Cuenta de servicio', photoURL: null }; return { user: currentUser, accessToken: serviceToken }; }
export async function logout() { currentUser = null; }
export const getAccessToken = async () => currentUser ? serviceToken : null;
export const getCurrentUser = () => currentUser;
