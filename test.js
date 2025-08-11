import React, { useState, useEffect, useContext, createContext } from 'react';
import { User, Video, Settings, CreditCard, Upload, Download, Play, Pause, Search, Filter, Plus, LogOut, Menu, X, Check, Star, Zap, Crown, AlertCircle, Loader2, Eye, Heart, Share2, Trash2 } from 'lucide-react';

// Auth Context
const AuthContext = createContext();

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// API Service
class APIService {
  static BASE_URL = 'https://backend-9g44.onrender.com';
  
  static getToken() {
    return localStorage.getItem('authToken');
  }
  
  static setToken(token) {
    localStorage.setItem('authToken', token);
  }
  
  static removeToken() {
    localStorage.removeItem('authToken');
  }
  
  static async request(endpoint, options = {}) {
    const token = this.getToken();
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };
    
    try {
      const response = await fetch(`${this.BASE_URL}${endpoint}`, config);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Network error' }));
        throw new Error(error.message || `HTTP ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      throw error;
    }
  }
  
  static async login(email, password) {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }
  
  static async register(userData) {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }
  
  static async getVideoModels() {
    return this.request('/api/video-models');
  }
  
  static async generateVideo(model, prompt, options) {
    const endpoints = {
      'veo3': '/api/generate-veo3-video',
      'sora': '/api/generate-sora-video',
      'viral': '/api/generate-viral-short'
    };
    
    return this.request(endpoints[model], {
      method: 'POST',
      body: JSON.stringify({ prompt, options }),
    });
  }
  
  static async generateVideoFromImage(imageUrl, prompt, options) {
    return this.request('/api/generate-video-from-image', {
      method: 'POST',
      body: JSON.stringify({ imageUrl, prompt, options }),
    });
  }
  
  static async generateText(message, mode) {
    return this.request('/api/generate-text', {
      method: 'POST',
      body: JSON.stringify({ message, mode }),
    });
  }
}

// Auth Provider
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const token = APIService.getToken();
    if (token) {
      // Decode JWT token to get user info (in production, validate with backend)
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser({
          id: payload.userId,
          email: payload.email,
          name: payload.name,
          plan: payload.plan || 'free',
          usage: payload.usage || { videos: 0, limit: 2 }
        });
      } catch (error) {
        APIService.removeToken();
      }
    }
    setLoading(false);
  }, []);
  
  const login = async (email, password) => {
    try {
      const response = await APIService.login(email, password);
      APIService.setToken(response.token);
      setUser(response.user);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };
  
  const register = async (userData) => {
    try {
      const response = await APIService.register(userData);
      APIService.setToken(response.token);
      setUser(response.user);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };
  
  const logout = () => {
    APIService.removeToken();
    setUser(null);
  };
  
  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Login Component
const LoginForm = ({ onToggle }) => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const result = await login(formData.email, formData.password);
    
    if (!result.success) {
      setError(result.error);
    }
    
    setLoading(false);
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-gray-700">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-gray-400">Sign in to your Influencore account</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your email"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your password"
            />
          </div>
          
          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-900/20 p-3 rounded-lg">
              <AlertCircle size={16} />
              {error}
            </div>
          )}
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : null}
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-gray-400">
            Don't have an account?{' '}
            <button onClick={onToggle} className="text-blue-400 hover:text-blue-300 font-medium">
              Sign up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

// Register Component
const RegisterForm = ({ onToggle }) => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { register } = useAuth();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }
    
    const result = await register({
      name: formData.name,
      email: formData.email,
      password: formData.password
    });
    
    if (!result.success) {
      setError(result.error);
    }
    
    setLoading(false);
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-gray-700">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Join Influencore</h1>
          <p className="text-gray-400">Create your account and start generating</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your email"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Create a password"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Confirm Password</label>
            <input
              type="password"
              required
              value={formData.confirmPassword}
              onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Confirm your password"
            />
          </div>
          
          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-900/20 p-3 rounded-lg">
              <AlertCircle size={16} />
              {error}
            </div>
          )}
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : null}
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-gray-400">
            Already have an account?{' '}
            <button onClick={onToggle} className="text-blue-400 hover:text-blue-300 font-medium">
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

// Header Component
const Header = ({ activeTab, setActiveTab, user, onLogout }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const navigation = [
    { id: 'generate', label: 'Generate', icon: Video },
    { id: 'library', label: 'Library', icon: Download },
    { id: 'dashboard', label: 'Dashboard', icon: Settings },
    { id: 'billing', label: 'Billing', icon: CreditCard },
  ];
  
  return (
    <header className="bg-gray-900 border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Zap className="text-white" size={18} />
              </div>
              <h1 className="text-xl font-bold text-white">Influencore</h1>
            </div>
          </div>
          
          <nav className="hidden md:flex space-x-8">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === item.id
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <Icon size={18} />
                  {item.label}
                </button>
              );
            })}
          </nav>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-gray-800 rounded-full">
              <div className={`w-2 h-2 rounded-full ${
                user.plan === 'free' ? 'bg-gray-400' :
                user.plan === 'pro' ? 'bg-blue-400' : 'bg-purple-400'
              }`}></div>
              <span className="text-sm text-gray-300 capitalize">{user.plan}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                <User size={16} className="text-gray-300" />
              </div>
              <span className="hidden md:block text-sm text-gray-300">{user.name}</span>
            </div>
            
            <button
              onClick={onLogout}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <LogOut size={18} />
            </button>
            
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-400 hover:text-white"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
        
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-800">
            <div className="space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm font-medium ${
                      activeTab === item.id
                        ? 'bg-gray-800 text-white'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`}
                  >
                    <Icon size={18} />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

// Video Generation Component
const VideoGeneration = ({ user, onVideoGenerated }) => {
  const [prompt, setPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState('veo3');
  const [options, setOptions] = useState({
    duration: 10,
    fps: 30,
    resolution: '1080p',
    style: 'realistic',
    quality: 'high'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState('');
  
  const models = [
    { id: 'veo3', name: 'Google Veo 3', description: 'Best for realistic videos', icon: '🎬' },
    { id: 'sora', name: 'OpenAI Sora', description: 'Creative and artistic videos', icon: '🎨' },
    { id: 'viral', name: 'Viral Shorts', description: 'Optimized for social media', icon: '🔥' }
  ];
  
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setUploadedImageUrl(e.target.result);
      reader.readAsDataURL(file);
    }
  };
  
  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    if (user.usage.videos >= user.usage.limit) {
      setError('You have reached your generation limit. Please upgrade your plan.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      let result;
      
      if (uploadedImageUrl && selectedModel !== 'viral') {
        result = await APIService.generateVideoFromImage(uploadedImageUrl, prompt, options);
      } else {
        result = await APIService.generateVideo(selectedModel, prompt, options);
      }
      
      onVideoGenerated(result);
      setPrompt('');
      setImageFile(null);
      setUploadedImageUrl('');
      
    } catch (error) {
      setError(error.message || 'Failed to generate video');
    }
    
    setLoading(false);
  };
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700">
        <h2 className="text-2xl font-bold text-white mb-6">Generate AI Video</h2>
        
        {/* Model Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-3">Choose AI Model</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {models.map((model) => (
              <button
                key={model.id}
                onClick={() => setSelectedModel(model.id)}
                className={`p-4 rounded-xl border-2 transition-colors text-left ${
                  selectedModel === model.id
                    ? 'border-blue-500 bg-blue-900/20'
                    : 'border-gray-600 bg-gray-700 hover:border-gray-500'
                }`}
              >
                <div className="text-2xl mb-2">{model.icon}</div>
                <div className="text-white font-semibold">{model.name}</div>
                <div className="text-gray-400 text-sm">{model.description}</div>
              </button>
            ))}
          </div>
        </div>
        
        {/* Image Upload */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-3">Image to Video (Optional)</label>
          <div className="border-2 border-dashed border-gray-600 rounded-xl p-6 text-center">
            {uploadedImageUrl ? (
              <div className="space-y-4">
                <img src={uploadedImageUrl} alt="Uploaded" className="max-w-xs mx-auto rounded-lg" />
                <button
                  onClick={() => {
                    setImageFile(null);
                    setUploadedImageUrl('');
                  }}
                  className="text-red-400 hover:text-red-300"
                >
                  Remove Image
                </button>
              </div>
            ) : (
              <div>
                <Upload className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="text-gray-400 mb-4">Upload an image to convert to video</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="inline-flex items-center gap-2 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg cursor-pointer transition-colors text-white"
                >
                  <Upload size={20} />
                  Choose Image
                </label>
              </div>
            )}
          </div>
        </div>
        
        {/* Prompt Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-3">Video Description</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the video you want to generate..."
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent h-32 resize-none"
          />
        </div>
        
        {/* Options */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Duration</label>
            <select
              value={options.duration}
              onChange={(e) => setOptions({...options, duration: parseInt(e.target.value)})}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value={5}>5 seconds</option>
              <option value={10}>10 seconds</option>
              <option value={15}>15 seconds</option>
              <option value={30}>30 seconds</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Quality</label>
            <select
              value={options.quality}
              onChange={(e) => setOptions({...options, quality: e.target.value})}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="standard">Standard</option>
              <option value="high">High</option>
              <option value="ultra">Ultra</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Style</label>
            <select
              value={options.style}
              onChange={(e) => setOptions({...options, style: e.target.value})}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="realistic">Realistic</option>
              <option value="artistic">Artistic</option>
              <option value="cinematic">Cinematic</option>
              <option value="animated">Animated</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Resolution</label>
            <select
              value={options.resolution}
              onChange={(e) => setOptions({...options, resolution: e.target.value})}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="720p">720p</option>
              <option value="1080p">1080p</option>
              <option value="4k">4K</option>
            </select>
          </div>
        </div>
        
        {/* Usage Info */}
        <div className="bg-gray-700 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Generation Usage</p>
              <p className="text-gray-400 text-sm">
                {user.usage.videos} / {user.usage.limit} videos used this month
              </p>
            </div>
            <div className="w-24 bg-gray-600 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${Math.min((user.usage.videos / user.usage.limit) * 100, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
        
        {error && (
          <div className="mb-6 flex items-center gap-2 text-red-400 text-sm bg-red-900/20 p-3 rounded-lg">
            <AlertCircle size={16} />
            {error}
          </div>
        )}
        
        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={loading || !prompt.trim() || user.usage.videos >= user.usage.limit}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-semibold py-4 rounded-xl transition-all flex items-center justify-center gap-3 text-lg"
        >
          {loading ? (
            <>
              <Loader2 size={24} className="animate-spin" />
              Generating Video...
            </>
          ) : (
            <>
              <Video size={24} />
              Generate Video
            </>
          )}
        </button>
      </div>
    </div>
  );
};

// Content Library Component
const ContentLibrary = ({ videos, onDeleteVideo }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterModel, setFilterModel] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  
  const filteredVideos = videos
    .filter(video => 
      video.prompt.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (filterModel === 'all' || video.model === filterModel)
    )
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
      return a.prompt.localeCompare(b.prompt);
    });
  
  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-4 md:mb-0">Content Library</h2>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search videos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
            />
          </div>
          
          <select
            value={filterModel}
            onChange={(e) => setFilterModel(e.target.value)}
            className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Models</option>
            <option value="veo3">Veo 3</option>
            <option value="sora">Sora</option>
            <option value="viral">Viral</option>
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="alphabetical">A-Z</option>
          </select>
        </div>
      </div>
      
      {filteredVideos.length === 0 ? (
        <div className="text-center py-12">
          <Video className="mx-auto text-gray-600 mb-4" size={64} />
          <h3 className="text-xl font-semibold text-white mb-2">No videos found</h3>
          <p className="text-gray-400">
            {videos.length === 0 
              ? "You haven't generated any videos yet. Start creating!"
              : "No videos match your search criteria."
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVideos.map((video) => (
            <div key={video.id} className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 hover:border-gray-600 transition-colors">
              <div className="relative group">
                {video.thumbnail ? (
                  <img 
                    src={video.thumbnail} 
                    alt={video.prompt}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
                    <Video className="text-gray-500" size={48} />
                  </div>
                )}
                
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="flex gap-2">
                    <button className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors">
                      <Play className="text-white" size={20} />
                    </button>
                    <button className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors">
                      <Download className="text-white" size={20} />
                    </button>
                    <button 
                      onClick={() => onDeleteVideo(video.id)}
                      className="p-2 bg-red-500/20 rounded-full hover:bg-red-500/30 transition-colors"
                    >
                      <Trash2 className="text-red-400" size={20} />
                    </button>
                  </div>
                </div>
                
                <div className="absolute top-2 left-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    video.model === 'veo3' ? 'bg-blue-500/20 text-blue-400' :
                    video.model === 'sora' ? 'bg-purple-500/20 text-purple-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {video.model.toUpperCase()}
                  </span>
                </div>
                
                <div className="absolute bottom-2 right-2">
                  <span className="bg-black/70 text-white px-2 py-1 rounded text-xs">
                    {video.duration}s
                  </span>
                </div>
              </div>
              
              <div className="p-4">
                <p className="text-white font-medium mb-2 line-clamp-2">{video.prompt}</p>
                <p className="text-gray-400 text-sm">
                  {new Date(video.createdAt).toLocaleDateString()}
                </p>
                
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-700">
                  <div className="flex items-center gap-4 text-gray-400 text-sm">
                    <span className="flex items-center gap-1">
                      <Eye size={14} />
                      {Math.floor(Math.random() * 100)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart size={14} />
                      {Math.floor(Math.random() * 50)}
                    </span>
                  </div>
                  
                  <button className="text-gray-400 hover:text-white transition-colors">
                    <Share2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Dashboard Component
const Dashboard = ({ user, videos }) => {
  const totalVideos = videos.length;
  const thisMonthVideos = videos.filter(video => {
    const videoDate = new Date(video.createdAt);
    const now = new Date();
    return videoDate.getMonth() === now.getMonth() && videoDate.getFullYear() === now.getFullYear();
  }).length;
  
  const modelStats = videos.reduce((acc, video) => {
    acc[video.model] = (acc[video.model] || 0) + 1;
    return acc;
  }, {});
  
  const recentVideos = videos.slice(0, 3);
  
  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Dashboard</h2>
        <p className="text-gray-400">Welcome back, {user.name}!</p>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Videos</p>
              <p className="text-2xl font-bold text-white">{totalVideos}</p>
            </div>
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Video className="text-blue-400" size={24} />
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">This Month</p>
              <p className="text-2xl font-bold text-white">{thisMonthVideos}</p>
            </div>
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
              <Zap className="text-green-400" size={24} />
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Plan Status</p>
              <p className="text-2xl font-bold text-white capitalize">{user.plan}</p>
            </div>
            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
              {user.plan === 'free' ? (
                <Star className="text-purple-400" size={24} />
              ) : (
                <Crown className="text-purple-400" size={24} />
              )}
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Usage</p>
              <p className="text-2xl font-bold text-white">
                {user.usage.videos}/{user.usage.limit}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
              <Settings className="text-orange-400" size={24} />
            </div>
          </div>
        </div>
      </div>
      
      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <h3 className="text-xl font-semibold text-white mb-4">Recent Videos</h3>
          {recentVideos.length === 0 ? (
            <p className="text-gray-400">No videos generated yet.</p>
          ) : (
            <div className="space-y-4">
              {recentVideos.map((video) => (
                <div key={video.id} className="flex items-center gap-4 p-3 bg-gray-700 rounded-lg">
                  <div className="w-16 h-12 bg-gray-600 rounded flex items-center justify-center">
                    <Video className="text-gray-400" size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium text-sm line-clamp-1">{video.prompt}</p>
                    <p className="text-gray-400 text-xs">
                      {video.model.toUpperCase()} • {new Date(video.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <h3 className="text-xl font-semibold text-white mb-4">Model Usage</h3>
          <div className="space-y-4">
            {Object.entries(modelStats).map(([model, count]) => (
              <div key={model} className="flex items-center justify-between">
                <span className="text-gray-300 capitalize">{model}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${(count / totalVideos) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-white text-sm w-8">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Billing Component
const Billing = ({ user }) => {
  const [loading, setLoading] = useState(false);
  
  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: '$0',
      period: 'forever',
      features: [
        '2 video generations per month',
        'Standard quality (720p)',
        'Basic AI models',
        'Community support'
      ],
      current: user.plan === 'free'
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '$29',
      period: 'per month',
      features: [
        '100 video generations per month',
        'High quality (1080p)',
        'All AI models (Veo 3, Sora)',
        'Priority support',
        'Advanced options',
        'Commercial license'
      ],
      popular: true,
      current: user.plan === 'pro'
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: '$99',
      period: 'per month',
      features: [
        'Unlimited video generations',
        'Ultra quality (4K)',
        'All AI models + Beta access',
        'Dedicated support',
        'Custom integrations',
        'Team management',
        'API access'
      ],
      current: user.plan === 'enterprise'
    }
  ];
  
  const handleUpgrade = async (planId) => {
    setLoading(true);
    
    // Simulate Stripe checkout
    setTimeout(() => {
      alert(`Redirecting to Stripe checkout for ${planId} plan...`);
      setLoading(false);
    }, 1000);
  };
  
  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-4">Choose Your Plan</h2>
        <p className="text-gray-400">Upgrade to unlock more generations and premium features</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        {plans.map((plan) => (
          <div key={plan.id} className={`relative bg-gray-800 rounded-2xl p-8 border-2 ${
            plan.popular ? 'border-blue-500' : 'border-gray-700'
          }`}>
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                  Most Popular
                </span>
              </div>
            )}
            
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
              <div className="mb-4">
                <span className="text-4xl font-bold text-white">{plan.price}</span>
                <span className="text-gray-400 ml-2">{plan.period}</span>
              </div>
            </div>
            
            <ul className="space-y-4 mb-8">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-center gap-3 text-gray-300">
                  <Check className="text-green-400 flex-shrink-0" size={20} />
                  {feature}
                </li>
              ))}
            </ul>
            
            <button
              onClick={() => handleUpgrade(plan.id)}
              disabled={plan.current || loading}
              className={`w-full py-3 rounded-xl font-semibold transition-colors ${
                plan.current
                  ? 'bg-green-600 text-white cursor-not-allowed'
                  : plan.popular
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-gray-700 hover:bg-gray-600 text-white'
              }`}
            >
              {plan.current ? 'Current Plan' : `Upgrade to ${plan.name}`}
            </button>
          </div>
        ))}
      </div>
      
      {/* Usage Overview */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-xl font-semibold text-white mb-4">Current Usage</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-white mb-1">
              {user.usage.videos}
            </p>
            <p className="text-gray-400 text-sm">Videos Generated</p>
          </div>
          
          <div className="text-center">
            <p className="text-2xl font-bold text-white mb-1">
              {user.usage.limit - user.usage.videos}
            </p>
            <p className="text-gray-400 text-sm">Remaining</p>
          </div>
          
          <div className="text-center">
            <p className="text-2xl font-bold text-white mb-1">
              {Math.round((user.usage.videos / user.usage.limit) * 100)}%
            </p>
            <p className="text-gray-400 text-sm">Used This Month</p>
          </div>
        </div>
        
        <div className="mt-6">
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>Monthly Usage</span>
            <span>{user.usage.videos} / {user.usage.limit}</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all"
              style={{ width: `${Math.min((user.usage.videos / user.usage.limit) * 100, 100)}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main App Component
const App = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [activeTab, setActiveTab] = useState('generate');
  const [videos, setVideos] = useState([
    // Demo data
    {
      id: '1',
      prompt: 'A futuristic city with flying cars at sunset',
      model: 'veo3',
      duration: 15,
      videoUrl: 'https://example.com/video1.mp4',
      thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400',
      createdAt: new Date().toISOString(),
      status: 'completed'
    }
  ]);
  
  const { user, loading, logout } = useAuth();
  
  const handleVideoGenerated = (newVideo) => {
    setVideos(prev => [newVideo, ...prev]);
    setActiveTab('library');
  };
  
  const handleDeleteVideo = (videoId) => {
    setVideos(prev => prev.filter(v => v.id !== videoId));
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="animate-spin text-blue-500" size={24} />
          <span className="text-white">Loading...</span>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900">
        {isLogin ? (
          <LoginForm onToggle={() => setIsLogin(false)} />
        ) : (
          <RegisterForm onToggle={() => setIsLogin(true)} />
        )}
      </div>
    );
  }
  
  const renderActiveTab = () => {
    switch (activeTab) {
      case 'generate':
        return <VideoGeneration user={user} onVideoGenerated={handleVideoGenerated} />;
      case 'library':
        return <ContentLibrary videos={videos} onDeleteVideo={handleDeleteVideo} />;
      case 'dashboard':
        return <Dashboard user={user} videos={videos} />;
      case 'billing':
        return <Billing user={user} />;
      default:
        return <VideoGeneration user={user} onVideoGenerated={handleVideoGenerated} />;
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-900">
      <Header 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        user={user} 
        onLogout={logout}
      />
      
      <main className="pb-8">
        {renderActiveTab()}
      </main>
    </div>
  );
};

// Root Component with Auth Provider
export default function InfluencoreApp() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}