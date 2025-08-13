import React, { useState, useEffect, createContext, useContext, useCallback, useRef, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import { create } from 'zustand';
import { 
  Play, Video, Image, Settings, User, LogOut, Menu, X, Upload, Download, Search, Filter, Plus, Trash2, 
  Eye, EyeOff, Lock, Mail, UserPlus, Zap, Clock, BarChart3, Folder, Star, Heart, Share2, Edit3,
  ChevronDown, AlertCircle, CheckCircle, XCircle, Loader2, Sparkles, Wand2, Film, Camera, Layers,
  Wifi, WifiOff, RefreshCw, Home, Activity, Globe, TrendingUp, Award, Shield, Monitor, Crown, Rocket,
  ArrowRight, CheckCircle2, Users, Mic, MessageSquare, Brain, Target, Lightbulb, Palette, Copy
} from 'lucide-react';

// Enhanced Configuration with Environment Variables
const config = {
  apiBaseUrl: import.meta.env.VITE_API_URL || 'https://backend-9g44.onrender.com',
  apiTimeout: parseInt(import.meta.env.VITE_API_TIMEOUT) || 30000,
  maxRetries: parseInt(import.meta.env.VITE_MAX_RETRIES) || 3,
  appName: import.meta.env.VITE_APP_NAME || 'Influencore',
  appVersion: import.meta.env.VITE_APP_VERSION || '2.0.0',
  enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  enableDebug: import.meta.env.NODE_ENV === 'development',
  environment: import.meta.env.NODE_ENV || 'production'
};

// Zustand Store for Global State Management
const useAppStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  networkStatus: navigator.onLine,
  theme: 'light',
  videos: [],
  currentPage: 'home',
  sidebarOpen: false,
  
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setLoading: (isLoading) => set({ isLoading }),
  setNetworkStatus: (networkStatus) => set({ networkStatus }),
  setCurrentPage: (currentPage) => set({ currentPage }),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  addVideo: (video) => set((state) => ({ videos: [video, ...state.videos] })),
  removeVideo: (id) => set((state) => ({ videos: state.videos.filter(v => v.id !== id) })),
  
  logout: () => {
    try {
      localStorage.removeItem('influencore_token');
      localStorage.removeItem('influencore_user');
    } catch (error) {
      console.warn('Storage clear failed:', error);
    }
    set({ user: null, isAuthenticated: false });
    toast.success('Signed out successfully');
  }
}));

// Enhanced Error Boundary with Recovery
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
            <p className="text-slate-600 mb-8">We're working to fix this issue. Please try refreshing the page.</p>
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

// Enhanced API Client with Production Error Handling
class ApiClient {
  constructor() {
    this.isOnline = navigator.onLine;
    this.requestQueue = [];
    this.baseURL = config.apiBaseUrl;
    this.setupNetworkMonitoring();
    this.setupHealthCheck();
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

  async setupHealthCheck() {
    try {
      await this.healthCheck();
      console.log('✅ Backend connection verified');
    } catch (error) {
      console.warn('⚠️ Backend health check failed:', error.message);
      toast.error('Backend connection issues detected');
    }
  }

  async healthCheck() {
    const response = await fetch(`${this.baseURL}/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) throw new Error('Health check failed');
    return response.json();
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
    const timeoutId = setTimeout(() => controller.abort(), config.apiTimeout);

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
        throw new Error(errorData.message || `API Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timeout - please try again');
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

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        return await this.makeRequest(endpoint, options);
      } catch (error) {
        const isLastAttempt = attempt === config.maxRetries;
        const shouldRetry = !isLastAttempt && (
          error.name === 'AbortError' ||
          error.message.includes('fetch') ||
          error.message.includes('network') ||
          error.message.includes('timeout')
        );

        if (shouldRetry) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        throw error;
      }
    }
  }
}

// Global API Client Instance
const apiClient = new ApiClient();

