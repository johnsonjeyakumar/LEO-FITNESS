import React, { useState } from 'react';
import { useAuth } from '../services/AuthContext';
import { Mail, Lock, Loader2, User, Eye, EyeOff, Dumbbell } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  setAuthView: (view: 'login' | 'signup' | 'forgot-password') => void;
}

const SignUp: React.FC<Props> = ({ setAuthView }) => {
  const { signup } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await signup(email.trim(), password, fullName.trim());
    } catch (err: any) {
      console.error('Registration error', err);
      // Friendly messages for Firebase errors
      if (err.code === 'auth/email-already-in-use') {
        setError('An account already exists with this email.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else if (err.code === 'auth/weak-password') {
        setError('Please choose a stronger password.');
      } else if (err.code === 'auth/network-request-failed') {
        setError('Network error. Check your internet connection.');
      } else if (err.code === 'auth/configuration-not-found') {
        setError('Firebase Authentication is not configured/enabled. Please enable the Email/Password sign-in method in the Firebase Console.');
      } else {
        setError(err.message || 'An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-black relative overflow-hidden font-sans">
      {/* Background visual graphics */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070&auto=format&fit=crop"
          className="w-full h-full object-cover opacity-20 filter grayscale contrast-125"
          alt="Gym Background"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/85 to-transparent" />
      </div>

      <div className="absolute top-10 left-10 z-10 flex items-center gap-3">
        <div className="w-10 h-10 bg-primary rounded flex items-center justify-center font-display font-bold text-2xl text-black">L</div>
        <span className="text-2xl font-display font-bold text-white tracking-tighter uppercase">LEO <span className="text-primary">.AI</span></span>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, type: 'spring', stiffness: 100 }}
        className="w-full max-w-md bg-card/65 backdrop-blur-md border border-white/5 rounded-2xl p-8 z-10 shadow-2xl relative"
      >
        {/* Glow accent */}
        <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -right-10 w-40 h-40 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

        <div className="text-center mb-8 relative">
          <div className="w-16 h-16 bg-white/5 rounded-2xl mx-auto flex items-center justify-center border border-white/10 mb-4 text-primary">
            <Dumbbell size={32} />
          </div>
          <h2 className="text-3xl font-display font-bold text-white uppercase tracking-tight">Create Profile</h2>
          <p className="text-gray-400 text-sm mt-1">Register to start your transformation protocol</p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 mb-6 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs font-semibold"
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs text-primary font-bold uppercase tracking-wider block">Full Name</label>
            <div className="relative">
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                disabled={loading}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-5 py-3 focus:border-primary/50 focus:bg-white/10 focus:ring-1 focus:ring-primary/50 outline-none text-white placeholder-gray-600 transition-all text-sm disabled:opacity-55"
              />
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-primary font-bold uppercase tracking-wider block">Email Address</label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                disabled={loading}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-5 py-3 focus:border-primary/50 focus:bg-white/10 focus:ring-1 focus:ring-primary/50 outline-none text-white placeholder-gray-600 transition-all text-sm disabled:opacity-55"
              />
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-primary font-bold uppercase tracking-wider block">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                disabled={loading}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-12 py-3 focus:border-primary/50 focus:bg-white/10 focus:ring-1 focus:ring-primary/50 outline-none text-white placeholder-gray-600 transition-all text-sm disabled:opacity-55"
              />
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-primary font-bold uppercase tracking-wider block">Confirm Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                disabled={loading}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-5 py-3 focus:border-primary/50 focus:bg-white/10 focus:ring-1 focus:ring-primary/50 outline-none text-white placeholder-gray-600 transition-all text-sm disabled:opacity-55"
              />
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-primary to-orange-600 text-black font-display font-bold text-lg uppercase py-4 mt-6 rounded-xl hover:shadow-lg hover:shadow-orange-900/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                REGISTERING...
              </>
            ) : (
              'INITIATE PROTOCOL'
            )}
          </motion.button>
        </form>

        <div className="mt-8 text-center text-sm">
          <p className="text-gray-500">
            Already registered?{' '}
            <button
              onClick={() => setAuthView('login')}
              className="text-primary hover:underline font-bold"
            >
              Login
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default SignUp;
