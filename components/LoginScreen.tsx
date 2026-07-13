import React, { useState, useEffect } from 'react';
import { Lock, Mail, Eye, EyeOff, PenLine, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { getApiConfig, login, setToken, saveApiConfig } from '../services/storageService';

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    const checkExistingSession = async () => {
      const config = getApiConfig();
      if (config.isEnabled && config.url && config.token && config.email && config.password) {
        try {
          setToken(config.token);
          onLoginSuccess();
        } catch (e) {
          console.error('Session check failed:', e);
        }
      }
    };
    checkExistingSession();
  }, [onLoginSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const config = getApiConfig();

      if (!config.url || !config.isEnabled) {
        setError('API não configurada. Acesse as Configurações e configure o endereço do servidor.');
        setIsLoading(false);
        return;
      }

      const result = await login(email.trim(), password);

      setToken(result.token);

      if (rememberMe) {
        await saveApiConfig({ ...config, email: email.trim(), password: password, token: result.token });
      }

      onLoginSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao conectar. Verifique sua conexão.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#1B2430] via-[#233043] to-[#2C5AC7] p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djJoLTJ2LTJoMnptLTQtNHYyaC0ydi0yaDJ6bTggNHYyaC0ydi0yaDJ6bS04IDh2MmgtMnYtMmgyeiIvPjwvZzwvL2c+PC9zdmc+')] opacity-30"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-white/10 backdrop-blur-sm p-3 rounded-lg">
              <PenLine className="w-8 h-8 text-white" />
            </div>
            <span className="font-display text-2xl font-semibold text-white tracking-tight">Luciano's Scribe</span>
          </div>

          <h1 className="font-display text-4xl font-semibold text-white mb-4 leading-tight">
            Sua plataforma de<br/>
            <span className="text-[#9DBBF5]">escrita criativa</span>
          </h1>
          <p className="text-[#B8CCF0] text-lg max-w-md">
            Organize seus textos, explore recursos de IA e desenvolva sua criatividade com segurança.
          </p>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 text-[#B8CCF0] text-sm">
            <Sparkles className="w-4 h-4" />
            <span>Acesso seguro com criptografia</span>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 bg-[#F3F5F8]">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="bg-[#3B6FE0] p-2 rounded-lg">
              <PenLine className="w-6 h-6 text-white" />
            </div>
            <span className="font-display text-xl font-semibold text-slate-900">Luciano's Scribe</span>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8 border border-[#DEE3EA]">
            <div className="text-center mb-8">
              <div className="bg-[#E8EFFC] w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-7 h-7 text-[#3B6FE0]" />
              </div>
              <h2 className="font-display text-2xl font-semibold text-slate-900">Bem-vindo de volta</h2>
              <p className="text-slate-500 mt-2">Entre com suas credenciais para acessar</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    className="block w-full pl-12 pr-4 py-3 bg-[#F8FAFD] border border-[#DEE3EA] rounded-md focus:ring-2 focus:ring-[#3B6FE0] focus:border-[#3B6FE0] transition-all outline-none text-slate-800 placeholder:text-slate-400"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-2">
                  Senha
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    className="block w-full pl-12 pr-12 py-3 bg-[#F8FAFD] border border-[#DEE3EA] rounded-md focus:ring-2 focus:ring-[#3B6FE0] focus:border-[#3B6FE0] transition-all outline-none text-slate-800 placeholder:text-slate-400"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-[#3B6FE0] rounded border-slate-300 focus:ring-[#3B6FE0]"
                  />
                  <span className="text-sm text-slate-600">Lembrar-me</span>
                </label>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#3B6FE0] text-white py-3.5 rounded-md font-semibold hover:bg-[#2C5AC7] active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  'Entrar'
                )}
              </button>
            </form>

            <p className="text-center text-sm text-slate-500 mt-6">
              Precisa de ajuda? Entre em contato com o administrador.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
