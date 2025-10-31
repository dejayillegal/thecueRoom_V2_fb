
/**
 * DEPRECATED: This file has been replaced by AuthModal.tsx
 * 
 * DO NOT USE OR IMPORT THIS FILE.
 * 
 * Migration date: 2025-01-31
 * Use: @/src/components/Auth/AuthModal instead
 */

type View = 'signin' | 'signup' | 'forgot';

interface SignInModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SignInModal({ isOpen, onOpenChange }: SignInModalProps) {
  throw new Error('SignInModal is deprecated. Use AuthModal from @/src/components/Auth/AuthModal instead.');
  const { user, signIn, signUp, signInWithGoogle, signInWithApple, resetPassword } = useAuth();
  const router = useRouter();

  const [view, setView] = useState<View>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState('signin');

  useEffect(() => {
    if (isOpen) {
      setError('');
      setSuccessMessage('');
      setView('signin');
      setActiveTab('signin');
      setEmail('');
      setPassword('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (user) {
      onOpenChange(false);
      router.push('/dashboard');
    }
  }, [user, router, onOpenChange]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      if (view === 'signin') {
        await signIn(email, password);
      } else if (view === 'signup') {
        await signUp(email, password);
      } else if (view === 'forgot') {
        await resetPassword(email);
        setSuccessMessage('Password reset email sent. Please check your inbox.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setIsLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setError('');
    setIsLoading(true);
    try {
      await signInWithApple();
    } catch (err: any) {
      setError(err.message || 'Apple sign-in failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md">
      <div className="relative w-full max-w-[920px] max-h-[90vh] bg-[#0F0F0F] border border-[#262626] rounded-2xl shadow-2xl flex flex-col">
        <button
          onClick={() => onOpenChange(false)}
          className="absolute top-4 right-4 z-10 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="grid md:grid-cols-[1fr_340px] overflow-hidden flex-1">
          {/* Left Panel - Auth Forms */}
          <div className="p-8 md:p-10 overflow-y-auto">
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4">
                {view === 'signin' && 'Sign In'}
                {view === 'signup' && 'Create Account'}
                {view === 'forgot' && 'Reset Password'}
              </h2>
              
              {view !== 'forgot' && (
                <div className="flex gap-2 mb-6">
                  <button
                    onClick={() => { setView('signin'); setActiveTab('signin'); }}
                    className={`px-4 py-2 text-sm font-medium transition-colors rounded ${
                      activeTab === 'signin'
                        ? 'bg-[#D7FF3C] text-black'
                        : 'bg-transparent text-gray-400 hover:text-white'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => { setView('signup'); setActiveTab('signup'); }}
                    className={`px-4 py-2 text-sm font-medium transition-colors rounded ${
                      activeTab === 'signup'
                        ? 'bg-[#D7FF3C] text-black'
                        : 'bg-transparent text-gray-400 hover:text-white'
                    }`}
                  >
                    Sign Up
                  </button>
                </div>
              )}
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-900/20 border border-red-700/50 rounded-lg flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-200">{error}</p>
              </div>
            )}

            {successMessage && (
              <div className="mb-4 p-3 bg-green-900/20 border border-green-700/50 rounded-lg flex items-start gap-2">
                <Info className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-green-200">{successMessage}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#D7FF3C] focus:border-transparent"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              {view !== 'forgot' && (
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#D7FF3C] focus:border-transparent"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>
              )}

              {view === 'signin' && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setView('forgot')}
                    className="text-sm text-[#D7FF3C] hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#D7FF3C] text-black font-semibold py-2.5 rounded-lg hover:bg-[#c5ed2a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Loading...' : view === 'signin' ? 'Sign In' : view === 'signup' ? 'Sign Up' : 'Send Reset Link'}
              </button>

              {view === 'forgot' && (
                <button
                  type="button"
                  onClick={() => setView('signin')}
                  className="w-full text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Back to Sign In
                </button>
              )}
            </form>

            {view !== 'forgot' && (
              <>
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[#2a2a2a]"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-[#0F0F0F] px-2 text-gray-500">OR CONTINUE WITH</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                    className="w-full bg-transparent border border-[#2a2a2a] text-white py-2.5 rounded-lg hover:bg-[#1a1a1a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Google
                  </button>

                  <button
                    type="button"
                    onClick={handleAppleSignIn}
                    disabled={isLoading}
                    className="w-full bg-transparent border border-[#2a2a2a] text-white py-2.5 rounded-lg hover:bg-[#1a1a1a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                    </svg>
                    Apple
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Right Panel - Info */}
          <div className="bg-[#1a1a1a] border-l border-[#2a2a2a] p-8 flex flex-col justify-center">
            <h3 className="text-lg font-semibold text-white mb-4">Welcome to thecueRoom</h3>
            <p className="text-sm text-gray-300 mb-6">
              Invite-first platform. Approved members get access to the gated dashboard.
            </p>
            
            <ul className="space-y-3 text-sm text-gray-400">
              <li className="flex items-start gap-2">
                <span className="text-[#D7FF3C] mt-0.5">■</span>
                <span>Reduced motion respected.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#D7FF3C] mt-0.5">■</span>
                <span>WCAG AA contrast on dark.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
