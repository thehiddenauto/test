import React, { useState, useEffect, createContext, useContext, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { HelmetProvider, Helmet } from 'react-helmet-async';
import { createClient } from '@supabase/supabase-js';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import emailjs from 'emailjs-com';

import { 
  Play, Video, Image, Settings, User, LogOut, Menu, X, Upload, Download, Search, Filter, Plus, Trash2, 
  Eye, EyeOff, Lock, Mail, UserPlus, Zap, Clock, BarChart3, Folder, Star, Heart, Share2, Edit3,
  ChevronDown, AlertCircle, CheckCircle, XCircle, Loader2, Sparkles, Wand2, Film, Camera, Layers,
  Wifi, WifiOff, RefreshCw, Home, Activity, Globe, TrendingUp, Award, Shield, Monitor, Crown, Rocket,
  ArrowRight, CheckCircle2, Users, Mic, MessageSquare, Brain, Target, Lightbulb, Palette, Copy,
  CreditCard, Mail as MailIcon, Phone, MapPin, ExternalLink, Github, Twitter, Linkedin, Instagram
} from 'lucide-react';

// Environment Configuration with Validation
const validateEnvVars = () => {
  const required = {
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
    VITE_STRIPE_PUBLISHABLE_KEY: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
    VITE_EMAILJS_SERVICE_ID: import.meta.env.VITE_EMAILJS_SERVICE_ID,
    VITE_EMAILJS_TEMPLATE_ID: import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
    VITE_EMAILJS_USER_ID: import.meta.env.VITE_EMAILJS_USER_ID,
  };

  const missing = Object.entries(required)
    .filter(([key, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing);
    if (import.meta.env.NODE_ENV === 'production') {
      throw new Error(`Missing environment variables: ${missing.join(', ')}`);
    }
  }

  return required;
};

const envVars = validateEnvVars();

const config = {
  supabaseUrl: envVars.VITE_SUPABASE_URL,
  supabaseAnonKey: envVars.VITE_SUPABASE_ANON_KEY,
  stripePublishableKey: envVars.VITE_STRIPE_PUBLISHABLE_KEY,
  emailjsServiceId: envVars.VITE_EMAILJS_SERVICE_ID,
  emailjsTemplateId: envVars.VITE_EMAILJS_TEMPLATE_ID,
  emailjsUserId: envVars.VITE_EMAILJS_USER_ID,
  apiBaseUrl: import.meta.env.VITE_API_URL || 'https://backend-9g44.onrender.com',
  appName: import.meta.env.VITE_APP_NAME || 'Influencore',
  appVersion: import.meta.env.VITE_APP_VERSION || '2.0.0',
  enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  environment: import.meta.env.NODE_ENV || 'production'
};

// Initialize services
let supabase = null;
let stripePromise = null;

try {
  if (config.supabaseUrl && config.supabaseAnonKey) {
    supabase = createClient(config.supabaseUrl, config.supabaseAnonKey);
  }
  
  if (config.stripePublishableKey) {
    stripePromise = loadStripe(config.stripePublishableKey);
  }
  
  if (config.emailjsUserId) {
    emailjs.init(config.emailjsUserId);
  }
} catch (error) {
  console.error('Service initialization error:', error);
}

// Enhanced Zustand Store
const useAppStore = create(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      networkStatus: navigator.onLine,
      theme: 'light',
      videos: [],
      subscription: null,
      currentPage: 'home',
      sidebarOpen: false,
      
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setLoading: (isLoading) => set({ isLoading }),
      setNetworkStatus: (networkStatus) => set({ networkStatus }),
      setCurrentPage: (currentPage) => set({ currentPage }),
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      setSubscription: (subscription) => set({ subscription }),
      addVideo: (video) => set((state) => ({ videos: [video, ...state.videos] })),
      removeVideo: (id) => set((state) => ({ videos: state.videos.filter(v => v.id !== id) })),
      
      logout: async () => {
        if (supabase) {
          await supabase.auth.signOut();
        }
        set({ user: null, isAuthenticated: false, subscription: null });
        toast.success('Signed out successfully');
      }
    }),
    {
      name: 'influencore-storage',
      partialize: (state) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated,
        subscription: state.subscription,
        theme: state.theme 
      }),
    }
  )
);

