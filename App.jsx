import React, { useState, useEffect, createContext, useContext, useCallback, Suspense, lazy } from 'react';
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
const requiredEnvVars = {
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
  VITE_STRIPE_PUBLISHABLE_KEY: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
  VITE_EMAILJS_SERVICE_ID: import.meta.env.VITE_EMAILJS_SERVICE_ID,
  VITE_EMAILJS_TEMPLATE_ID: import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
  VITE_EMAILJS_USER_ID: import.meta.env.VITE_EMAILJS_USER_ID,
  VITE_API_URL: import.meta.env.VITE_API_URL || 'https://backend-9g44.onrender.com'
};

// Validate required environment variables
const missingEnvVars = Object.entries(requiredEnvVars)
  .filter(([key, value]) => !value)
  .map(([key]) => key);

if (missingEnvVars.length > 0 && import.meta.env.NODE_ENV === 'production') {
  console.error('Missing required environment variables:', missingEnvVars);
}

const config = {
  supabaseUrl: requiredEnvVars.VITE_SUPABASE_URL,
  supabaseAnonKey: requiredEnvVars.VITE_SUPABASE_ANON_KEY,
  stripePublishableKey: requiredEnvVars.VITE_STRIPE_PUBLISHABLE_KEY,
  emailjsServiceId: requiredEnvVars.VITE_EMAILJS_SERVICE_ID,
  emailjsTemplateId: requiredEnvVars.VITE_EMAILJS_TEMPLATE_ID,
  emailjsUserId: requiredEnvVars.VITE_EMAILJS_USER_ID,
  apiBaseUrl: requiredEnvVars.VITE_API_URL,
  appName: import.meta.env.VITE_APP_NAME || 'Influencore',
  appVersion: import.meta.env.VITE_APP_VERSION || '2.0.0',
  enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  enableDebug: import.meta.env.NODE_ENV === 'development',
  environment: import.meta.env.NODE_ENV || 'production'
};

// Initialize Supabase Client
const supabase = config.supabaseUrl && config.supabaseAnonKey 
  ? createClient(config.supabaseUrl, config.supabaseAnonKey)
  : null;

// Initialize Stripe
const stripePromise = config.stripePublishableKey 
  ? loadStripe(config.stripePublishableKey)
  : null;

// Initialize EmailJS
if (config.emailjsUserId) {
  emailjs.init(config.emailjsUserId);
}

// Enhanced Zustand Store with Persistence
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

// Enhanced API Client
class ApiClient {
  constructor() {
    this.isOnline = navigator.onLine;
    this.requestQueue = [];
    this.baseURL = config.apiBaseUrl;
    this.setupNetworkMonitoring();
  }

  setupNetworkMonitoring() {
    window.addEventListener('online', () => { 
      this.isOnline = true;
      useAppStore.getState().setNetworkStatus(true);
      this.processQueue();
    });
    window.addEventListener('offline', () => { 
      this.isOnline = false; 
      useAppStore.getState().setNetworkStatus(false);
    });
  }

