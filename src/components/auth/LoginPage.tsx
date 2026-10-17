import React, { useState } from 'react';
import { ArrowLeft, Eye, EyeOff, LockKeyhole, Mail, Moon, Sun } from 'lucide-react';
import { useApp } from '../../context/AppContext';

type AuthUser = { id: number; name: string; email: string; role: string; type: 'admin' | 'employee' | 'client' | 'supplier' };
type PortalType = 'admin' | 'client' | 'supplier';

async function readApiResponse(response: Response): Promise<any> {
  const body = await response.text();
  try {
    return JSON.parse(body);
  } catch {
    if (response.status === 404) {
      throw new Error('La API de autenticación no está disponible en este despliegue. Actualiza el despliegue de Vercel y vuelve a intentarlo.');
    }
    throw new Error(`El servidor respondió con un formato inesperado (HTTP ${response.status}).`);
  }
}

export const LoginPage: React.FC<{ onLogin: (user: AuthUser) => void; onBack: () => void; portalType?: PortalType }> = ({ onLogin, onBack, portalType }) => {
  const { theme, toggleTheme } = useApp();
  const [mode, setMode] = useState<'login' | 'username' | 'password' | 'bootstrap'>('login');
  const [stage, setStage] = useState<'request' | 'confirm'>('request');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [recoveryId, setRecoveryId] = useState('');
  const [code, setCode] = useState('');
  const [newValue, setNewValue] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [bootstrapSecret, setBootstrapSecret] = useState('');
  const [bootstrapEmail, setBootstrapEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submitLogin(event: React.FormEvent) {
    event.preventDefault(); setError(''); setBusy(true);
    try {
      const response = await fetch('/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ username, password, expectedType: portalType }) });
      const data = await readApiResponse(response);
      if (!response.ok) throw new Error(data.error || 'No se pudo iniciar sesión.');
      onLogin(data.user);
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión.'); }
    finally { setBusy(false); }
  }

  async function requestCode(event: React.FormEvent) {
    event.preventDefault(); setError(''); setBusy(true);
    try {
      const response = await fetch('/api/auth/recovery/request', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ mode, identifier }) });
      const data = await readApiResponse(response);
      if (!response.ok) throw new Error(data.error || 'No se pudo solicitar la recuperación.');
      setRecoveryId(data.recoveryId); setMessage(data.message); setStage('confirm');
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo solicitar la recuperación.'); }
    finally { setBusy(false); }
  }

  async function confirmRecovery(event: React.FormEvent) {
    event.preventDefault(); setError(''); setBusy(true);
    const payload = mode === 'password' ? { newPassword: newValue } : { newUsername: newValue };
    try {
      const response = await fetch('/api/auth/recovery/confirm', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ recoveryId, code, ...payload }) });
      const data = await readApiResponse(response);
      if (!response.ok) throw new Error(data.error || 'No se pudo actualizar la cuenta.');
      setMode('login'); setStage('request'); setMessage(data.message); setUsername(mode === 'username' ? newValue : identifier); setPassword('');
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo actualizar la cuenta.'); }
    finally { setBusy(false); }
  }

  async function bootstrapAdmin(event: React.FormEvent) {
    event.preventDefault(); setError(''); setBusy(true);
    try {
      const response = await fetch('/api/auth/bootstrap-admin', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ bootstrapSecret, email: bootstrapEmail, username, password }) });
      const data = await readApiResponse(response);
      if (!response.ok) throw new Error(data.error || 'No se pudo configurar el administrador.');
      setMessage(`${data.message} Ya puedes iniciar sesión.`); setMode('login');
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo configurar el administrador.'); }
    finally { setBusy(false); }
  }

  const portalName = portalType === 'admin' ? 'administrador' : portalType === 'supplier' ? 'proveedor' : portalType === 'client' ? 'cliente' : '';
  const title = mode === 'login' ? portalType ? `Acceso de ${portalName}` : 'Bienvenido de nuevo' : mode === 'username' ? 'Recupera tu usuario' : mode === 'password' ? 'Restablece tu contraseña' : 'Configura el administrador';
  const inputClass = 'w-full border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#b89652] focus:ring-2 focus:ring-[#b89652]/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white';

  return <main className="min-h-screen bg-[#f7f5f0] px-4 py-10 text-slate-900 dark:bg-slate-950 dark:text-white">
    <div className="mx-auto max-w-md">
      <div className="mb-8 flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-600 hover:text-[#9b7b3e] dark:text-slate-300"><ArrowLeft size={16} /> Volver al sitio</button>
        <button type="button" onClick={toggleTheme} aria-label="Cambiar tema" className="grid h-10 w-10 place-items-center border border-slate-300 dark:border-slate-700">{theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}</button>
      </div>
      <section className="border border-[#d8d2c4] bg-white p-7 shadow-xl dark:border-slate-800 dark:bg-slate-900 sm:p-9">
        <div className="mb-8 text-center">
          <img src="/assets/imperio-icon.svg" alt="" className="mx-auto mb-4 h-12 w-12 rounded-full" />
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#9b7b3e]">Imperio Lux</p>
          <h1 className="mt-2 font-serif text-3xl">{title}</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Ingresa con las credenciales asociadas a tu cuenta.</p>
        </div>
        {mode === 'login' ? <form onSubmit={submitLogin} className="space-y-4">
          <label className="block text-xs font-semibold">Usuario<input autoComplete="username" required value={username} onChange={(e) => setUsername(e.target.value)} className={`${inputClass} mt-2`} /></label>
          <label className="block text-xs font-semibold">Contraseña<span className="relative mt-2 block"><input autoComplete="current-password" required type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className={`${inputClass} pr-12`} /><button type="button" aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} aria-pressed={showPassword} onClick={() => setShowPassword((visible) => !visible)} className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-500 transition hover:text-[#9b7b3e] dark:text-slate-400">{showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}</button></span></label>
          <button disabled={busy} className="w-full bg-[#b89652] px-4 py-3 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-[#9b7b3e] disabled:opacity-50">{busy ? 'Verificando…' : 'Iniciar sesión'}</button>
          <div className="flex justify-between text-xs"><button type="button" onClick={() => { setMode('password'); setStage('request'); setError(''); setMessage(''); }} className="text-[#8b6d35] hover:underline">Olvidé mi contraseña</button><button type="button" onClick={() => { setMode('username'); setStage('request'); setError(''); setMessage(''); }} className="text-[#8b6d35] hover:underline">Olvidé mi usuario</button></div>
          <button type="button" onClick={() => { setMode('bootstrap'); setError(''); setMessage(''); }} className="w-full pt-2 text-center text-[11px] text-slate-500 hover:text-[#8b6d35]">Primera configuración del administrador</button>
        </form> : mode === 'bootstrap' ? <form onSubmit={bootstrapAdmin} className="space-y-4">
          <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">Configura AUTH_BOOTSTRAP_SECRET en el entorno del servidor y usa el correo del administrador que ya existe en la hoja Usuarios.</p>
          <label className="block text-xs font-semibold">Clave de configuración<input required type="password" value={bootstrapSecret} onChange={(e) => setBootstrapSecret(e.target.value)} className={`${inputClass} mt-2`} /></label>
          <label className="block text-xs font-semibold">Correo del administrador<input required type="email" value={bootstrapEmail} onChange={(e) => setBootstrapEmail(e.target.value)} className={`${inputClass} mt-2`} /></label>
          <label className="block text-xs font-semibold">Nombre de usuario<input required minLength={4} value={username} onChange={(e) => setUsername(e.target.value)} className={`${inputClass} mt-2`} /></label>
          <label className="block text-xs font-semibold">Contraseña inicial<span className="relative mt-2 block"><input required minLength={10} type={showNewPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className={`${inputClass} pr-12`} /><button type="button" aria-label={showNewPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} aria-pressed={showNewPassword} onClick={() => setShowNewPassword((visible) => !visible)} className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-500 transition hover:text-[#9b7b3e] dark:text-slate-400">{showNewPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}</button></span></label>
          <button disabled={busy} className="w-full bg-[#b89652] px-4 py-3 text-xs font-bold uppercase tracking-widest text-white disabled:opacity-50">{busy ? 'Configurando…' : 'Crear acceso de administrador'}</button>
          <button type="button" onClick={() => { setMode('login'); setError(''); }} className="w-full text-xs text-[#8b6d35]">Volver al inicio de sesión</button>
        </form> : stage === 'request' ? <form onSubmit={requestCode} className="space-y-4">
          <label className="block text-xs font-semibold">{mode === 'username' ? 'Correo electrónico registrado' : 'Usuario'}<span className="relative mt-2 block"><span className="absolute left-3 top-3 text-slate-400">{mode === 'username' ? <Mail size={16} /> : <LockKeyhole size={16} />}</span><input required type={mode === 'username' ? 'email' : 'text'} value={identifier} onChange={(e) => setIdentifier(e.target.value)} className={`${inputClass} pl-10`} /></span></label>
          <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">{mode === 'username' ? 'Enviaremos el usuario a tu correo registrado. También podrás cambiarlo con el código.' : 'Enviaremos un código de un solo uso al correo asociado con tu usuario.'}</p>
          <button disabled={busy} className="w-full bg-[#b89652] px-4 py-3 text-xs font-bold uppercase tracking-widest text-white disabled:opacity-50">{busy ? 'Enviando…' : 'Enviar código'}</button>
        </form> : <form onSubmit={confirmRecovery} className="space-y-4">
          <p className="text-xs leading-5 text-slate-600 dark:text-slate-300">{message}</p>
          <label className="block text-xs font-semibold">Código de verificación<input required inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={code} onChange={(e) => setCode(e.target.value)} className={`${inputClass} mt-2`} /></label>
          <label className="block text-xs font-semibold">{mode === 'username' ? 'Nuevo usuario' : 'Nueva contraseña'}<span className="relative mt-2 block"><input required minLength={mode === 'username' ? 4 : 10} type={mode === 'password' ? (showNewPassword ? 'text' : 'password') : 'text'} value={newValue} onChange={(e) => setNewValue(e.target.value)} className={`${inputClass} ${mode === 'password' ? 'pr-12' : ''}`} />{mode === 'password' && <button type="button" aria-label={showNewPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} aria-pressed={showNewPassword} onClick={() => setShowNewPassword((visible) => !visible)} className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-500 transition hover:text-[#9b7b3e] dark:text-slate-400">{showNewPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}</button>}</span></label>
          <button disabled={busy} className="w-full bg-[#b89652] px-4 py-3 text-xs font-bold uppercase tracking-widest text-white disabled:opacity-50">{busy ? 'Actualizando…' : 'Actualizar cuenta'}</button>
        </form>}
        {(error || message) && <p role="status" className={`mt-4 text-sm ${error ? 'text-red-600' : 'text-emerald-700 dark:text-emerald-300'}`}>{error || message}</p>}
      </section>
    </div>
  </main>;
};