// Enhanced Error Boundary
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, retryCount: 0 };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Application Error:', error, errorInfo);
    
    // Auto-retry mechanism
    if (this.state.retryCount < 3) {
      setTimeout(() => {
        this.setState({ 
          hasError: false, 
          error: null, 
          retryCount: this.state.retryCount + 1 
        });
      }, 2000);
    }
  }

  render() {
    if (this.state.hasError && this.state.retryCount >= 3) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center border border-slate-200"
          >
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Shield className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">Something went wrong</h2>
            <p className="text-slate-600 mb-8">We're working to fix this issue. Please refresh the page.</p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              Refresh Page
            </button>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Enhanced Authentication Context
const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const { user, setUser, setLoading, logout } = useAppStore();
  const [session, setSession] = useState(null);

  useEffect(() => {
    if (!supabase) return;

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        setUser(session.user);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      if (session?.user) {
        setUser(session.user);
        toast.success(`Welcome ${session.user.email}!`);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [setUser, setLoading]);

  const signUp = async (email, password, userData = {}) => {
    if (!supabase) throw new Error('Supabase not configured');
    
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData
        }
      });

      if (error) throw error;

      // Send welcome email
      if (config.emailjsServiceId) {
        await emailjs.send(
          config.emailjsServiceId,
          config.emailjsTemplateId,
          {
            to_email: email,
            to_name: userData.name || email,
            message: 'Welcome to Influencore! Your account has been created successfully.'
          }
        );
      }

      toast.success('Account created! Please check your email for verification.');
      return data;
    } catch (error) {
      toast.error(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email, password) => {
    if (!supabase) throw new Error('Supabase not configured');
    
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      
      return data;
    } catch (error) {
      toast.error(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await logout();
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session,
      signUp, 
      signIn, 
      signOut,
      isAuthenticated: !!user 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// UI Components
const LoadingSpinner = ({ size = 'md', text = '', className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <Loader2 className={`${sizeClasses[size]} animate-spin text-blue-600`} />
      {text && <p className="text-sm text-slate-600 font-medium">{text}</p>}
    </div>
  );
};

const Alert = ({ type = 'info', children, onClose, className = '' }) => {
  const typeStyles = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  };

  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertCircle,
    info: AlertCircle
  };

  const Icon = icons[type];

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`border rounded-xl p-4 ${typeStyles[type]} flex items-start gap-3 ${className}`}
    >
      <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
      <div className="flex-1 text-sm font-medium">{children}</div>
      {onClose && (
        <button onClick={onClose} className="flex-shrink-0 hover:opacity-70 transition-opacity">
          <X className="w-4 h-4" />
        </button>
      )}
    </motion.div>
  );
};

const NetworkStatus = () => {
  const { networkStatus } = useAppStore();

  if (networkStatus) return null;

  return (
    <motion.div 
      initial={{ y: -50 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 bg-red-600 text-white px-4 py-3 text-center z-50 shadow-lg"
    >
      <div className="flex items-center justify-center gap-2">
        <WifiOff className="w-4 h-4" />
        <span className="text-sm font-medium">No internet connection</span>
      </div>
    </motion.div>
  );
};

const FormInput = ({ 
  label, 
  type = 'text', 
  name, 
  value, 
  onChange, 
  placeholder, 
  required = false, 
  disabled = false,
  icon: Icon,
  showPasswordToggle = false,
  error,
  ...props 
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const inputType = showPasswordToggle ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="space-y-2">
      <label htmlFor={name} className="block text-sm font-semibold text-slate-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
        )}
        <input
          id={name}
          type={inputType}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={`w-full ${Icon ? 'pl-12' : 'pl-4'} ${showPasswordToggle ? 'pr-12' : 'pr-4'} py-4 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-slate-900 placeholder-slate-400 ${
            error 
              ? 'border-red-300 bg-red-50' 
              : 'border-slate-300 bg-white hover:border-slate-400'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          {...props}
        />
        {showPasswordToggle && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            disabled={disabled}
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        )}
      </div>
      {error && (
        <p className="text-sm text-red-600 font-medium flex items-center gap-1">
          <AlertCircle className="w-4 h-4" />
          {error}
        </p>
      )}
    </div>
  );
};

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  disabled = false, 
  loading = false, 
  icon: Icon,
  className = '',
  ...props 
}) => {
  const variants = {
    primary: 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-lg',
    secondary: 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    ghost: 'text-slate-600 hover:bg-slate-100'
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      disabled={disabled || loading}
      className={`
        ${variants[variant]}
        ${sizes[size]}
        rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2
        disabled:opacity-50 disabled:cursor-not-allowed
        focus:outline-none focus:ring-2 focus:ring-blue-500
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <LoadingSpinner size="sm" />
      ) : (
        Icon && <Icon className="w-5 h-5" />
      )}
      {children}
    </motion.button>
  );
};

