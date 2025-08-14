import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { HelmetProvider, Helmet } from 'react-helmet-async';

import { 
  Play, Video, Image, Settings, User, LogOut, Menu, X, Upload, Download, Search, Filter, Plus, Trash2, 
  Eye, EyeOff, Lock, Mail, UserPlus, Zap, Clock, BarChart3, Folder, Star, Heart, Share2, Edit3,
  ChevronDown, AlertCircle, CheckCircle, XCircle, Loader2, Sparkles, Wand2, Film, Camera, Layers,
  Wifi, WifiOff, RefreshCw, Home, Activity, Globe, TrendingUp, Award, Shield, Monitor, Crown, Rocket,
  ArrowRight, CheckCircle2, Users, Mic, MessageSquare, Brain, Target, Lightbulb, Palette, Copy
} from 'lucide-react';

// Configuration with proper validation
const validateConfig = () => {
  const config = {
    apiBaseUrl: import.meta.env.VITE_API_URL || 'https://backend-9g44.onrender.com',
    appName: import.meta.env.VITE_APP_NAME || 'Influencore',
    appVersion: import.meta.env.VITE_APP_VERSION || '2.0.0',
    environment: import.meta.env.MODE || 'production'
  };

  // Validate API URL
  try {
    new URL(config.apiBaseUrl);
  } catch {
    console.error('Invalid API URL in configuration');
    config.apiBaseUrl = 'https://backend-9g44.onrender.com';
  }

  return config;
};

const config = validateConfig();

// Enhanced API Client
class ApiClient {
  constructor() {
    this.baseURL = config.apiBaseUrl;
    this.timeout = 30000;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timeout - please check your connection');
      }
      throw error;
    }
  }

  async get(endpoint, token = null) {
    return this.request(endpoint, {
      method: 'GET',
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
  }

  async post(endpoint, data, token = null) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
  }

  async delete(endpoint, token = null) {
    return this.request(endpoint, {
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
  }
}

const apiClient = new ApiClient();

// Zustand Store
const useAppStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      networkStatus: navigator.onLine,
      videos: [],
      stats: { total: 0, thisMonth: 0, views: 0 },
      currentPage: 'dashboard',
      sidebarOpen: false,
      
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setToken: (token) => set({ token }),
      setLoading: (isLoading) => set({ isLoading }),
      setNetworkStatus: (networkStatus) => set({ networkStatus }),
      setCurrentPage: (currentPage) => set({ currentPage }),
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      setVideos: (videos) => set({ videos }),
      setStats: (stats) => set({ stats }),
      addVideo: (video) => set((state) => ({ videos: [video, ...state.videos] })),
      removeVideo: (id) => set((state) => ({ videos: state.videos.filter(v => v.id !== id) })),
      
      logout: () => {
        set({ 
          user: null, 
          token: null, 
          isAuthenticated: false, 
          videos: [], 
          stats: { total: 0, thisMonth: 0, views: 0 } 
        });
        toast.success('Signed out successfully');
      },

      // API methods
      apiCall: async (endpoint, options = {}) => {
        const { token } = get();
        if (token && !options.headers?.Authorization) {
          options.headers = { ...options.headers, Authorization: `Bearer ${token}` };
        }
        return apiClient.request(endpoint, options);
      }
    }),
    {
      name: 'influencore-storage',
      partialize: (state) => ({ 
        user: state.user, 
        token: state.token,
        isAuthenticated: state.isAuthenticated
      }),
    }
  )
);

// Error Boundary
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Application Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center border border-slate-200">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Shield className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">Something went wrong</h2>
            <p className="text-slate-600 mb-8">Please refresh the page to continue.</p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Authentication Hook
