import React, { useState } from 'react';
import { ArrowLeft, Eye, EyeOff, LockKeyhole, Mail, Moon, Sun } from 'lucide-react';
import { useApp } from '../../context/AppContext';

type AuthUser = { id: number; name: string; email: string; role: string; type: 'admin' | 'employee' | 'client' | 'supplier' };
type PortalType = 'admin' | 'employee' | 'client' | 'supplier';

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
  const [mode, setMode] = useState<'login' | 'username' | 'password' | 'bootstrap' | 'register'>('login');
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
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerDocument, setRegisterDocument] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');
  const [registerAddress, setRegisterAddress] = useState('');
  const [registerCargo, setRegisterCargo] = useState('');
  const [registerDocumentTypeId, setRegisterDocumentTypeId] = useState('1');
  const [registerPersonType, setRegisterPersonType] = useState('Natural');
  const [registerUsername, setRegisterUsername] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [registerStage, setRegisterStage] = useState<'request' | 'confirm'>('request');
  const [registrationToken, setRegistrationToken] = useState('');
  const [registrationCode, setRegistrationCode] = useState('');
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
      const response = await fetch('/api/auth/recovery/request', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ mode, identifier, portalType }) });
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

  async function registerAccount(event: React.FormEvent) {
    event.preventDefault(); setError(''); setMessage('');
    if (!portalType || portalType === 'admin') return;
    if (registerPassword !== confirmPassword) { setError('Las contraseñas no coinciden.'); return; }
    setBusy(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ type: portalType, name: registerName, email: registerEmail, document: registerDocument, phone: registerPhone, address: registerAddress, cargo: registerCargo, documentTypeId: registerDocumentTypeId, personType: registerPersonType, username: registerUsername, password: registerPassword }),
      });
      const data = await readApiResponse(response);
      if (!response.ok) throw new Error(data.error || 'No se pudo registrar la cuenta.');
      setRegistrationToken(data.registrationToken);
      setRegisterStage('confirm');
      setMessage(data.message || 'Ingresa el código que enviamos a tu correo.');
      setRegisterPassword(''); setConfirmPassword('');
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo registrar la cuenta.'); }
    finally { setBusy(false); }
  }

  async function confirmRegistration(event: React.FormEvent) {
    event.preventDefault(); setError(''); setBusy(true);
    try {
      const response = await fetch('/api/auth/register/confirm', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ registrationToken, code: registrationCode }),
      });
      const data = await readApiResponse(response);
      if (!response.ok) throw new Error(data.error || 'No se pudo verificar el correo.');
      setUsername(registerUsername); setPassword(''); setMode('login'); setRegisterStage('request');
      setMessage(data.message || 'Correo verificado. La solicitud quedó pendiente de aprobación del administrador.');
      setRegistrationToken(''); setRegistrationCode('');
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo verificar el correo.'); }
    finally { setBusy(false); }
  }

  const portalName = portalType === 'admin' ? 'administrador' : portalType === 'employee' ? 'empleado' : portalType === 'supplier' ? 'proveedor' : portalType === 'client' ? 'cliente' : '';
  const title = mode === 'login' ? portalType ? `Acceso de ${portalName}` : 'Bienvenido de nuevo' : mode === 'register' ? `Registro de ${portalName}` : mode === 'username' ? 'Recupera tu usuario' : mode === 'password' ? 'Restablece tu contraseña' : 'Configura el administrador';
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
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{mode === 'register' ? 'Completa tus datos para crear el acceso al portal.' : 'Ingresa con las credenciales asociadas a tu cuenta.'}</p>
        </div>
        {mode === 'login' ? <form onSubmit={submitLogin} className="space-y-4">
          <label className="block text-xs font-semibold">Usuario<input autoComplete="username" required value={username} onChange={(e) => setUsername(e.target.value)} className={`${inputClass} mt-2`} /></label>
          <label className="block text-xs font-semibold">Contraseña<span className="relative mt-2 block"><input autoComplete="current-password" required type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className={`${inputClass} pr-12`} /><button type="button" aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} aria-pressed={showPassword} onClick={() => setShowPassword((visible) => !visible)} className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-500 transition hover:text-[#9b7b3e] dark:text-slate-400">{showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}</button></span></label>
          <button disabled={busy} className="w-full bg-[#b89652] px-4 py-3 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-[#9b7b3e] disabled:opacity-50">{busy ? 'Verificando…' : 'Iniciar sesión'}</button>
          {portalType && <div className="flex flex-wrap justify-between gap-3 text-xs">{portalType === 'admin' && <button type="button" onClick={() => { setMode('username'); setStage('request'); setError(''); setMessage(''); }} className="text-[#8b6d35] hover:underline">Olvidé mi usuario</button>}<button type="button" onClick={() => { setMode('password'); setStage('request'); setError(''); setMessage(''); }} className="text-[#8b6d35] hover:underline">Olvidé mi contraseña</button>{portalType !== 'admin' && <button type="button" onClick={() => { setMode('register'); setRegisterStage('request'); setError(''); setMessage(''); }} className="text-[#8b6d35] hover:underline">Registrar usuario</button>}</div>}
          {portalType === 'admin' && <button type="button" onClick={() => { setMode('bootstrap'); setError(''); setMessage(''); }} className="w-full pt-2 text-center text-[11px] text-slate-500 hover:text-[#8b6d35]">Primera configuración del administrador</button>}
        </form> : mode === 'register' && registerStage === 'request' ? <form onSubmit={registerAccount} className="space-y-4">
          <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">Verificaremos tu correo. El acceso quedará pendiente hasta que el administrador apruebe tu solicitud.</p>
          <label className="block text-xs font-semibold">Nombre completo<input autoComplete="name" required maxLength={120} value={registerName} onChange={(e) => setRegisterName(e.target.value)} className={`${inputClass} mt-2`} /></label>
          <label className="block text-xs font-semibold">Correo electrónico<input autoComplete="email" required type="email" maxLength={160} value={registerEmail} onChange={(e) => setRegisterEmail(e.target.value)} className={`${inputClass} mt-2`} /></label>
          <label className="block text-xs font-semibold">Número de documento<input required maxLength={32} value={registerDocument} onChange={(e) => setRegisterDocument(e.target.value)} className={`${inputClass} mt-2`} /></label>
          <label className="block text-xs font-semibold">Tipo de documento<select value={registerDocumentTypeId} onChange={(e) => setRegisterDocumentTypeId(e.target.value)} className={`${inputClass} mt-2`}><option value="1">DNI</option><option value="2">RUC</option><option value="3">Pasaporte</option><option value="4">Carnet de extranjería</option></select></label>
          <label className="block text-xs font-semibold">Teléfono<input autoComplete="tel" required maxLength={32} value={registerPhone} onChange={(e) => setRegisterPhone(e.target.value)} className={`${inputClass} mt-2`} /></label>
          {portalType !== 'employee' && <label className="block text-xs font-semibold">Tipo de persona<select value={registerPersonType} onChange={(e) => setRegisterPersonType(e.target.value)} className={`${inputClass} mt-2`}><option value="Natural">Persona natural</option><option value="Juridica">Persona jurídica</option></select></label>}
          {portalType === 'employee' && <label className="block text-xs font-semibold">Cargo solicitado<input maxLength={120} value={registerCargo} onChange={(e) => setRegisterCargo(e.target.value)} className={`${inputClass} mt-2`} /></label>}
          {portalType !== 'employee' && <label className="block text-xs font-semibold">Dirección<input maxLength={240} value={registerAddress} onChange={(e) => setRegisterAddress(e.target.value)} className={`${inputClass} mt-2`} /></label>}
          <label className="block text-xs font-semibold">Nombre de usuario<input autoComplete="username" required minLength={4} maxLength={64} value={registerUsername} onChange={(e) => setRegisterUsername(e.target.value)} className={`${inputClass} mt-2`} /></label>
          <label className="block text-xs font-semibold">Contraseña<span className="relative mt-2 block"><input autoComplete="new-password" required minLength={10} maxLength={256} type={showNewPassword ? 'text' : 'password'} value={registerPassword} onChange={(e) => setRegisterPassword(e.target.value)} className={`${inputClass} pr-12`} /><button type="button" aria-label={showNewPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} aria-pressed={showNewPassword} onClick={() => setShowNewPassword((visible) => !visible)} className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-500 transition hover:text-[#9b7b3e] dark:text-slate-400">{showNewPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}</button></span></label>
          <label className="block text-xs font-semibold">Confirmar contraseña<input autoComplete="new-password" required minLength={10} maxLength={256} type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={`${inputClass} mt-2`} /></label>
          <button disabled={busy} className="w-full bg-[#b89652] px-4 py-3 text-xs font-bold uppercase tracking-widest text-white disabled:opacity-50">{busy ? 'Registrando…' : 'Crear cuenta'}</button>
          <button type="button" onClick={() => { setMode('login'); setError(''); setMessage(''); }} className="w-full text-xs text-[#8b6d35]">Volver al inicio de sesión</button>
        </form> : mode === 'register' ? <form onSubmit={confirmRegistration} className="space-y-4">
          <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{message || `Enviamos un código de verificación a ${registerEmail}.`}</p>
          <label className="block text-xs font-semibold">Código de verificación<input required inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoComplete="one-time-code" value={registrationCode} onChange={(e) => setRegistrationCode(e.target.value)} className={`${inputClass} mt-2`} /></label>
          <button disabled={busy || !registrationToken} className="w-full bg-[#b89652] px-4 py-3 text-xs font-bold uppercase tracking-widest text-white disabled:opacity-50">{busy ? 'Verificando…' : 'Verificar y registrar'}</button>
          <button type="button" onClick={() => { setMode('login'); setRegisterStage('request'); setRegistrationToken(''); setRegistrationCode(''); setError(''); setMessage(''); }} className="w-full text-xs text-[#8b6d35]">Cancelar y volver al inicio de sesión</button>
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
          <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">{mode === 'username' ? 'Enviaremos un código al correo registrado. Al verificarlo podrás elegir un usuario nuevo.' : 'Enviaremos un código de un solo uso al correo asociado con tu usuario.'}</p>
          <button disabled={busy} className="w-full bg-[#b89652] px-4 py-3 text-xs font-bold uppercase tracking-widest text-white disabled:opacity-50">{busy ? 'Enviando…' : 'Enviar código'}</button>
          <button type="button" onClick={() => { setMode('login'); setStage('request'); setRecoveryId(''); setCode(''); setNewValue(''); setError(''); setMessage(''); }} className="w-full text-xs text-[#8b6d35]">Volver al inicio de sesión</button>
        </form> : <form onSubmit={confirmRecovery} className="space-y-4">
          <p className="text-xs leading-5 text-slate-600 dark:text-slate-300">{message}</p>
          <label className="block text-xs font-semibold">Código de verificación<input required inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={code} onChange={(e) => setCode(e.target.value)} className={`${inputClass} mt-2`} /></label>
          <label className="block text-xs font-semibold">{mode === 'username' ? 'Nuevo usuario' : 'Nueva contraseña'}<span className="relative mt-2 block"><input required minLength={mode === 'username' ? 4 : 10} type={mode === 'password' ? (showNewPassword ? 'text' : 'password') : 'text'} value={newValue} onChange={(e) => setNewValue(e.target.value)} className={`${inputClass} ${mode === 'password' ? 'pr-12' : ''}`} />{mode === 'password' && <button type="button" aria-label={showNewPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} aria-pressed={showNewPassword} onClick={() => setShowNewPassword((visible) => !visible)} className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-500 transition hover:text-[#9b7b3e] dark:text-slate-400">{showNewPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}</button>}</span></label>
          <button disabled={busy} className="w-full bg-[#b89652] px-4 py-3 text-xs font-bold uppercase tracking-widest text-white disabled:opacity-50">{busy ? 'Actualizando…' : 'Actualizar cuenta'}</button>
          <button type="button" onClick={() => { setMode('login'); setStage('request'); setRecoveryId(''); setCode(''); setNewValue(''); setError(''); setMessage(''); }} className="w-full text-xs text-[#8b6d35]">Cancelar y volver al inicio de sesión</button>
        </form>}
        {(error || message) && <p role="status" className={`mt-4 text-sm ${error ? 'text-red-600' : 'text-emerald-700 dark:text-emerald-300'}`}>{error || message}</p>}
      </section>
    </div>
  </main>;
};
