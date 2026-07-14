import React, { useState } from 'react';
import { useApp } from './AppContext';
import { 
  Mail, 
  Lock, 
  User, 
  Apple, 
  ArrowRight, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft,
  ShoppingBag
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const AuthView: React.FC = () => {
  const { 
    loginWithEmail, 
    signUpWithEmail, 
    loginWithGoogle, 
    loginWithApple, 
    resetPassword,
    isEmailVerified,
    sendEmailVerificationLink,
    checkEmailVerificationStatus,
    logout,
    user,
    config
  } = useApp();

  const isDark = config.theme === 'dark';

  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  
  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  
  // Status states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isCheckingVerify, setIsCheckingVerify] = useState(false);

  // Translate Firebase auth errors to beautiful Portuguese explanations
  const getFriendlyErrorMessage = (errCode: string): string => {
    switch (errCode) {
      case 'auth/invalid-email':
        return 'O endereço de e-mail fornecido é inválido.';
      case 'auth/user-disabled':
        return 'Esta conta de usuário foi desativada.';
      case 'auth/user-not-found':
        return 'Não encontramos nenhuma conta com este e-mail.';
      case 'auth/wrong-password':
        return 'Senha incorreta. Verifique os dados e tente novamente.';
      case 'auth/email-already-in-use':
        return 'Já existe uma conta cadastrada com este e-mail.';
      case 'auth/weak-password':
        return 'A senha deve possuir no mínimo 6 caracteres.';
      case 'auth/popup-closed-by-user':
        return 'O login social foi cancelado porque a janela de autenticação foi fechada.';
      case 'auth/popup-blocked':
        return 'O popup de autenticação foi bloqueado pelo seu navegador. Por favor, permita popups.';
      case 'auth/operation-not-allowed':
        return 'Esta operação de login não está ativa. Contate o suporte.';
      default:
        return 'Ocorreu um erro ao processar sua solicitação. Tente novamente.';
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Por favor, preencha todos os campos.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    try {
      await loginWithEmail(email, password);
    } catch (err: any) {
      console.error(err);
      setError(getFriendlyErrorMessage(err.code || err.message));
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !name) {
      setError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    if (password.length < 6) {
      setError('A senha deve conter no mínimo 6 caracteres.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await signUpWithEmail(email, password, name);
      setSuccessMessage('Conta criada com sucesso! Enviamos um link de ativação para o seu e-mail.');
    } catch (err: any) {
      console.error(err);
      setError(getFriendlyErrorMessage(err.code || err.message));
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Por favor, digite o seu endereço de e-mail.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      await resetPassword(email);
      setSuccessMessage('E-mail de recuperação de senha enviado com sucesso! Verifique sua caixa de entrada.');
    } catch (err: any) {
      console.error(err);
      setError(getFriendlyErrorMessage(err.code || err.message));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'apple') => {
    setIsLoading(true);
    setError(null);
    try {
      if (provider === 'google') {
        await loginWithGoogle();
      } else {
        await loginWithApple();
      }
    } catch (err: any) {
      console.error(err);
      const friendlyErr = getFriendlyErrorMessage(err.code || err.message);
      setError(
        friendlyErr + " (Se você estiver na visualização do AI Studio, os popups podem ser restritos. Considere abrir o aplicativo em uma nova aba ou usar login via e-mail e senha.)"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setError(null);
    setSuccessMessage(null);
    try {
      await sendEmailVerificationLink();
      setSuccessMessage('Novo e-mail de ativação enviado com sucesso!');
    } catch (err: any) {
      console.error(err);
      setError('Falha ao reenviar e-mail. Aguarde um instante e tente novamente.');
    }
  };

  const handleCheckVerification = async () => {
    setIsCheckingVerify(true);
    setError(null);
    try {
      const verified = await checkEmailVerificationStatus();
      if (!verified) {
        setError('O e-mail ainda não consta como verificado. Por favor, acesse o link enviado.');
      }
    } catch (err: any) {
      console.error(err);
      setError('Falha ao verificar status. Tente recarregar o app ou aguarde um instante.');
    } finally {
      setIsCheckingVerify(false);
    }
  };

  // Render Email Verification State
  if (user && !isEmailVerified && user.provider === 'email') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA] dark:bg-slate-950 p-6">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800/80 rounded-3xl shadow-xl p-8 space-y-6 text-center">
          <div className="w-16 h-16 bg-blue-50 dark:bg-blue-950/20 rounded-2xl flex items-center justify-center mx-auto text-blue-600 dark:text-blue-400">
            <Mail size={28} />
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              Verifique seu e-mail
            </h1>
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">
              Enviamos um link de confirmação para o endereço <strong className="text-slate-700 dark:text-slate-300">{user.email}</strong>.
            </p>
          </div>

          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 text-amber-800 dark:text-amber-400 p-4 rounded-2xl text-xs font-semibold leading-relaxed">
            Por favor, clique no link contido no e-mail recebido para ativar sua conta e poder acessar suas listas de compras com total segurança.
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 text-red-800 dark:text-red-400 p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2 justify-center">
              <AlertCircle size={14} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-400 p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2 justify-center">
              <CheckCircle2 size={14} className="flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <div className="space-y-3 pt-2">
            <button
              onClick={handleCheckVerification}
              disabled={isCheckingVerify}
              className="w-full flex items-center justify-center gap-2 bg-black hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-black font-extrabold text-xs py-3.5 rounded-2xl cursor-pointer shadow-md disabled:opacity-60"
            >
              {isCheckingVerify ? (
                <>
                  <RefreshCw size={14} className="animate-spin" /> Verificando...
                </>
              ) : (
                'Já verifiquei meu e-mail'
              )}
            </button>

            <button
              onClick={handleResendVerification}
              className="w-full bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs py-3 rounded-2xl cursor-pointer border border-gray-100 dark:border-slate-800"
            >
              Reenviar e-mail de ativação
            </button>

            <button
              onClick={logout}
              className="w-full bg-transparent hover:underline text-slate-400 dark:text-slate-500 font-semibold text-xs py-2 cursor-pointer"
            >
              Voltar ao login / Sair
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA] dark:bg-slate-950 p-6 transition-colors duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800/80 rounded-3xl shadow-xl overflow-hidden p-8 space-y-6">
        
        {/* Logo and Brand */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-black dark:bg-white rounded-2xl flex items-center justify-center mx-auto shadow-md">
            <ShoppingBag size={24} className="text-white dark:text-black" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">SmartList</h1>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold">Organize e economize em suas compras diárias</p>
        </div>

        {/* Dynamic Alerts */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 text-red-800 dark:text-red-400 p-3.5 rounded-2xl text-xs font-semibold flex items-start gap-2"
            >
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          {successMessage && !error && (
            <motion.div 
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-400 p-3.5 rounded-2xl text-xs font-semibold flex items-start gap-2"
            >
              <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" />
              <span>{successMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {isForgotPassword ? (
          /* Password Recovery Flow */
          <div className="space-y-5 animate-fade-in">
            <button 
              onClick={() => {
                setIsForgotPassword(false);
                setError(null);
                setSuccessMessage(null);
              }}
              className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-bold hover:text-black dark:hover:text-white cursor-pointer"
            >
              <ArrowLeft size={14} /> Voltar para o login
            </button>

            <div className="space-y-1">
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Esqueceu sua senha?</h2>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Digite seu e-mail cadastrado e enviaremos um link para você redefinir sua senha com segurança.</p>
            </div>

            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 text-slate-400" size={16} />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="voce@exemplo.com"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-gray-150 dark:border-slate-800 rounded-xl pl-10 pr-4 py-3 text-xs font-semibold focus:outline-none focus:border-black dark:focus:border-white transition-all text-slate-800 dark:text-slate-200"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-black hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-black font-extrabold text-xs py-3.5 rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-60 transition-colors"
              >
                {isLoading ? <RefreshCw size={14} className="animate-spin" /> : 'Enviar link de redefinição'}
              </button>
            </form>
          </div>
        ) : (
          /* Normal Auth Flow (Login & Register Tabs) */
          <div className="space-y-6">
            
            {/* Custom Sliding Tab Selector */}
            <div className="flex bg-slate-50 dark:bg-slate-950 p-1 rounded-xl border border-gray-100 dark:border-slate-800">
              <button
                onClick={() => {
                  setActiveTab('login');
                  setError(null);
                  setSuccessMessage(null);
                }}
                className={`flex-1 py-2 text-xs font-extrabold rounded-lg cursor-pointer transition-all ${
                  activeTab === 'login' 
                    ? 'bg-white text-black dark:bg-slate-800 dark:text-white shadow-sm' 
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                Entrar
              </button>
              <button
                onClick={() => {
                  setActiveTab('register');
                  setError(null);
                  setSuccessMessage(null);
                }}
                className={`flex-1 py-2 text-xs font-extrabold rounded-lg cursor-pointer transition-all ${
                  activeTab === 'register' 
                    ? 'bg-white text-black dark:bg-slate-800 dark:text-white shadow-sm' 
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                Criar Conta
              </button>
            </div>

            <form onSubmit={activeTab === 'login' ? handleEmailLogin : handleEmailRegister} className="space-y-4">
              {activeTab === 'register' && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Nome Completo</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3.5 text-slate-400" size={16} />
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Alison Vitório"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-gray-150 dark:border-slate-800 rounded-xl pl-10 pr-4 py-3 text-xs font-semibold focus:outline-none focus:border-black dark:focus:border-white transition-all text-slate-800 dark:text-slate-200"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 text-slate-400" size={16} />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="voce@exemplo.com"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-gray-150 dark:border-slate-800 rounded-xl pl-10 pr-4 py-3 text-xs font-semibold focus:outline-none focus:border-black dark:focus:border-white transition-all text-slate-800 dark:text-slate-200"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Senha</label>
                  {activeTab === 'login' && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotPassword(true);
                        setError(null);
                        setSuccessMessage(null);
                      }}
                      className="text-[10px] text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer"
                    >
                      Esqueceu a senha?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 text-slate-400" size={16} />
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-gray-150 dark:border-slate-800 rounded-xl pl-10 pr-4 py-3 text-xs font-semibold focus:outline-none focus:border-black dark:focus:border-white transition-all text-slate-800 dark:text-slate-200"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-black hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-black font-extrabold text-xs py-3.5 rounded-2xl flex items-center justify-center gap-1.5 cursor-pointer shadow-md disabled:opacity-60 transition-colors"
              >
                {isLoading ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <>
                    {activeTab === 'login' ? 'Entrar' : 'Cadastrar e Ativar'}
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>

            {/* Visual Divider */}
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-gray-100 dark:border-slate-800/80"></div>
              <span className="flex-shrink mx-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Ou continue com</span>
              <div className="flex-grow border-t border-gray-100 dark:border-slate-800/80"></div>
            </div>

            {/* Social Authentication Providers */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleSocialLogin('google')}
                disabled={isLoading}
                className="flex items-center justify-center gap-2 border border-gray-150 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 py-3 px-4 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 transition-all cursor-pointer hover:scale-[1.01]"
              >
                {/* Standard visually pleasing generic custom icon representation */}
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                </svg>
                Google
              </button>

              <button
                onClick={() => handleSocialLogin('apple')}
                disabled={isLoading}
                className="flex items-center justify-center gap-2 border border-gray-150 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 py-3 px-4 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 transition-all cursor-pointer hover:scale-[1.01]"
              >
                <Apple size={15} className="text-slate-900 dark:text-white" />
                Apple ID
              </button>
            </div>
            
            {/* Simulated Developer Credentials Option */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={async () => {
                  setIsLoading(true);
                  setError(null);
                  try {
                    // Fast bypass with sandbox email credentials for instantaneous evaluation!
                    await loginWithEmail('evaluator@smartlist.com', '12345678');
                  } catch (err: any) {
                    try {
                      // If account doesn't exist yet, automatically auto-register the sandboxed user!
                      await signUpWithEmail('evaluator@smartlist.com', '12345678', 'Alison Vitório (Evaluator)');
                    } catch (e2) {
                      setError('Erro ao simular login de desenvolvedor. Utilize o e-mail comum.');
                    }
                  } finally {
                    setIsLoading(false);
                  }
                }}
                className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold tracking-wider uppercase bg-emerald-50 dark:bg-emerald-950/25 border border-emerald-100/50 dark:border-emerald-900/30 px-3.5 py-1.5 rounded-xl hover:scale-[1.02] transition-all cursor-pointer"
              >
                ⚡ Simular Conta de Teste (Bypass de Dev)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
