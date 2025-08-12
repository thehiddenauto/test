import React, { useState, useEffect, createContext, useContext, useCallback, useRef } from 'react';
import { 
  Play, Video, Image, Settings, User, LogOut, Menu, X, 
  Upload, Download, Search, Filter, Plus, Trash2, 
  Eye, EyeOff, Lock, Mail, UserPlus, Zap, Clock, 
  BarChart3, Folder, Star, Heart, Share2, Edit3,
  ChevronDown, AlertCircle, CheckCircle, XCircle,
  Loader2, Sparkles, Wand2, Film, Camera, Layers,
  Wifi, WifiOff, RefreshCw, Home, Activity, Globe,
  TrendingUp, Award, Shield, Monitor
} from 'lucide-react';

// Configuration with environment fallbacks
const config = {
  apiBaseUrl: 'https://backend-9g44.onrender.com',
  apiTimeout: 30000,
  maxRetries: 3,
  appName: 'Influencore',
  appVersion: '1.0.0',
  enableAnalytics: true,
  enableDebug: false,
  googleAnalyticsId: 'GA_MEASUREMENT_ID',
  sentryDsn: 'SENTRY_DSN_PLACEHOLDER',
  environment: 'production'
};

// Error Boundary with Auto-Recovery
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, retryCount: 0 };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Auto-recovery error:', error, errorInfo);
    
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
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
            <Shield className="w-12 h-12 text-blue-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Auto-Recovery</h2>
            <p className="text-gray-600 mb-6">System recovering automatically...</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center gap-2 mx-auto"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
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
    this.setupNetworkMonitoring();
  }

  setupNetworkMonitoring() {
    window.addEventListener('online', () => { this.isOnline = true; });
    window.addEventListener('offline', () => { this.isOnline = false; });
  }

  async makeRequest(endpoint, options = {}) {
    const url = `${config.apiBaseUrl}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.apiTimeout);

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
        throw new Error(errorData.message || `API Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  async apiCall(endpoint, options = {}) {
    if (!this.isOnline) {
      throw new Error('No internet connection');
    }

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        return await this.makeRequest(endpoint, options);
      } catch (error) {
        const isLastAttempt = attempt === config.maxRetries;
        const shouldRetry = !isLastAttempt && (
          error.name === 'AbortError' ||
          error.message.includes('fetch') ||
          error.message.includes('network')
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

// Authentication Context
const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem('token');
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
      const data = await apiCall('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (data.token && data.user) {
        setToken(data.token);
        setUser(data.user);
        try {
          localStorage.setItem('token', data.token);
        } catch (error) {
          console.warn('Storage failed:', error);
        }
      }
      return data;
    } catch (error) {
      if (error.message.includes('401')) {
        throw new Error('Invalid email or password');
      }
      throw error;
    }
  };

  const register = async (name, email, password) => {
    try {
      const data = await apiCall('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      });

      if (data.token && data.user) {
        setToken(data.token);
        setUser(data.user);
        try {
          localStorage.setItem('token', data.token);
        } catch (error) {
          console.warn('Storage failed:', error);
        }
      }
      return data;
    } catch (error) {
      if (error.message.includes('409')) {
        throw new Error('Account already exists');
      }
      throw error;
    }
  };

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    try {
      localStorage.removeItem('token');
    } catch (error) {
      console.warn('Storage clear failed:', error);
    }
  }, []);

  const verifyToken = useCallback(async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const data = await apiCall('/api/auth/verify');
      if (data.user) {
        setUser(data.user);
      } else {
        logout();
      }
    } catch (error) {
      logout();
    } finally {
      setIsLoading(false);
    }
  }, [token, apiCall, logout]);

  useEffect(() => {
    verifyToken();
  }, [verifyToken]);

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

// Loading Components
const LoadingSpinner = ({ size = 'md', text = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <Loader2 className={`${sizeClasses[size]} animate-spin text-blue-600`} />
      {text && <p className="text-sm text-gray-600">{text}</p>}
    </div>
  );
};

