import { useEffect, useState, type FormEvent } from 'react';
import { KeyRound, Mail, ShieldCheck, X } from 'lucide-react';
import type { AuthUser } from '../types';
import { apiFetch, setStoredToken } from '../utils/api';
import {
  formatFirebaseAuthResetError,
  sendFirebaseAdminResetEmail,
} from '../utils/firebaseAuthReset';

interface AuthModalProps {
  open: boolean;
  prefillId?: string;
  onClose: () => void;
  onSuccess: (user: AuthUser) => void;
}

export function AuthModal({ open, prefillId, onClose, onSuccess }: AuthModalProps) {
  const [id, setId] = useState(prefillId || '');
  const [clave, setClave] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [recoveryOpen, setRecoveryOpen] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [sendingReset, setSendingReset] = useState(false);
  const [recoveryError, setRecoveryError] = useState<string | null>(null);
  const [resetSentMessage, setResetSentMessage] = useState<string | null>(null);

  useEffect(() => {
    if (prefillId) {
      setId(prefillId);
    }
  }, [prefillId]);

  if (!open) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await apiFetch<{ token: string; user: AuthUser }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ id, clave }),
      });
      setStoredToken(res.token);
      onSuccess(res.user);
      setId('');
      setClave('');
      setRecoveryOpen(false);
      setResetSentMessage(null);
      setRecoveryError(null);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendFirebaseReset = async (e: FormEvent) => {
    e.preventDefault();
    setRecoveryError(null);
    setResetSentMessage(null);
    setSendingReset(true);

    try {
      await apiFetch<{ authorized: boolean }>('/api/auth/verify-admin-recovery-email', {
        method: 'POST',
        body: JSON.stringify({ email: recoveryEmail.trim() }),
      });

      await sendFirebaseAdminResetEmail(recoveryEmail.trim());
      setResetSentMessage(
        'Enlace oficial de Firebase Authentication enviado. Revisá tu casilla de correo (Recibidos o Spam), abrí el enlace para crear tu nueva contraseña y luego volvé a ingresar con tu ID de Administrador y nueva clave.'
      );
      setRecoveryEmail('');
    } catch (err) {
      setRecoveryError(formatFirebaseAuthResetError(err));
    } finally {
      setSendingReset(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4">
      <div className="w-full max-w-md bg-[#071D38] border-2 border-amber-400/70 rounded-2xl shadow-2xl overflow-hidden text-white max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#08264A] via-[#0D3C70] to-[#08264A] text-white border-b border-amber-400/45">
          <div className="flex items-center gap-2.5">
            <KeyRound className="w-5 h-5 text-amber-300" />
            <h2 className="font-display text-2xl font-bold tracking-tight text-albiceleste-shiny">
              Ingresar a Cuenta
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar ventana"
            className="p-1.5 text-sky-200 hover:text-amber-300 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-sky-100">
              No necesitás correo electrónico. Ingresá únicamente con tu{' '}
              <strong className="text-amber-300">ID propio</strong> y{' '}
              <strong className="text-amber-300">Clave</strong> asignados. Cada cuenta es personal e intransferible.
            </p>

            {error && (
              <div className="p-3 text-sm font-medium text-rose-200 bg-rose-950/60 border border-rose-500/40 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label
                className="block text-xs font-semibold text-sky-200 mb-1.5"
                htmlFor="login-id"
              >
                ID de Equipo o Administrador
              </label>
              <input
                id="login-id"
                type="text"
                required
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder="Ej: LMA01 o ADMI"
                className="w-full px-3.5 py-2.5 text-sm bg-[#041224] text-white border border-amber-400/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 font-mono"
              />
            </div>

            <div>
              <label
                className="block text-xs font-semibold text-sky-200 mb-1.5"
                htmlFor="login-clave"
              >
                Clave de acceso
              </label>
              <input
                id="login-clave"
                type="password"
                required
                value={clave}
                onChange={(e) => setClave(e.target.value)}
                placeholder="Ingresá tu clave"
                className="w-full px-3.5 py-2.5 text-sm bg-[#041224] text-white border border-amber-400/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-sky-200 hover:text-white rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 text-sm btn-gold-luxury disabled:opacity-60 rounded-lg"
              >
                {loading ? 'Verificando...' : 'Ingresar a Cuenta'}
              </button>
            </div>
          </form>

          <div className="pt-3 border-t border-amber-400/25 space-y-3">
            <button
              type="button"
              onClick={() => {
                setRecoveryOpen((v) => !v);
                setRecoveryError(null);
              }}
              className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-amber-300 hover:text-amber-200 transition-colors"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>
                {recoveryOpen
                  ? 'Ocultar recuperación del Administrador'
                  : '¿Olvidaste tu clave de Administrador? Recuperar por Firebase Email'}
              </span>
            </button>

            {recoveryOpen && (
              <form
                onSubmit={handleSendFirebaseReset}
                className="p-4 rounded-xl bg-[#05162B] border border-amber-400/40 space-y-3"
              >
                <p className="text-xs text-sky-100 leading-relaxed">
                  Ingresá el correo privado de respaldo del Administrador para recibir un enlace oficial de restablecimiento de contraseña de Firebase Authentication.
                </p>

                {recoveryError && (
                  <div className="p-2.5 text-xs text-rose-200 bg-rose-950/60 border border-rose-500/40 rounded-lg leading-relaxed">
                    {recoveryError}
                  </div>
                )}

                {resetSentMessage && (
                  <div className="p-3 text-xs text-emerald-100 bg-emerald-950/60 border border-emerald-400/40 rounded-lg space-y-1">
                    <div className="flex items-center gap-1.5 font-semibold text-emerald-300">
                      <ShieldCheck className="w-4 h-4 shrink-0" />
                      <span>¡Correo de Firebase enviado!</span>
                    </div>
                    <p className="leading-relaxed">{resetSentMessage}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <input
                    type="email"
                    required
                    value={recoveryEmail}
                    onChange={(e) => setRecoveryEmail(e.target.value)}
                    placeholder="Email privado del Administrador..."
                    className="flex-1 px-3 py-2 text-xs bg-[#041224] text-white border border-amber-400/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-300"
                  />
                  <button
                    type="submit"
                    disabled={sendingReset}
                    className="px-3.5 py-2 text-xs btn-gold-luxury disabled:opacity-60 rounded-lg whitespace-nowrap"
                  >
                    {sendingReset ? 'Enviando...' : 'Enviar enlace'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
