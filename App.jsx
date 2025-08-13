import React, { useState, useEffect, createContext, useContext, useCallback, useRef } from 'react';
import { 
  Play, Video, Image, Settings, User, LogOut, Menu, X, 
  Upload, Download, Search, Filter, Plus, Trash2, 
  Eye, EyeOff, Lock, Mail, UserPlus, Zap, Clock, 
  BarChart3, Folder, Star, Heart, Share2, Edit3,
  ChevronDown, AlertCircle, CheckCircle, XCircle,
  Loader2, Sparkles, Wand2, Film, Camera, Layers,
  Wifi, WifiOff, RefreshCw, Home, Activity, Globe,
  TrendingUp, Award, Shield, Monitor, Crown, Rocket,
  ArrowRight, CheckCircle2, Users
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

// Enhanced Error Boundary with Better Recovery
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
    
    // Auto-retry for transient errors
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
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center border border-slate-200">
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
          </div>
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
      this.processQueue();
    });
    window.addEventListener('offline', () => { 
      this.isOnline = false; 
    });
  }

  async setupHealthCheck() {
    try {
      await this.healthCheck();
      console.log('✅ Backend connection verified');
    } catch (error) {
      console.warn('⚠️ Backend health check failed:', error.message);
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

// Enhanced Authentication Context
const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem('influencore_token');
    } catch {
      return null;
    }
  });
  const [networkStatus, setNetworkStatus] = useState(navigator.onLine);
  const apiClient = useRef(new ApiClient()).current;

  useEffect(() => {
    const handleOnline = () => setNetworkStatus(true);
    const handleOffline = () => setNetworkStatus(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const apiCall = useCallback(async (endpoint, options = {}) => {
    if (token && !options.headers?.Authorization) {
      options.headers = {
        ...options.headers,
        Authorization: `Bearer ${token}`
      };
    }
    return apiClient.apiCall(endpoint, options);
  }, [token, apiClient]);

  const login = async (email, password) => {
    try {
      setIsLoading(true);
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
      }
      return data;
    } catch (error) {
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        throw new Error('Invalid email or password');
      }
      if (error.message.includes('429')) {
        throw new Error('Too many login attempts. Please try again later.');
      }
      throw new Error(error.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name, email, password) => {
    try {
      setIsLoading(true);
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
      }
      return data;
    } catch (error) {
      if (error.message.includes('409') || error.message.includes('exists')) {
        throw new Error('An account with this email already exists');
      }
      if (error.message.includes('422') || error.message.includes('validation')) {
        throw new Error('Please check your information and try again');
      }
      throw new Error(error.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    try {
      localStorage.removeItem('influencore_token');
      localStorage.removeItem('influencore_user');
    } catch (error) {
      console.warn('Storage clear failed:', error);
    }
  }, []);

  const verifyToken = useCallback(async () => {
    if (!token) {
      return;
    }

    try {
      const data = await apiCall('/api/auth/verify');
      if (data.user) {
        setUser(data.user);
        try {
          localStorage.setItem('influencore_user', JSON.stringify(data.user));
        } catch (error) {
          console.warn('Storage update failed:', error);
        }
      } else {
        logout();
      }
    } catch (error) {
      console.warn('Token verification failed:', error);
      logout();
    }
  }, [token, apiCall, logout]);

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
      networkStatus,
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
    <div className={`border rounded-xl p-4 ${typeStyles[type]} flex items-start gap-3 ${className}`}>
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
    </div>
  );
};

// Network Status Indicator
const NetworkStatus = () => {
  const { networkStatus } = useAuth();

  if (networkStatus) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-red-600 text-white px-4 py-3 text-center z-50 shadow-lg">
      <div className="flex items-center justify-center gap-2">
        <WifiOff className="w-4 h-4" />
        <span className="text-sm font-medium">No internet connection - Retrying automatically...</span>
      </div>
    </div>
  );
};

// Enhanced Form Input Component
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
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${name}-error` : undefined}
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
        <p id={`${name}-error`} className="text-sm text-red-600 font-medium flex items-center gap-1">
          <AlertCircle className="w-4 h-4" />
          {error}
        </p>
      )}
    </div>
  );
};

// Enhanced Button Component
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

// Form Validation
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
  
  if (type === 'register' && formData.password && formData.password.length < 8) {
    errors.password = 'Password must be at least 8 characters long';
  }
  
  return errors;
};

// Landing Page Component
const LandingPage = ({ onShowAuth }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 overflow-hidden">
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
                onClick={() => onShowAuth('login')}
                className="text-gray-700 hover:text-gray-900 font-medium transition-colors hidden sm:block"
              >
                Sign In
              </button>
              <Button
                onClick={() => onShowAuth('register')}
                size="md"
                className="shadow-lg"
                icon={Rocket}
              >
                Start Free
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 md:pt-20 pb-16">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-800 text-sm font-semibold mb-8 animate-bounce">
              <Crown className="w-4 h-4 mr-2" />
              Launch Week: 50% Off Pro Plans
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 leading-tight mb-6">
              Create Viral{' '}
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Influencer
              </span>{' '}
              Videos with AI
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 leading-relaxed mb-8 max-w-3xl mx-auto">
              Transform your ideas into stunning, viral-ready content in seconds. Join 10,000+ creators using AI to dominate social media and scale their influence.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button
                onClick={() => onShowAuth('register')}
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
              >
                Watch Demo
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500 mb-16">
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
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-20">
            <div className="group p-8 rounded-3xl border bg-white border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-500 cursor-pointer transform hover:scale-105">
              <div className="w-14 h-14 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
                <Wand2 className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">AI-Powered Generation</h3>
              <p className="text-gray-600 leading-relaxed">Transform text prompts into stunning videos using cutting-edge AI models including OpenAI Sora and Google Veo 3.</p>
            </div>

            <div className="group p-8 rounded-3xl border bg-white border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-500 cursor-pointer transform hover:scale-105">
              <div className="w-14 h-14 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
                <TrendingUp className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Viral Optimization</h3>
              <p className="text-gray-600 leading-relaxed">Generate videos optimized for every platform with perfect aspect ratios, lengths, and styles for maximum engagement.</p>
            </div>

            <div className="group p-8 rounded-3xl border bg-white border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-500 cursor-pointer transform hover:scale-105">
              <div className="w-14 h-14 bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
                <Zap className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Lightning Fast</h3>
              <p className="text-gray-600 leading-relaxed">Create professional-quality videos in under 60 seconds. No technical skills required, just your creativity.</p>
            </div>

            <div className="group p-8 rounded-3xl border bg-white border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-500 cursor-pointer transform hover:scale-105">
              <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
                <BarChart3 className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Performance Analytics</h3>
              <p className="text-gray-600 leading-relaxed">Track your content performance with detailed analytics and insights to optimize your content strategy.</p>
            </div>
          </div>
        </div>
      </main>

      <section className="py-20 bg-gradient-to-r from-indigo-600 to-purple-600 relative overflow-hidden">
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to go viral?
          </h2>
          <p className="text-xl text-indigo-100 mb-10 max-w-2xl mx-auto">
            Join the AI content revolution. Start creating viral videos that grow your influence and income today.
          </p>
          
          <Button
            onClick={() => onShowAuth('register')}
            variant="secondary"
            size="lg"
            className="text-lg px-12 py-5 bg-white text-indigo-600 hover:bg-gray-50 shadow-xl font-bold"
            icon={Rocket}
          >
            