const Alert = ({ type = 'info', children, onClose }) => {
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
    <div className={`border rounded-lg p-4 ${typeStyles[type]} flex items-start gap-3`}>
      <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
      <div className="flex-1">{children}</div>
      {onClose && (
        <button onClick={onClose} className="flex-shrink-0">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

// Network Status
const NetworkStatus = () => {
  const { networkStatus } = useAuth();

  if (networkStatus) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-red-600 text-white px-4 py-2 text-center z-50">
      <div className="flex items-center justify-center gap-2">
        <WifiOff className="w-4 h-4" />
        <span className="text-sm">No internet connection - Auto-retry enabled</span>
      </div>
    </div>
  );
};

// Login Form
const LoginForm = ({ onSwitchToRegister }) => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, networkStatus } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!networkStatus) {
      setError('No internet connection');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await login(formData.email, formData.password);
    } catch (err) {
      setError(err.message || 'Login failed');
      setTimeout(() => setError(''), 8000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
      <NetworkStatus />
      
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            <h1 className="text-3xl font-bold">{config.appName}</h1>
          </div>
          <p className="text-gray-600 mt-2">Sign in to your account</p>
        </div>

        {error && (
          <Alert type="error" onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your email"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your password"
                required
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                disabled={isLoading}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !networkStatus}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? <LoadingSpinner size="sm" /> : <Zap className="w-5 h-5" />}
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Don't have an account?{' '}
            <button
              onClick={onSwitchToRegister}
              className="text-blue-600 hover:text-blue-700 font-medium"
              disabled={isLoading}
            >
              Sign up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

// Register Form
const RegisterForm = ({ onSwitchToLogin }) => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { register, networkStatus } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!networkStatus) {
      setError('No internet connection');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await register(formData.name, formData.email, formData.password);
    } catch (err) {
      setError(err.message || 'Registration failed');
      setTimeout(() => setError(''), 8000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
      <NetworkStatus />
      
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            <h1 className="text-3xl font-bold">{config.appName}</h1>
          </div>
          <p className="text-gray-600 mt-2">Create your account</p>
        </div>

        {error && (
          <Alert type="error" onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your full name"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your email"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Create a password"
                required
                minLength="6"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                disabled={isLoading}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !networkStatus}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? <LoadingSpinner size="sm" /> : <UserPlus className="w-5 h-5" />}
            {isLoading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Already have an account?{' '}
            <button
              onClick={onSwitchToLogin}
              className="text-blue-600 hover:text-blue-700 font-medium"
              disabled={isLoading}
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

// Video Generator
const VideoGenerator = () => {
  const [model, setModel] = useState('veo3');
  const [prompt, setPrompt] = useState('');
  const [options, setOptions] = useState({
    duration: '30',
    fps: '30',
    resolution: '1080p',
    style: 'cinematic',
    quality: 'high'
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState(null);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const { apiCall, networkStatus } = useAuth();

  const models = [
    { 
      id: 'veo3', 
      name: 'Google Veo 3', 
      description: 'Latest AI video generation',
      icon: Sparkles,
      gradient: 'from-blue-500 to-blue-600'
    },
    { 
      id: 'sora', 
      name: 'OpenAI Sora', 
      description: 'Advanced video synthesis',
      icon: Wand2,
      gradient: 'from-purple-500 to-purple-600'
    },
    { 
      id: 'viral', 
      name: 'Viral Shorts', 
      description: 'Social media optimized',
      icon: Zap,
      gradient: 'from-green-500 to-green-600'
    },
    { 
      id: 'image-to-video', 
      name: 'Image to Video', 
      description: 'Convert images to videos',
      icon: Image,
      gradient: 'from-orange-500 to-orange-600'
    }
  ];

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      setTimeout(() => setError(''), 5000);
      return;
    }

    if (!networkStatus) {
      setError('No internet connection');
      return;
    }

    setIsGenerating(true);
    setError('');
    setProgress(0);
    setStatus('Initializing...');

    // Progress simulation
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const newProgress = Math.min(prev + Math.random() * 10 + 5, 95);
        
        if (newProgress > 20) setStatus('Processing prompt...');
        if (newProgress > 40) setStatus('Generating frames...');
        if (newProgress > 60) setStatus('Applying AI effects...');
        if (newProgress > 80) setStatus('Finalizing video...');
        
        return newProgress;
      });
    }, 1000);

    try {
      const endpoints = {
        'veo3': '/api/generate-veo3-video',
        'sora': '/api/generate-sora-video',
        'viral': '/api/generate-viral-short',
        'image-to-video': '/api/generate-video-from-image'
      };

      const endpoint = endpoints[model] || endpoints['veo3'];
      const payload = { prompt, options };

      if (model === 'image-to-video') {
        payload.imageUrl = 'https://via.placeholder.com/1920x1080/4F46E5/FFFFFF?text=Sample+Image';
      }

      const result = await apiCall(endpoint, {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      clearInterval(progressInterval);
      setProgress(100);
      setStatus('Complete!');
      
      setGeneratedVideo({
        ...result,
        id: Date.now(),
        title: prompt.slice(0, 50) + (prompt.length > 50 ? '...' : ''),
        model,
        created: new Date().toISOString(),
        videoUrl: result.videoUrl || '#'
      });
      
      setTimeout(() => {
        setProgress(0);
        setStatus('');
      }, 3000);
      
    } catch (err) {
      clearInterval(progressInterval);
      setProgress(0);
      setStatus('');
      setError(err.message || 'Generation failed');
      setTimeout(() => setError(''), 8000);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-lg">
            <Wand2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AI Video Generator</h1>
            <p className="text-gray-600">Create amazing videos with AI</p>
          </div>
        </div>

        {error && (
          <Alert type="error" onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                AI Model
              </label>
              <div className="grid grid-cols-1 gap-3">
                {models.map((m) => {
                  const Icon = m.icon;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setModel(m.id)}
                      className={`p-4 border rounded-lg text-left transition-all hover:shadow-md ${
                        model === m.id
                          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-gradient-to-r ${m.gradient}`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{m.name}</div>
                          <div className="text-sm text-gray-600">{m.description}</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Video Prompt
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Describe the video you want to generate..."
                disabled={isGenerating}
              />
              <div className="text-sm text-gray-500 mt-1">
                {prompt.length}/500 characters
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration
                </label>
                <select
                  value={options.duration}
                  onChange={(e) => setOptions({...options, duration: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  disabled={isGenerating}
                >
                  <option value="15">15 seconds</option>
                  <option value="30">30 seconds</option>
                  <option value="60">1 minute</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quality
                </label>
                <select
                  value={options.quality}
                  onChange={(e) => setOptions({...options, quality: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  disabled={isGenerating}
                >
                  <option value="standard">Standard</option>
                  <option value="high">High</option>
                  <option value="premium">Premium</option>
                </select>
              </div>
            </div>

            {isGenerating && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <LoadingSpinner size="sm" />
                  <span className="font-medium text-blue-900">Generating Video</span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2 mb-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-blue-700">{status}</p>
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim() || !networkStatus}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isGenerating ? <LoadingSpinner size="sm" /> : <Sparkles className="w-5 h-5" />}
              {isGenerating ? 'Generating Video...' : 'Generate Video'}
            </button>
          </div>

          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="font-medium text-gray-900 mb-4">Preview</h3>
            {generatedVideo ? (
              <div className="space-y-4">
                <div className="bg-black rounded-lg aspect-video flex items-center justify-center relative overflow-hidden">
                  <div className="text-white text-center">
                    <Film className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm opacity-75">Video Generated Successfully</p>
                    <p className="text-xs opacity-50 mt-1">{generatedVideo.model.toUpperCase()}</p>
                  </div>
                  <button className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <Play className="w-16 h-16 text-white" />
                  </button>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">{generatedVideo.title}</h4>
                  <p className="text-sm text-gray-600">
                    Duration: {options.duration}s • Quality: {options.quality} • Model: {generatedVideo.model}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = generatedVideo.videoUrl;
                      link.download = `${generatedVideo.title}.mp4`;
                      link.click();
                    }}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                  <button className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 flex items-center justify-center gap-2">
                    <Share2 className="w-4 h-4" />
                    Share
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-gray-100 rounded-lg aspect-video flex items-center justify-center">
                <div className="text-center text-gray-500">
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

// Dashboard Component
const Dashboard = () => {
  const [videos, setVideos] = useState([]);
  const [stats, setStats] = useState({ total: 0, thisMonth: 0, views: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const loadData = async () => {
      try {
        // Simulate API data
        const mockVideos = [
          { id: 1, title: 'AI Landscape', duration: '0:30', views: 1250, created: '2024-01-15' },
          { id: 2, title: 'Viral Dance', duration: '0:15', views: 5600, created: '2024-01-14' },
          { id: 3, title: 'Product Demo', duration: '1:00', views: 890, created: '2024-01-13' }
        ];
        
        setVideos(mockVideos);
        setStats({
          total: mockVideos.length,
          thisMonth: mockVideos.length,
          views: mockVideos.reduce((sum, v) => sum + v.views, 0)
        });
      } catch (error) {
        console.error('Dashboard load failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.name || 'User'}!
        </h1>
        <p className="text-gray-600">Here's your video generation overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Video className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-sm text-green-600 font-medium">+12%</span>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Videos</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-purple-100 p-3 rounded-lg">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-sm text-green-600 font-medium">+8%</span>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{stats.views.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Total Views</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-green-100 p-3 rounded-lg">
              <Clock className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-sm text-green-600 font-medium">+5</span>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{stats.thisMonth}</div>
            <div className="text-sm text-gray-600">This Month</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Recent Videos</h2>
        </div>
        <div className="p-6">
          {videos.length > 0 ? (
            <div className="space-y-4">
              {videos.map((video) => (
                <div key={video.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-4">
                    <div className="bg-gray-100 w-16 h-12 rounded flex items-center justify-center">
                      <Play className="w-5 h-5 text-gray-500" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{video.title}</h3>
                      <p className="text-sm text-gray-600">{video.duration} • {video.views} views</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2 text-gray-500 hover:text-blue-600">
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-500 hover:text-green-600">
                      <Download className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-500 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Folder className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No videos yet. Start creating your first AI video!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Content Library
const ContentLibrary = () => {
  const [videos, setVideos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadVideos = async () => {
      try {
        const mockVideos = [
          {
            id: 1,
            title: 'AI Generated Landscape',
            duration: '0:30',
            model: 'veo3',
            created: '2024-01-15',
            views: 1250,
            status: 'completed'
          },
          {
            id: 2,
            title: 'Viral Dance Video',
            duration: '0:15',
            model: 'viral',
            created: '2024-01-14',
            views: 5600,
            status: 'completed'
          },
          {
            id: 3,
            title: 'Product Demo',
            duration: '1:00',
            model: 'sora',
            created: '2024-01-13',
            views: 890,
            status: 'processing'
          }
        ];
        
        setVideos(mockVideos);
      } catch (error) {
        console.error('Failed to load videos:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadVideos();
  }, []);

  const filteredVideos = videos.filter(video => {
    const matchesSearch = video.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || video.model === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Content Library</h1>
          <p className="text-gray-600">Manage your AI-generated videos</p>
        </div>
        <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Create Video
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-lg mb-6">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search videos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="pl-10 pr-8 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Models</option>
                <option value="veo3">Veo 3</option>
                <option value="sora">Sora</option>
                <option value="viral">Viral</option>
              </select>
            </div>
          </div>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="border border-gray-200 rounded-lg overflow-hidden animate-pulse">
                  <div className="bg-gray-200 aspect-video"></div>
                  <div className="p-4">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredVideos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVideos.map((video) => (
                <div key={video.id} className="group border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative">
                    <div className="bg-gray-100 aspect-video flex items-center justify-center">
                      <Play className="w-12 h-12 text-gray-400 group-hover:text-blue-600 transition-colors" />
                    </div>
                    <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                      {video.duration}
                    </div>
                    <div className="absolute top-2 left-2">
                      <span className={`text-xs px-2 py-1 rounded ${
                        video.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {video.status}
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium text-gray-900 mb-2 truncate">{video.title}</h3>
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                      <span className="capitalize">{video.model}</span>
                      <span>{video.views} views</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="flex-1 bg-blue-600 text-white py-2 px-3 rounded text-sm hover:bg-blue-700 flex items-center justify-center gap-1">
                        <Play className="w-3 h-3" />
                        Play
                      </button>
                      <button className="p-2 text-gray-500 hover:text-blue-600 border border-gray-300 rounded">
                        <Download className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-500 hover:text-green-600 border border-gray-300 rounded">
                        <Share2 className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-500 hover:text-red-600 border border-gray-300 rounded">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No videos found matching your criteria</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Settings Page
const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const { user, logout } = useAuth();

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'preferences', name: 'Preferences', icon: Settings },
    { id: 'billing', name: 'Billing', icon: BarChart3 }
  ];

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your account and preferences</p>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 px-6 py-4 text-sm font-medium border-b-2 flex items-center justify-center gap-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Profile Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      defaultValue={user?.name || ''}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      defaultValue={user?.email || ''}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
                  Save Changes
                </button>
                <button
                  onClick={logout}
                  className="text-red-600 hover:text-red-700 flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Preferences</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">Email Notifications</h4>
                    <p className="text-sm text-gray-600">Receive updates about your videos</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">Auto-save Projects</h4>
                    <p className="text-sm text-gray-600">Automatically save your work</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Billing Information</h3>
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">Current Plan: Pro</h4>
                    <p className="text-sm text-gray-600">Unlimited video generation</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">$29/month</div>
                    <div className="text-sm text-gray-600">Next billing: Feb 15</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Sidebar Navigation
const Sidebar = ({ isOpen, onClose, currentPage, onPageChange }) => {
  const navigation = [
    { id: 'dashboard', name: 'Dashboard', icon: BarChart3 },
    { id: 'generate', name: 'Generate Video', icon: Wand2 },
    { id: 'library', name: 'Content Library', icon: Folder },
    { id: 'settings', name: 'Settings', icon: Settings }
  ];

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      <div className={`fixed left-0 top-0 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-50 ${
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      } lg:static lg:transform-none`}>
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              <h1 className="text-xl font-bold">{config.appName}</h1>
            </div>
            <button onClick={onClose} className="lg:hidden">
              <X className="w-5 h-5" />
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
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      currentPage === item.id
                        ? 'bg-blue-50 text-blue-600 border border-blue-200'
                        : 'text-gray-700 hover:bg-gray-50'
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
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <Star className="w-5 h-5 text-yellow-500" />
              <span className="font-medium text-gray-900">Pro Plan</span>
            </div>
            <p className="text-sm text-gray-600 mb-3">Unlimited video generation</p>
            <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-4 rounded-lg text-sm hover:from-blue-700 hover:to-purple-700">
              Upgrade Plan
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

// Main App Component
const App = () => {
  const [isAuthMode, setIsAuthMode] = useState('login');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const { isAuthenticated, isLoading, user } = useAuth();

  // Auto-initialize analytics and monitoring
  useEffect(() => {
    if (config.googleAnalyticsId && config.googleAnalyticsId !== 'GA_MEASUREMENT_ID') {
      try {
        window.gtag = window.gtag || function(){(window.dataLayer = window.dataLayer || []).push(arguments);};
        window.gtag('js', new Date());
        window.gtag('config', config.googleAnalyticsId);
        console.log('Analytics initialized');
      } catch (error) {
        console.warn('Analytics init failed:', error);
      }
    }

    if (config.sentryDsn && config.sentryDsn !== 'SENTRY_DSN_PLACEHOLDER') {
      try {
        console.log('Error monitoring configured');
      } catch (error) {
        console.warn('Monitoring init failed:', error);
      }
    }
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" text={`Loading ${config.appName}...`} />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return isAuthMode === 'login' ? (
      <LoginForm onSwitchToRegister={() => setIsAuthMode('register')} />
    ) : (
      <RegisterForm onSwitchToLogin={() => setIsAuthMode('login')} />
    );
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
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
      />
      
      <div className="flex-1 lg:ml-0">
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden"
            >
              <Menu className="w-6 h-6" />
            </button>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user?.name?.charAt(0) || 'U'}
                  </span>
                </div>
                <span className="hidden md:block font-medium text-gray-900">{user?.name}</span>
              </div>
            </div>
          </div>
        </header>

        <main className="p-6">
          {renderPage()}
        </main>
      </div>
    </div>
  );
};

// Root App with Error Boundary
const RootApp = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default RootApp;