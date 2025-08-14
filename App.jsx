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
    if (import.meta.env.PROD) {
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
  environment: import.meta.env.MODE || 'production'
};

// Initialize services with error handling
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
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setInitialized(true);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        setUser(session.user);
      }
      setLoading(false);
      setInitialized(true);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      if (session?.user) {
        setUser(session.user);
        if (event === 'SIGNED_IN') {
          toast.success(`Welcome ${session.user.email}!`);
        }
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

      // Send welcome email if EmailJS is configured
      if (config.emailjsServiceId && config.emailjsTemplateId) {
        try {
          await emailjs.send(
            config.emailjsServiceId,
            config.emailjsTemplateId,
            {
              to_email: email,
              to_name: userData.name || email,
              message: 'Welcome to Influencore! Your account has been created successfully.'
            }
          );
        } catch (emailError) {
          console.warn('Email sending failed:', emailError);
        }
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

  if (!initialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Initializing..." />
      </div>
    );
  }

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

// Landing Page Component
const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>AI Video Generation Platform | {config.appName}</title>
        <meta name="description" content="Create viral videos with AI using Google Veo 3, OpenAI Sora, and advanced AI models. Join 10,000+ creators making viral content." />
      </Helmet>
      
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
                  onClick={() => navigate('/login')}
                  className="text-gray-700 hover:text-gray-900 font-medium transition-colors hidden sm:block"
                >
                  Sign In
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2 rounded-xl font-medium hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 flex items-center gap-2 shadow-lg"
                >
                  <Rocket className="w-4 h-4" />
                  Start Free
                </button>
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
                className="text-xl md:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed"
              >
                Generate stunning videos using Google Veo 3, OpenAI Sora, and cutting-edge AI models. 
                Join 10,000+ creators making viral content.
              </motion.p>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
              >
                <button
                  onClick={() => navigate('/register')}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-xl hover:shadow-2xl flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-5 h-5" />
                  Start Creating Free
                </button>
                <button
                  onClick={() => navigate('/demo')}
                  className="bg-white text-gray-700 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-50 transition-all duration-200 border border-gray-300 shadow-lg flex items-center justify-center gap-2"
                >
                  <Play className="w-5 h-5" />
                  Watch Demo
                </button>
              </motion.div>

              {/* Features Grid */}
              <motion.div 
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto"
              >
                <div className="bg-white/60 backdrop-blur-sm p-8 rounded-2xl border border-gray-200/50 shadow-lg">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-4">
                    <Wand2 className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">AI-Powered Generation</h3>
                  <p className="text-gray-600">Create professional videos with Google Veo 3 and OpenAI Sora in seconds.</p>
                </div>

                <div className="bg-white/60 backdrop-blur-sm p-8 rounded-2xl border border-gray-200/50 shadow-lg">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-4">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Viral Optimization</h3>
                  <p className="text-gray-600">Built-in templates and styles optimized for social media engagement.</p>
                </div>

                <div className="bg-white/60 backdrop-blur-sm p-8 rounded-2xl border border-gray-200/50 shadow-lg">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-4">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Lightning Fast</h3>
                  <p className="text-gray-600">Generate high-quality videos in under 60 seconds with our advanced AI.</p>
                </div>
              </motion.div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

// Simple Router Component
const AppRouter = () => {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="/register" element={<Navigate to="/" replace />} />
      <Route path="/demo" element={<Navigate to="/" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

// Main App Component
const App = () => {
  return (
    <ErrorBoundary>
      <HelmetProvider>
        <Router>
          <AuthProvider>
            <div className="min-h-screen">
              <AppRouter />
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#363636',
                    color: '#fff',
                  },
                  success: {
                    duration: 3000,
                    theme: {
                      primary: 'green',
                      secondary: 'black',
                    },
                  },
                }}
              />
            </div>
          </AuthProvider>
        </Router>
      </HelmetProvider>
    </ErrorBoundary>
  );
};

export default App;
