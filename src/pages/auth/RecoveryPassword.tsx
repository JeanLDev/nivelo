import React, { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { supabase } from '@/src/lib/supabase';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isRecovery, setIsRecovery] = useState(null);

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
          console.log('Modo recuperação de senha ativado');
          setIsRecovery(true);
        }

        // fallback (alguns casos não disparam PASSWORD_RECOVERY)
        if (event === 'SIGNED_IN' && session) {
          setIsRecovery(true);
        }
      }
    );

    // fallback extra (caso já tenha sessão restaurada)
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        setIsRecovery(false);
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e) => {
  e.preventDefault();

  setStatus({ type: '', message: '' });

  if (password.length < 6) {
    return setStatus({
      type: 'error',
      message: 'A senha deve ter pelo menos 6 caracteres.',
    });
  }

  if (password !== confirmPassword) {
    return setStatus({
      type: 'error',
      message: 'As senhas não coincidem.',
    });
  }

  // 🔥 Atualiza senha
  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    console.error(error);

    return setStatus({
      type: 'error',
      message: 'Erro ao atualizar senha. Link expirado ou inválido.',
    });
  }

  setStatus({
    type: 'success',
    message: 'Senha redefinida com sucesso!',
  });

  setPassword('');
  setConfirmPassword('');
  };
  if (isRecovery === null) {
    return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
    </div>)
  }

  if (isRecovery === false) {
    return (
      <p className="text-center mt-10 text-red-500">
        Link inválido ou expirado.
      </p>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white border border-gray-200 shadow-sm rounded-md p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-blue-50 p-3 rounded-full mb-4">
            <Lock className="w-6 h-6 text-blue-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Nova Senha</h1>
          <p className="text-sm text-gray-500 text-center mt-1">
            Crie uma senha forte para proteger sua conta.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Nova Senha</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Confirmar Senha</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-md transition-colors shadow-sm"
          >
            Atualizar Senha
          </button>
        </form>

        {status.message && (
          <div className={`mt-6 p-3 text-sm text-center rounded-md ${
            status.type === 'error' 
              ? 'bg-red-50 text-red-700 border border-red-100' 
              : 'bg-green-50 text-green-700 border border-green-100'
          }`}>
            {status.message}
          </div>
        )}
      </div>
    </div>
  );
}