// Enhanced Authentication Context
const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const { user, isLoading, setUser, setLoading, logout } = useAppStore();
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem('influencore_token');
    } catch {
      return null;
    }
  });

  const apiCall = useCallback(async (endpoint, options = {}) => {
    if (token && !options.headers?.Authorization) {
      options.headers = {
        ...options.headers,
        Authorization: `Bearer ${token}`
      };
    }
    return apiClient.apiCall(endpoint, options);
  }, [token]);

  const login = async (email, password) => {
    try {
      setLoading(true);
      const data = await apiCall('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (data.token && data.user) {
        setToken(data.token);
        setUser(data.user);
        try {
          localStorage.setItem('influencore_token', data.token);
          localStorage.setItem('influencore_user', JSON.stringify(data.user));
        } catch (error) {
          console.warn('Storage failed:', error);
        }
        toast.success(`Welcome back, ${data.user.name}!`);
      }
      return data;
    } catch (error) {
      const message = error.message.includes('401') ? 'Invalid email or password' : error.message;
      toast.error(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, email, password) => {
    try {
      setLoading(true);
      const data = await apiCall('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      });

      if (data.token && data.user) {
        setToken(data.token);
        setUser(data.user);
        try {
          localStorage.setItem('influencore_token', data.token);
          localStorage.setItem('influencore_user', JSON.stringify(data.user));
        } catch (error) {
          console.warn('Storage failed:', error);
        }
        toast.success(`Welcome to ${config.appName}, ${data.user.name}!`);
      }
      return data;
    } catch (error) {
      const message = error.message.includes('409') ? 'An account with this email already exists' : error.message;
      toast.error(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const verifyToken = useCallback(async () => {
    if (!token) return;

    try {
      const data = await apiCall('/api/auth/verify');
      if (data.user) {
        setUser(data.user);
      } else {
        logout();
      }
    } catch (error) {
      console.warn('Token verification failed:', error);
      logout();
    }
  }, [token, apiCall, logout, setUser]);

  useEffect(() => {
    if (token) {
      verifyToken();
    }
  }, [verifyToken, token]);

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoading, 
      login, 
      register, 
      logout, 
      apiCall,
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

// Enhanced UI Components
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
        <button 
          onClick={onClose} 
          className="flex-shrink-0 hover:opacity-70 transition-opacity"
          aria-label="Close alert"
        >
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
        <span className="text-sm font-medium">No internet connection - Retrying automatically...</span>
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
            aria-label={showPassword ? 'Hide password' : 'Show password'}
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
    primary: 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-500/25',
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
    </motion.button>
  );
};

const validateForm = (formData, type = 'login') => {
  const errors = {};
  
  if (type === 'register' && (!formData.name || formData.name.trim().length < 2)) {
    errors.name = 'Name must be at least 2 characters long';
  }
  
  if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    errors.email = 'Please enter a valid email address';
  }
  
  if (!formData.password || formData.password.length < 6) {
    errors.password = 'Password must be at least 6 characters long';
  }
  
  return errors;
};

// UNIQUE INNOVATION: AI Video Script Generator with Voice Synthesis
const AIScriptGenerator = () => {
  const [topic, setTopic] = useState('');
  const [style, setStyle] = useState('engaging');
  const [duration, setDuration] = useState('30');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedScript, setGeneratedScript] = useState('');
  const [voicePreview, setVoicePreview] = useState(false);
  const [error, setError] = useState('');
  const { apiCall } = useAuth();

  const generateScript = async () => {
    if (!topic.trim()) {
      setError('Please enter a topic');
      toast.error('Please enter a topic');
      return;
    }

    setError('');
    setIsGenerating(true);
    
    try {
      const response = await apiCall('/api/ai/generate-script', {
        method: 'POST',
        body: JSON.stringify({
          topic: topic.trim(),
          style,
          duration: parseInt(duration),
          platform: 'tiktok'
        })
      });

      if (response && response.script) {
        setGeneratedScript(response.script);
        toast.success('Script generated successfully!');
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      const errorMessage = error.message || 'Failed to generate script. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Script generation error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const previewVoice = () => {
    if ('speechSynthesis' in window && generatedScript) {
      // Stop any existing speech
      speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(generatedScript);
      utterance.rate = 1.2;
      utterance.pitch = 1.1;
      utterance.volume = 0.8;
      
      utterance.onstart = () => setVoicePreview(true);
      utterance.onend = () => setVoicePreview(false);
      utterance.onerror = () => {
        setVoicePreview(false);
        toast.error('Voice preview failed');
      };
      
      speechSynthesis.speak(utterance);
    } else {
      toast.error('Voice synthesis not supported in this browser');
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedScript);
      toast.success('Script copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy script');
      console.error('Copy error:', error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !isGenerating) {
      generateScript();
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-200"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
          <Brain className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-900">AI Script Generator</h3>
          <p className="text-slate-600">Create viral video scripts instantly</p>
        </div>
      </div>

      <div className="space-y-4">
        <FormInput
          label="Video Topic"
          name="topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="e.g., 'How to be more productive'"
          icon={Lightbulb}
          required
          error={error}
        />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Style <span className="text-red-500">*</span>
            </label>
            <select
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
              aria-label="Script style selection"
            >
              <option value="engaging">Engaging</option>
              <option value="educational">Educational</option>
              <option value="funny">Funny</option>
              <option value="motivational">Motivational</option>
              <option value="storytelling">Storytelling</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Duration <span className="text-red-500">*</span>
            </label>
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
              aria-label="Video duration selection"
            >
              <option value="15">15 seconds</option>
              <option value="30">30 seconds</option>
              <option value="60">60 seconds</option>
              <option value="90">90 seconds</option>
            </select>
          </div>
        </div>

        <Button
          onClick={generateScript}
          loading={isGenerating}
          disabled={!topic.trim() || isGenerating}
          icon={Wand2}
          className="w-full"
          aria-label="Generate AI script"
        >
          {isGenerating ? 'Generating...' : 'Generate Script'}
        </Button>

        {generatedScript && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-4"
          >
            <div className="bg-white rounded-xl p-4 border border-purple-200">
              <h4 className="font-semibold text-slate-900 mb-2">Generated Script:</h4>
              <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">{generatedScript}</p>
            </div>
            
            <div className="flex gap-3">
              <Button
                onClick={previewVoice}
                variant="secondary"
                icon={Mic}
                disabled={voicePreview}
                aria-label="Preview script with voice synthesis"
              >
                {voicePreview ? 'Playing...' : 'Preview Voice'}
              </Button>
              <Button
                onClick={copyToClipboard}
                variant="ghost"
                icon={Copy}
                aria-label="Copy script to clipboard"
              >
                Copy Script
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

// Main App Component
const App = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
          <NetworkStatus />
          <div className="max-w-7xl mx-auto px-4 py-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-12"
            >
              <h1 className="text-4xl font-bold text-slate-900 mb-4">
                Welcome to {config.appName}
              </h1>
              <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                AI-powered social media content generation platform
              </p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <AIScriptGenerator />
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                    <Video className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Video Generation</h3>
                    <p className="text-slate-600">Create stunning videos with AI</p>
                  </div>
                </div>
                
                <p className="text-slate-700 mb-4">
                  Generate professional videos using advanced AI models like Veo 3 and Sora.
                </p>
                
                <Button icon={ArrowRight} className="w-full">
                  Start Creating
                </Button>
              </motion.div>
            </div>
          </div>
          
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
        </div>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