const useAuth = () => {
  const { 
    user, token, isAuthenticated, isLoading, 
    setUser, setToken, setLoading, logout: storeLogout,
    apiCall
  } = useAppStore();

  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const response = await apiClient.post('/api/auth/login', { email, password });
      setUser(response.user);
      setToken(response.token);
      toast.success('Welcome back!');
      return response;
    } catch (error) {
      toast.error(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setUser, setToken, setLoading]);

  const register = useCallback(async (name, email, password) => {
    setLoading(true);
    try {
      const response = await apiClient.post('/api/auth/register', { name, email, password });
      setUser(response.user);
      setToken(response.token);
      toast.success('Account created successfully!');
      return response;
    } catch (error) {
      toast.error(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setUser, setToken, setLoading]);

  const logout = useCallback(() => {
    storeLogout();
  }, [storeLogout]);

  const verifyToken = useCallback(async () => {
    if (!token) return;
    
    try {
      const response = await apiClient.get('/api/auth/verify', token);
      setUser(response.user);
    } catch (error) {
      console.warn('Token verification failed:', error);
      logout();
    }
  }, [token, setUser, logout]);

  useEffect(() => {
    verifyToken();
  }, [verifyToken]);

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    apiCall
  };
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
              : 'border-slate-300 bg-white hover:border-slate-400 focus:bg-white'
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
    <button
      disabled={disabled || loading}
      className={`
        ${variants[variant]}
        ${sizes[size]}
        rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2
        disabled:opacity-50 disabled:cursor-not-allowed
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
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
    </button>
  );
};

// Landing Page
const LandingPage = () => {
  const navigate = () => window.location.href = '#auth';

  return (
    <>
      <Helmet>
        <title>AI Video Generation Platform | {config.appName}</title>
        <meta name="description" content="Create viral videos with AI using cutting-edge technology." />
      </Helmet>
      
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
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
                <Button
                  onClick={navigate}
                  icon={Rocket}
                  size="lg"
                >
                  Get Started
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 md:pt-20 pb-16">
            <div className="text-center">
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 leading-tight mb-6"
              >
                Create Viral{' '}
                <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  AI Videos
                </span>
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-xl md:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed"
              >
                Generate stunning videos using cutting-edge AI technology. 
                Join thousands of creators making viral content.
              </motion.p>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
              >
                <Button
                  onClick={navigate}
                  icon={Sparkles}
                  size="lg"
                  className="px-12 py-6 text-xl"
                >
                  Start Creating Free
                </Button>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto"
              >
                <div className="bg-white/60 backdrop-blur-sm p-8 rounded-2xl border border-gray-200/50 shadow-lg">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-4">
                    <Wand2 className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">AI-Powered</h3>
                  <p className="text-gray-600">Create professional videos with advanced AI in seconds.</p>
                </div>

                <div className="bg-white/60 backdrop-blur-sm p-8 rounded-2xl border border-gray-200/50 shadow-lg">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-4">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Viral Ready</h3>
                  <p className="text-gray-600">Optimized templates for maximum social media engagement.</p>
                </div>

                <div className="bg-white/60 backdrop-blur-sm p-8 rounded-2xl border border-gray-200/50 shadow-lg">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-4">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Lightning Fast</h3>
                  <p className="text-gray-600">Generate high-quality videos in under 60 seconds.</p>
                </div>
              </motion.div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

// Auth Forms
const AuthForms = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const { login, register, isLoading } = useAuth();

  const validateForm = () => {
    const newErrors = {};
    
    if (!isLogin && (!formData.name || formData.name.trim().length < 2)) {
      newErrors.name = 'Name must be at least 2 characters';
    }
    
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.password || formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});

    try {
      if (isLogin) {
        await login(formData.email, formData.password);
      } else {
        await register(formData.name, formData.email, formData.password);
      }
    } catch (error) {
      // Error already handled in auth hook
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-slate-200">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl mb-4">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
              {config.appName}
            </h1>
            <p className="text-slate-600 mt-2 font-medium">
              {isLogin ? 'Welcome back! Sign in to your account' : 'Create your account and start generating videos'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
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
            )}

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
              placeholder={isLogin ? "Enter your password" : "Create a strong password"}
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
              icon={isLogin ? Zap : UserPlus}
              className="w-full"
              size="lg"
            >
              {isLoading 
                ? (isLogin ? 'Signing in...' : 'Creating account...') 
                : (isLogin ? 'Sign In' : 'Create Account')
              }
            </Button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-slate-600">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-blue-600 hover:text-blue-700 font-semibold transition-colors"
                disabled={isLoading}
              >
                {isLogin ? 'Sign up for free' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Video Generator
const VideoGenerator = () => {
  const [model, setModel] = useState('veo3');
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState(null);
  const [progress, setProgress] = useState(0);
  const { apiCall, addVideo } = useAppStore();

  const models = [
    { id: 'veo3', name: 'Google Veo 3', description: 'Latest AI video generation', icon: Sparkles },
    { id: 'sora', name: 'OpenAI Sora', description: 'Advanced video synthesis', icon: Wand2 },
    { id: 'viral', name: 'Viral Shorts', description: 'Social media optimized', icon: Zap },
    { id: 'image-to-video', name: 'Image to Video', description: 'Convert images to videos', icon: Image }
  ];

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    setIsGenerating(true);
    setProgress(0);

    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + Math.random() * 15 + 5, 90));
    }, 1000);

    try {
      const endpoints = {
        'veo3': '/api/generate-veo3-video',
        'sora': '/api/generate-sora-video',
        'viral': '/api/generate-viral-short',
        'image-to-video': '/api/generate-video-from-image'
      };

      const result = await apiCall(endpoints[model] || endpoints['veo3'], {
        method: 'POST',
        body: JSON.stringify({ prompt, options: { duration: '30', quality: 'high' } })
      });

      clearInterval(progressInterval);
      setProgress(100);
      
      setGeneratedVideo(result.video);
      addVideo(result.video);
      toast.success('Video generated successfully!');
      
    } catch (error) {
      clearInterval(progressInterval);
      setProgress(0);
      toast.error(error.message || 'Generation failed');
    } finally {
      setIsGenerating(false);
      setTimeout(() => setProgress(0), 3000);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-xl">
            <Wand2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">AI Video Generator</h1>
            <p className="text-slate-600">Create amazing videos with AI</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">AI Model</label>
              <div className="grid grid-cols-1 gap-3">
                {models.map((m) => {
                  const Icon = m.icon;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setModel(m.id)}
                      className={`p-4 border rounded-xl text-left transition-all hover:shadow-md ${
                        model === m.id
                          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600">
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{m.name}</div>
                          <div className="text-sm text-slate-600">{m.description}</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Video Prompt</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full h-32 px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none text-slate-900 placeholder-slate-400"
                placeholder="Describe the video you want to generate..."
                disabled={isGenerating}
                maxLength={500}
              />
              <div className="text-sm text-slate-500 mt-1">{prompt.length}/500 characters</div>
            </div>

            {isGenerating && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <LoadingSpinner size="sm" />
                  <span className="font-semibold text-blue-900">Generating Video</span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-3 mb-3">
                  <div 
                    className="bg-blue-600 h-3 rounded-full transition-all duration-1000"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-sm text-blue-700 font-medium">Processing your request...</p>
              </div>
            )}

            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              loading={isGenerating}
              icon={Sparkles}
              className="w-full"
              size="lg"
            >
              {isGenerating ? 'Generating Video...' : 'Generate Video'}
            </Button>
          </div>

          <div className="bg-slate-50 rounded-xl p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Preview</h3>
            {generatedVideo ? (
              <div className="space-y-4">
                <div className="bg-black rounded-xl aspect-video flex items-center justify-center relative overflow-hidden">
                  <div className="text-white text-center">
                    <Film className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm opacity-75">Video Generated Successfully</p>
                    <p className="text-xs opacity-50 mt-1">{generatedVideo.model?.toUpperCase()}</p>
                  </div>
                  <button className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <Play className="w-16 h-16 text-white" />
                  </button>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-slate-900">{generatedVideo.title}</h4>
                  <p className="text-sm text-slate-600">Duration: {generatedVideo.duration}s • Model: {generatedVideo.model}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="primary" icon={Download} className="flex-1">
                    Download
                  </Button>
                  <Button variant="secondary" icon={Share2} className="flex-1">
                    Share
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-slate-100 rounded-xl aspect-video flex items-center justify-center">
                <div className="text-center text-slate-500">
                  <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Generated video will appear here</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Dashboard
const Dashboard = () => {
  const { user, videos, stats, setVideos, setStats, apiCall } = useAppStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [videosResponse, statsResponse] = await Promise.all([
          apiCall('/api/videos'),
          apiCall('/api/stats')
        ]);
        
        setVideos(videosResponse.videos || []);
        setStats(statsResponse);
      } catch (error) {
        console.error('Dashboard load failed:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [apiCall, setVideos, setStats]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Loading dashboard..." />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">
          Welcome back, {user?.name || 'User'}!
        </h1>
        <p className="text-slate-600 text-lg">Here's your video generation overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-blue-100 p-3 rounded-xl">
              <Video className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-sm text-green-600 font-semibold">+{Math.floor(Math.random() * 20)}%</span>
          </div>
          <div>
            <div className="text-3xl font-bold text-slate-900">{stats.total || 0}</div>
            <div className="text-sm text-slate-600 font-medium">Total Videos</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-purple-100 p-3 rounded-xl">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-sm text-green-600 font-semibold">+{Math.floor(Math.random() * 15)}%</span>
          </div>
          <div>
            <div className="text-3xl font-bold text-slate-900">{(stats.views || 0).toLocaleString()}</div>
            <div className="text-sm text-slate-600 font-medium">Total Views</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-green-100 p-3 rounded-xl">
              <Clock className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-sm text-green-600 font-semibold">+{stats.thisMonth || 0}</span>
          </div>
          <div>
            <div className="text-3xl font-bold text-slate-900">{stats.thisMonth || 0}</div>
            <div className="text-sm text-slate-600 font-medium">This Month</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-2xl font-bold text-slate-900">Recent Videos</h2>
        </div>
        <div className="p-6">
          {videos.length > 0 ? (
            <div className="space-y-4">
              {videos.slice(0, 5).map((video) => (
                <div key={video.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="bg-slate-100 w-16 h-12 rounded-lg flex items-center justify-center">
                      <Play className="w-5 h-5 text-slate-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{video.title}</h3>
                      <p className="text-sm text-slate-600">{video.duration}s • {video.model}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2 text-slate-500 hover:text-blue-600 transition-colors">
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-slate-500 hover:text-green-600 transition-colors">
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500">
              <Folder className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No videos yet. Start creating your first AI video!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Sidebar
const Sidebar = ({ isOpen, onClose, currentPage, onPageChange }) => {
  const navigation = [
    { id: 'dashboard', name: 'Dashboard', icon: BarChart3 },
    { id: 'generate', name: 'Generate Video', icon: Wand2 },
    { id: 'library', name: 'Content Library', icon: Folder },
    { id: 'settings', name: 'Settings', icon: Settings }
  ];

  const { user, logout } = useAppStore();

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      <div className={`fixed left-0 top-0 h-full w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 border-r border-slate-200 ${
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      } lg:static lg:transform-none`}>
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
            <button onClick={onClose} className="lg:hidden p-1">
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>
        </div>

        <nav className="p-4">
          <ul className="space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      onPageChange(item.id);
                      onClose();
                    }}
                    className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-left transition-all font-medium ${
                      currentPage === item.id
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
                  {user?.name?.charAt(0) || 'U'}
                </span>
              </div>
              <div>
                <p className="font-semibold text-slate-900">{user?.name || 'User'}</p>
                <p className="text-xs text-slate-600">Free Plan</p>
              </div>
            </div>
            <Button 
              onClick={logout}
              variant="secondary" 
              size="sm" 
              icon={LogOut}
              className="w-full"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

// Header
const Header = ({ onMenuClick, user }) => {
  return (
    <header className="bg-white shadow-sm border-b border-slate-200 px-6 py-4 sticky top-0 z-30">
      <div className="flex items-center justify-between">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <Menu className="w-6 h-6 text-slate-600" />
        </button>
        
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">
                {user?.name?.charAt(0) || 'U'}
              </span>
            </div>
            <div>
              <p className="font-semibold text-slate-900">{user?.name}</p>
              <p className="text-xs text-slate-600">{user?.email}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

// Settings Page
const SettingsPage = () => {
  const { user, logout } = useAppStore();

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-600 text-lg">Manage your account and preferences</p>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="p-8">
          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-6">Profile Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormInput
                  label="Full Name"
                  type="text"
                  name="name"
                  value={user?.name || ''}
                  placeholder="Enter your full name"
                  icon={User}
                  disabled
                />
                <FormInput
                  label="Email Address"
                  type="email"
                  name="email"
                  value={user?.email || ''}
                  placeholder="Enter your email"
                  icon={Mail}
                  disabled
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-slate-200">
              <div>
                <h4 className="font-semibold text-slate-900">Account Management</h4>
                <p className="text-sm text-slate-600">Manage your account settings</p>
              </div>
              <Button
                onClick={logout}
                variant="danger"
                icon={LogOut}
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Content Library
const ContentLibrary = () => {
  const { videos, removeVideo, apiCall } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async (videoId) => {
    if (!confirm('Are you sure you want to delete this video?')) return;
    
    try {
      await apiCall(`/api/videos/${videoId}`, { method: 'DELETE' });
      removeVideo(videoId);
      toast.success('Video deleted successfully');
    } catch (error) {
      toast.error('Failed to delete video');
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">Content Library</h1>
          <p className="text-slate-600 text-lg">Manage your AI-generated videos</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-slate-200">
        <div className="p-6">
          {videos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {videos.map((video) => (
                <div key={video.id} className="group border border-slate-200 rounded-xl overflow-hidden hover:shadow-lg transition-all">
                  <div className="relative">
                    <div className="bg-slate-100 aspect-video flex items-center justify-center">
                      <Play className="w-12 h-12 text-slate-400 group-hover:text-blue-600 transition-colors" />
                    </div>
                    <div className="absolute top-3 right-3 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-lg">
                      {video.duration}s
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-slate-900 mb-2 truncate">{video.title}</h3>
                    <div className="flex items-center justify-between text-sm text-slate-600 mb-4">
                      <span className="capitalize font-medium">{video.model}</span>
                      <span>{new Date(video.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" className="flex-1" icon={Play}>
                        Play
                      </Button>
                      <button
                        onClick={() => handleDelete(video.id)}
                        className="p-2 text-slate-500 hover:text-red-600 border border-slate-300 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-slate-500">
              <Folder className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No videos found. Start creating your first video!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Main App
const App = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const { isAuthenticated, isLoading, user } = useAuth();

  // Network status monitoring
  useEffect(() => {
    const { setNetworkStatus } = useAppStore.getState();
    const handleOnline = () => setNetworkStatus(true);
    const handleOffline = () => setNetworkStatus(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-white rounded-2xl shadow-xl flex items-center justify-center mb-6">
            <Sparkles className="w-10 h-10 text-blue-600" />
          </div>
          <LoadingSpinner size="lg" text={`Loading ${config.appName}...`} />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return window.location.hash === '#auth' ? <AuthForms /> : <LandingPage />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'generate':
        return <VideoGenerator />;
      case 'library':
        return <ContentLibrary />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex">
      <Sidebar 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
      />
      
      <div className="flex-1 lg:ml-0 flex flex-col">
        <Header 
          onMenuClick={() => setIsSidebarOpen(true)}
          user={user}
        />

        <main className="flex-1 p-6 overflow-auto">
          {renderPage()}
        </main>
      </div>
    </div>
  );
};

// Root App
const RootApp = () => {
  return (
    <ErrorBoundary>
      <HelmetProvider>
        <Router>
          <div className="min-h-screen">
            <App />
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
                  style: {
                    background: '#10b981',
                  }
                },
                error: {
                  duration: 5000,
                  style: {
                    background: '#ef4444',
                  }
                }
              }}
            />
          </div>
        </Router>
      </HelmetProvider>
    </ErrorBoundary>
  );
};

export default RootApp;
                      
