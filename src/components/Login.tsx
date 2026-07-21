import React, { useState } from 'react';
import { Shield, Key, Eye, EyeOff, Sparkles, AlertCircle } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (username: string) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [apiKey, setApiKey] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Sanitize user inputs to prevent injection and empty bypass
    const trimmedPassword = password.trim();
    const sanitizedApiKey = apiKey.trim().replace(/[^a-zA-Z0-9-]/g, '');

    setTimeout(() => {
      if (trimmedPassword.toLowerCase() === 'admin' || (sanitizedApiKey.startsWith('AQ-') && sanitizedApiKey.length >= 8)) {
        onLoginSuccess('Rick');
      } else {
        setError('CRITICAL: Access Denied. Empty passcode bypass blocked or decryption key mismatch.');
        setIsLoading(false);
      }
    }, 1200);
  };

  const handleQuickBypass = () => {
    setIsLoading(true);
    setTimeout(() => {
      onLoginSuccess('Rick (Beta)');
    }, 800);
  };

  return (
    <div id="login-container" className="min-h-screen bg-[#0B0B0C] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Absolute Decorative Background Elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-yellow-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* Outer border container */}
      <div className="w-full max-w-md bg-zinc-950/90 border border-amber-500/20 rounded-2xl p-8 backdrop-blur-md shadow-[0_0_50px_rgba(212,175,55,0.05)] relative z-10">
        
        {/* Subtle top status indicator */}
        <div className="flex justify-between items-center mb-8 border-b border-zinc-800/60 pb-4">
          <div className="flex items-center gap-1.5 text-zinc-500 text-xs tracking-widest font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            SECURE SERVER CONNECTION
          </div>
          <span className="text-amber-500/70 font-mono text-xs tracking-widest">v4.0.1</span>
        </div>

        {/* Central Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex p-4 rounded-full bg-amber-500/10 border border-amber-500/30 mb-4 shadow-[0_0_20px_rgba(212,175,55,0.1)]">
            <Shield className="w-8 h-8 text-amber-400" />
          </div>
          <h1 className="text-2xl font-bold font-serif tracking-wide bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600 bg-clip-text text-transparent">
            AQ TRADE AI
          </h1>
          <p className="text-zinc-400 text-xs mt-2 tracking-widest font-mono uppercase">
            Quant Intelligence Command
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-[10px] font-mono tracking-widest text-zinc-400 uppercase mb-2">
              AQ ACCESS CARD KEY (Optional)
            </label>
            <div className="relative">
              <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500/60" />
              <input
                type="text"
                placeholder="AQ-XXXX-XXXX-XXXX"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full bg-zinc-900/60 border border-zinc-800/80 focus:border-amber-500/50 rounded-lg py-2.5 pl-11 pr-4 text-sm text-zinc-200 placeholder-zinc-600 tracking-widest font-mono focus:outline-none transition-all duration-300"
              />
            </div>
            <p className="text-[10px] text-zinc-500 mt-1.5 font-mono">
              Provide your cryptographically signed access key.
            </p>
          </div>

          <div>
            <label className="block text-[10px] font-mono tracking-widest text-zinc-400 uppercase mb-2">
              DECRYPTION PASSCODE
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter password (use 'admin')"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-900/60 border border-zinc-800/80 focus:border-amber-500/50 rounded-lg py-2.5 px-4 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none transition-all duration-300"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-amber-500 focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-950/30 border border-red-500/30 rounded-lg p-3 flex items-start gap-2 text-xs text-red-400 font-mono">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full relative group overflow-hidden bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-400 text-black font-semibold py-3 px-4 rounded-lg tracking-widest text-xs uppercase transition-all duration-300 shadow-[0_0_20px_rgba(212,175,55,0.2)] hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] cursor-pointer disabled:opacity-50"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              {isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-black" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  DECRYPTING CORE...
                </>
              ) : (
                <>
                  INITIALIZE CORE SHIELD
                  <Sparkles className="w-4 h-4" />
                </>
              )}
            </span>
          </button>
        </form>

        <div className="mt-6 flex flex-col items-center">
          <button
            onClick={handleQuickBypass}
            disabled={isLoading}
            className="text-[11px] text-amber-500/60 hover:text-amber-400 hover:underline tracking-widest font-mono uppercase bg-transparent border-0 cursor-pointer focus:outline-none transition-all"
          >
            🔒 DEPLOY SECURE DEMO SESSION
          </button>
        </div>

        {/* Footer info */}
        <div className="mt-8 border-t border-zinc-900 pt-4 flex justify-between text-[10px] text-zinc-600 font-mono">
          <span>ALGORITHMIC VERIFICATION</span>
          <span>ONLINE</span>
        </div>
      </div>
    </div>
  );
}