// SEO Component
const SEO = ({ title, description, image, url }) => (
  <Helmet>
    <title>{title} | {config.appName}</title>
    <meta name="description" content={description} />
    <meta name="keywords" content="AI video generation, content creation, influencer tools, social media, viral videos" />
    
    {/* Open Graph */}
    <meta property="og:title" content={`${title} | ${config.appName}`} />
    <meta property="og:description" content={description} />
    <meta property="og:image" content={image || '/og-image.jpg'} />
    <meta property="og:url" content={url || window.location.href} />
    <meta property="og:type" content="website" />
    
    {/* Twitter */}
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content={`${title} | ${config.appName}`} />
    <meta name="twitter:description" content={description} />
    <meta name="twitter:image" content={image || '/og-image.jpg'} />
    
    {/* Additional SEO */}
    <meta name="robots" content="index, follow" />
    <meta name="author" content={config.appName} />
    <link rel="canonical" href={url || window.location.href} />
  </Helmet>
);

// Landing Page Component
const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <>
      <SEO 
        title="AI Video Generation Platform"
        description="Create viral videos with AI using Google Veo 3, OpenAI Sora, and advanced AI models. Join 10,000+ creators making viral content."
      />
      
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        {/* Header */}
        <header className="relative z-10 bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  {config.appName}
                </h1>
              </div>
              
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate('/auth/login')}
                  className="text-gray-700 hover:text-gray-900 font-medium transition-colors hidden sm:block"
                >
                  Sign In
                </button>
                <Button
                  onClick={() => navigate('/auth/register')}
                  size="md"
                  icon={Rocket}
                >
                  Start Free
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <main className="relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 md:pt-20 pb-16">
            <div className="text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-800 text-sm font-semibold mb-8"
              >
                <Crown className="w-4 h-4 mr-2" />
                Launch Week: 50% Off Pro Plans
              </motion.div>
              
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 leading-tight mb-6"
              >
                Create Viral{' '}
                <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Influencer
                </span>{' '}
                Videos with AI
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-xl md:text-2xl text-gray-600 leading-relaxed mb-8 max-w-3xl mx-auto"
              >
                Transform your ideas into stunning, viral-ready content in seconds. Join 10,000+ creators using AI to dominate social media and scale their influence.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
              >
                <Button
                  onClick={() => navigate('/auth/register')}
                  size="lg"
                  className="text-lg px-12 py-5 shadow-2xl font-bold"
                  icon={Sparkles}
                >
                  Try Free for 7 Days
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  className="text-lg px-12 py-5 font-bold"
                  icon={Play}
                  onClick={() => navigate('/demo')}
                >
                  Watch Demo
                </Button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500 mb-16"
              >
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-500" />
                  <span className="font-medium">10,000+ creators</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500 fill-                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  <span className="text-sm text-gray-600">5.0</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">InfluenCore</h3>
              <p className="text-gray-400">Connecting brands with authentic creators.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">For Brands</a></li>
                <li><a href="#" className="hover:text-white">For Creators</a></li>
                <li><a href="#" className="hover:text-white">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">About Us</a></li>
                <li><a href="#" className="hover:text-white">Careers</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400">
            <p>&copy; 2024 InfluenCore. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