  async processQueue() {
    while (this.requestQueue.length > 0 && this.isOnline) {
      const { resolve, reject, endpoint, options } = this.requestQueue.shift();
      try {
        const result = await this.makeRequest(endpoint, options);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    }
  }

  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `API Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
  }

  async apiCall(endpoint, options = {}) {
    if (!this.isOnline) {
      return new Promise((resolve, reject) => {
        this.requestQueue.push({ resolve, reject, endpoint, options });
      });
    }

    for (let attempt = 0; attempt <= 3; attempt++) {
      try {
        return await this.makeRequest(endpoint, options);
      } catch (error) {
        const shouldRetry = attempt < 3 && (
          error.name === 'AbortError' ||
          error.message.includes('fetch') ||
          error.message.includes('network')
        );

        if (shouldRetry) {
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
          continue;
        }
        throw error;
      }
    }
  }
}

const apiClient = new ApiClient();

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
                  <Star className="w-5 h-5 text-yellow-500 fill-current" />
                  <span className="font-medium">4.9/5 rating</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-emerald-500" />
                  <span className="font-medium">SOC 2 certified</span>
                </div>
              </motion.div>
            </div>

            {/* Features Grid */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-20"
            >
              {[
                {
                  icon: Wand2,
                  title: 'AI-Powered Generation',
                  description: 'Transform text prompts into stunning videos using cutting-edge AI models including OpenAI Sora and Google Veo 3.',
                  gradient: 'from-indigo-500 to-purple-600'
                },
                {
                  icon: TrendingUp,
                  title: 'Viral Optimization',
                  description: 'Generate videos optimized for every platform with perfect aspect ratios, lengths, and styles for maximum engagement.',
                  gradient: 'from-emerald-500 to-teal-600'
                },
                {
                  icon: Zap,
                  title: 'Lightning Fast',
                  description: 'Create professional-quality videos in under 60 seconds. No technical skills required, just your creativity.',
                  gradient: 'from-orange-500 to-red-600'
                },
                {
                  icon: BarChart3,
                  title: 'Performance Analytics',
                  description: 'Track your content performance with detailed analytics and insights to optimize your content strategy.',
                  gradient: 'from-blue-500 to-cyan-600'
                }
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  className="group p-8 rounded-3xl border bg-white border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-500 cursor-pointer transform hover:scale-105"
                >
                  <div className={`w-14 h-14 bg-gradient-to-r ${feature.gradient} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg`}>
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </main>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-indigo-600 to-purple-600 relative overflow-hidden">
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-5xl font-bold text-white mb-6"
            >
              Ready to go viral?
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl text-indigo-100 mb-10 max-w-2xl mx-auto"
            >
              Join the AI content revolution. Start creating viral videos that grow your influence and income today.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Button
                onClick={() => navigate('/auth/register')}
                variant="secondary"
                size="lg"
                className="text-lg px-12 py-5 bg-white text-indigo-600 hover:bg-gray-50 shadow-xl font-bold"
                icon={Rocket}
              >
                Start Your Free Trial
              </Button>
            </motion.div>
            
            <motion.p 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-indigo-200 text-sm mt-6"
            >
              No credit card required • 7-day free trial • Cancel anytime
            </motion.p>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-slate-900 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="col-span-1 md:col-span-2">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold">{config.appName}</h3>
                </div>
                <p className="text-slate-400 mb-6 max-w-md">
                  The AI-powered platform for creating viral video content. Transform your ideas into engaging videos that capture attention and drive results.
                </p>
                <div className="flex gap-4">
                  {[
                    { icon: Twitter, href: '#' },
                    { icon: Linkedin, href: '#' },
                    { icon: Instagram, href: '#' },
                    { icon: Github, href: '#' }
                  ].map((social, index) => (
                    <a
                      key={index}
                      href={social.href}
                      className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-slate-700 transition-colors"
                    >
                      <social.icon className="w-5 h-5" />
                    </a>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-4">Product</h4>
                <ul className="space-y-2 text-slate-400">
                  <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">API</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-4">Support</h4>
                <ul className="space-y-2 text-slate-400">
                  <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                </ul>
              </div>
            </div>
            
            <div className="border-t border-slate-800 mt-12 pt-8 text-center text-slate-400">
              <p>&copy; 2024 {config.appName}. All rights reserved. Built with ❤️ for creators.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

// Authentication Pages
const AuthLayout = ({ children, title, subtitle }) => (
  <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
    <NetworkStatus />
    <div className="w-full max-w-md">
      <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-gray-200/50">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl mb-4 shadow-lg">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            {config.appName}
          </h1>
          <div className="mt-4">
            <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
            <p className="text-slate-600 mt-2">{subtitle}</p>
          </div>
        </div>
        {children}
      </div>
    </div>
  </div>
);

const LoginPage = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const { signIn } = useAuth();
  const { isLoading } = useAppStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reset errors
    setErrors({});

    // Validate
    const newErrors = {};
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.password) newErrors.password = 'Password is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await signIn(formData.email, formData.password);
      navigate('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <>
      <SEO 
        title="Sign In"
        description="Sign in to your Influencore account and start creating viral videos with AI."
      />
      
      <AuthLayout 
        title="Welcome back!" 
        subtitle="Sign in to your account to continue creating amazing content"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <FormInput
            label="Email Address"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter your email"
            required
            disabled={isLoading}
            icon={Mail}
            error={errors.email}
          />

          <FormInput
            label="Password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter your password"
            required
            disabled={isLoading}
            icon={Lock}
            showPasswordToggle
            error={errors.password}
          />

          <Button
            type="submit"
            disabled={isLoading}
            loading={isLoading}
            icon={!isLoading ? Zap : undefined}
            className="w-full shadow-xl"
            size="lg"
          >
            {isLoading ? 'Signing in...' : 'Sign In to Dashboard'}
          </Button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-gray-600">
            Don't have an account?{' '}
            <button
              onClick={() => navigate('/auth/register')}
              className="text-indigo-600 hover:text-indigo-700 font-semibold transition-colors"
              disabled={isLoading}
            >
              Start your free trial
            </button>
          </p>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-slate-500 hover:text-slate-700 text-sm transition-colors flex items-center gap-1 mx-auto"
          >
            <ArrowRight className="w-4 h-4 rotate-180" />
            Back to Home
          </button>
        </div>
      </AuthLayout>
    </>
  );
};

const RegisterPage = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const { signUp } = useAuth();
  const { isLoading } = useAppStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reset errors
    setErrors({});

    // Validate
    const newErrors = {};
    if (!formData.name || formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!formData.password || formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await signUp(formData.email, formData.password, { name: formData.name });
      navigate('/dashboard');
    } catch (error) {
      console.error('Registration error:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <>
      <SEO 
        title="Create Account"
        description="Join Influencore and start creating viral videos with AI. Free 7-day trial, no credit card required."
      />
      
      <AuthLayout 
        title="Create your account" 
        subtitle="Join thousands of creators making viral content with AI"
      >
        {/* Benefits Section */}
        <div className="mb-8 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Crown className="w-5 h-5 text-indigo-600" />
            What you get with {config.appName}:
          </h3>
          <div className="space-y-3">
            {[
              'Generate unlimited AI videos (7-day free trial)',
              'Access to Google Veo 3, OpenAI Sora, and viral models',
              '4K HD downloads and social media optimization'
            ].map((benefit, index) => (
              <div key={index} className="flex items-center gap-3 text-sm text-gray-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <FormInput
            label="Full Name"
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter your full name"
            required
            disabled={isLoading}
            icon={User}
            error={errors.name}
          />

          <FormInput
            label="Email Address"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter your email address"
            required
            disabled={isLoading}
            icon={Mail}
            error={errors.email}
          />

          <FormInput
            label="Password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Create a strong password (6+ characters)"
            required
            disabled={isLoading}
            icon={Lock}
            showPasswordToggle
            error={errors.password}
          />

          <Button
            type="submit"
            disabled={isLoading}
            loading={isLoading}
            icon={!isLoading ? Rocket : undefined}
            className="w-full shadow-xl"
            size="lg"
          >
            {isLoading ? 'Creating your account...' : 'Start Free Trial'}
          </Button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-gray-600">
            Already have an account?{' '}
            <button
              onClick={() => navigate('/auth/login')}
              className="text-indigo-600 hover:text-indigo-700 font-semibold transition-colors"
              disabled={isLoading}
            >
              Sign in
            </button>
          </p>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-slate-500 hover:text-slate-700 text-sm transition-colors flex items-center gap-1 mx-auto"
          >
            <ArrowRight className="w-4 h-4 rotate-180" />
            Back to Home
          </button>
        </div>

        <div className="mt-6 pt-6 border-t border-slate-200 text-center">
          <p className="text-xs text-slate-500">
            By creating an account, you agree to our{' '}
            <a href="/terms" className="text-indigo-600 hover:text-indigo-700">Terms of Service</a>
            {' '}and{' '}
            <a href="/privacy" className="text-indigo-600 hover:text-indigo-700">Privacy Policy</a>
          </p>
        </div>
      </AuthLayout>
    </>
  );
};

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const { isLoading } = useAppStore();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  return children;
};

// Dashboard Layout
const DashboardLayout = ({ children }) => {
  const { user, signOut } = useAuth();
  const { sidebarOpen, setSidebarOpen } = useAppStore();

  const navigation = [
    { id: 'dashboard', name: 'Dashboard', icon: BarChart3, path: '/dashboard' },
    { id: 'generate', name: 'Generate Video', icon: Wand2, path: '/generate' },
    { id: 'library', name: 'Content Library', icon: Folder, path: '/library' },
    { id: 'billing', name: 'Billing', icon: CreditCard, path: '/billing' },
    { id: 'settings', name: 'Settings', icon: Settings, path: '/settings' }
  ];

  const location = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex">
      <NetworkStatus />
      
      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>
      
      <motion.div 
        initial={false}
        animate={{ x: sidebarOpen ? 0 : -320 }}
        className={`fixed left-0 top-0 h-full w-80 bg-white shadow-2xl z-50 border-r border-slate-200 lg:static lg:translate-x-0`}
      >
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                {config.appName}
              </h1>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1">
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>
        </div>

        <nav className="p-4">
          <ul className="space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      window.history.pushState({}, '', item.path);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-left transition-all font-medium ${
                      isActive
                        ? 'bg-blue-50 text-blue-600 border border-blue-200 shadow-sm'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.name}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="absolute bottom-4 left-4 right-4">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-xl border border-blue-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div>
                <p className="font-semibold text-slate-900">{user?.email}</p>
                <p className="text-xs text-slate-600">Free Plan</p>
              </div>
            </div>
            <Button size="sm" className="w-full mb-2">
              Upgrade to Pro
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              className="w-full"
              onClick={signOut}
              icon={LogOut}
            >
              Sign Out
            </Button>
          </div>
        </div>
      </motion.div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-slate-200 px-6 py-4 sticky top-0 z-30">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Menu className="w-6 h-6 text-slate-600" />
            </button>
            
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{user?.email}</p>
                  <p className="text-xs text-slate-600">Free Plan</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

// Dashboard Pages
const DashboardPage = () => {
  const { user } = useAuth();
  const [stats] = useState({
    totalVideos: 12,
    totalViews: 45623,
    thisMonth: 8,
    engagement: 15.7
  });

  return (
    <>
      <SEO 
        title="Dashboard"
        description="Your content creation dashboard - track videos, analytics, and performance."
      />
      
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            Welcome back! 🚀
          </h1>
          <p className="text-slate-600 text-lg">Here's your content creation overview</p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          {[
            { icon: Video, title: 'Total Videos', value: stats.totalVideos, change: '+12%', color: 'blue' },
            { icon: Eye, title: 'Total Views', value: stats.totalViews.toLocaleString(), change: '+8%', color: 'purple' },
            { icon: TrendingUp, title: 'Engagement Rate', value: `${stats.engagement}%`, change: '+15%', color: 'emerald' },
            { icon: Calendar, title: 'This Month', value: stats.thisMonth, change: '+5', color: 'orange' }
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`bg-${stat.color}-100 p-3 rounded-xl`}>
                  <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
                </div>
                <span className="text-sm text-emerald-600 font-semibold">{stat.change}</span>
              </div>
              <div className="text-3xl font-bold text-slate-900">{stat.value}</div>
              <div className="text-sm text-slate-600 font-medium">{stat.title}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <Wand2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Create New Video</h3>
                <p className="text-slate-600">Generate AI videos instantly</p>
              </div>
            </div>
            <Button icon={ArrowRight} className="w-full">
              Start Creating
            </Button>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Analytics</h3>
                <p className="text-slate-600">Track your performance</p>
              </div>
            </div>
            <Button variant="secondary" icon={ArrowRight} className="w-full">
              View Analytics
            </Button>
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl flex items-center justify-center">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Upgrade Plan</h3>
                <p className="text-slate-600">Unlock premium features</p>
              </div>
            </div>
            <Button variant="secondary" icon={ArrowRight} className="w-full">
              Upgrade Now
            </Button>
          </div>
        </motion.div>
      </div>
    </>
  );
};

// Main App Router
const AppRouter = () => {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/register" element={<RegisterPage />} />
        
        {/* Protected Routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardLayout>
              <DashboardPage />
            </DashboardLayout>
          </ProtectedRoute>
        } />
        
        {/* Add more protected routes as needed */}
        <Route path="/generate" element={
          <ProtectedRoute>
            <DashboardLayout>
              <div>Generate Video Page</div>
            </DashboardLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/library" element={
          <ProtectedRoute>
            <DashboardLayout>
              <div>Content Library Page</div>
            </DashboardLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/billing" element={
          <ProtectedRoute>
            <DashboardLayout>
              <div>Billing Page</div>
            </DashboardLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/settings" element={
          <ProtectedRoute>
            <DashboardLayout>
              <div>Settings Page</div>
            </DashboardLayout>
          </ProtectedRoute>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

// Root App Component
const App = () => {
  return (
    <HelmetProvider>
      <ErrorBoundary>
        <AuthProvider>
          <Elements stripe={stripePromise}>
            <AppRouter />
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#1f2937',
                  color: '#f9fafb',
                  border: '1px solid #374151',
                },
              }}
            />
          </Elements>
        </AuthProvider>
      </ErrorBoundary>
    </HelmetProvider>
  );
};

export default App;
