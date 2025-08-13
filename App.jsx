// Enhanced Video Generator Component
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

        {error && (
          <Alert type="error" onClose={() => setError('')} className="mb-6">
            {error}
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                AI Model
              </label>
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
                        <div className={`p-2 rounded-lg bg-gradient-to-r ${m.gradient}`}>
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
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Video Prompt
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full h-32 px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none text-slate-900 placeholder-slate-400"
                placeholder="Describe the video you want to generate..."
                disabled={isGenerating}
                maxLength={500}
              />
              <div className="text-sm text-slate-500 mt-1">
                {prompt.length}/500 characters
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Duration
                </label>
                <select
                  value={options.duration}
                  onChange={(e) => setOptions({...options, duration: e.target.value})}
                  className="w-full px-3 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-900"
                  disabled={isGenerating}
                >
                  <option value="15">15 seconds</option>
                  <option value="30">30 seconds</option>
                  <option value="60">1 minute</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Quality
                </label>
                <select
                  value={options.quality}
                  onChange={(e) => setOptions({...options, quality: e.target.value})}
                  className="w-full px-3 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-900"
                  disabled={isGenerating}
                >
                  <option value="standard">Standard</option>
                  <option value="high">High</option>
                  <option value="premium">Premium</option>
                </select>
              </div>
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
                <p className="text-sm text-blue-700 font-medium">{status}</p>
              </div>
            )}

            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim() || !networkStatus}
              loading={isGenerating}
              icon={!isGenerating ? Sparkles : undefined}
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
                    <p className="text-xs opacity-50 mt-1">{generatedVideo.model.toUpperCase()}</p>
                  </div>
                  <button className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <Play className="w-16 h-16 text-white" />
                  </button>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-slate-900">{generatedVideo.title}</h4>
                  <p className="text-sm text-slate-600">
                    Duration: {options.duration}s • Quality: {options.quality} • Model: {generatedVideo.model}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = generatedVideo.videoUrl;
                      link.download = `${generatedVideo.title}.mp4`;
                      link.click();
                    }}
                    variant="primary"
                    icon={Download}
                    className="flex-1"
                  >
                    Download
                  </Button>
                  <Button 
                    variant="secondary"
                    icon={Share2}
                    className="flex-1"
                  >
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

// Enhanced Dashboard Component
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
            <span className="text-sm text-green-600 font-semibold">+12%</span>
          </div>
          <div>
            <div className="text-3xl font-bold text-slate-900">{stats.total}</div>
            <div className="text-sm text-slate-600 font-medium">Total Videos</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-purple-100 p-3 rounded-xl">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-sm text-green-600 font-semibold">+8%</span>
          </div>
          <div>
            <div className="text-3xl font-bold text-slate-900">{stats.views.toLocaleString()}</div>
            <div className="text-sm text-slate-600 font-medium">Total Views</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-green-100 p-3 rounded-xl">
              <Clock className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-sm text-green-600 font-semibold">+5</span>
          </div>
          <div>
            <div className="text-3xl font-bold text-slate-900">{stats.thisMonth}</div>
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
              {videos.map((video) => (
                <div key={video.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="bg-slate-100 w-16 h-12 rounded-lg flex items-center justify-center">
                      <Play className="w-5 h-5 text-slate-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{video.title}</h3>
                      <p className="text-sm text-slate-600">{video.duration} • {video.views} views</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2 text-slate-500 hover:text-blue-600 transition-colors">
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-slate-500 hover:text-green-600 transition-colors">
                      <Download className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-slate-500 hover:text-red-600 transition-colors">
                      <Trash2 className="w-4 h-4" />
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

// Enhanced Content Library
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
          <h1 className="text-4xl font-bold text-slate-900">Content Library</h1>
          <p className="text-slate-600 text-lg">Manage your AI-generated videos</p>
        </div>
        <Button icon={Plus} size="lg">
          Create Video
        </Button>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 mb-6">
        <div className="p-6 border-b border-slate-200">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search videos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-slate-900"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="pl-12 pr-8 py-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-slate-900"
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
                <div key={i} className="border border-slate-200 rounded-xl overflow-hidden animate-pulse">
                  <div className="bg-slate-200 aspect-video" />
                  <div className="p-4">
                    <div className="h-4 bg-slate-200 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-slate-200 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredVideos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVideos.map((video) => (
                <div key={video.id} className="group border border-slate-200 rounded-xl overflow-hidden hover:shadow-lg transition-all">
                  <div className="relative">
                    <div className="bg-slate-100 aspect-video flex items-center justify-center">
                      <Play className="w-12 h-12 text-slate-400 group-hover:text-blue-600 transition-colors" />
                    </div>
                    <div className="absolute top-3 right-3 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-lg">
                      {video.duration}
                    </div>
                    <div className="absolute top-3 left-3">
                      <span className={`text-xs px-2 py-1 rounded-lg font-medium ${
                        video.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {video.status}
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-slate-900 mb-2 truncate">{video.title}</h3>
                    <div className="flex items-center justify-between text-sm text-slate-600 mb-4">
                      <span className="capitalize font-medium">{video.model}</span>
                      <span>{video.views} views</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" className="flex-1" icon={Play}>
                        Play
                      </Button>
                      <button className="p-2 text-slate-500 hover:text-blue-600 border border-slate-300 rounded-lg transition-colors">
                        <Download className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-slate-500 hover:text-green-600 border border-slate-300 rounded-lg transition-colors">
                        <Share2 className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-slate-500 hover:text-red-600 border border-slate-300 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-slate-500">
              <Search className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No videos found matching your criteria</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Enhanced Settings Page
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
        <h1 className="text-4xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-600 text-lg">Manage your account and preferences</p>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="border-b border-slate-200">
          <nav className="flex">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 px-6 py-4 text-sm font-semibold border-b-2 flex items-center justify-center gap-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 bg-blue-50'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-8">
          {activeTab === 'profile' && (
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
                  />
                  <FormInput
                    label="Email Address"
                    type="email"
                    name="email"
                    value={user?.email || ''}
                    placeholder="Enter your email"
                    icon={Mail}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-slate-200">
                <Button>
                  Save Changes
                </Button>
                <Button
                  onClick={logout}
                  variant="danger"
                  icon={LogOut}
                >
                  Sign Out
                </Button>
              </div>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="space-y-8">
              <h3 className="text-xl font-bold text-slate-900">Preferences</h3>
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl">
                  <div>
                    <h4 className="font-semibold text-slate-900">Email Notifications</h4>
                    <p className="text-sm text-slate-600">Receive updates about your videos</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl">
                  <div>
                    <h4 className="font-semibold text-slate-900">Auto-save Projects</h4>
                    <p className="text-sm text-slate-600">Automatically save your work</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="space-y-8">
              <h3 className="text-xl font-bold text-slate-900">Billing Information</h3>
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-slate-900">Current Plan: Pro</h4>
                    <p className="text-sm text-slate-600">Unlimited video generation</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-slate-900">$29/month</div>
                    <div className="text-sm text-slate-600">Next billing: Feb 15</div>
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

// Enhanced Sidebar Navigation
const Sidebar = ({ isOpen, onClose, currentPage, onPageChange }) => {
  const navigation = [
    { id: 'dashboard', name: 'Dashboard', icon: BarChart3 },
    { id: 'generate', name: 'Generate Video', icon: Wand2 },
    { id: 'library', name: 'Content Library', icon: Folder },
    { id: 'settings', name: 'Settings', icon: Settings }
  ];

  const { user } = useAuth();

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
                <p className="text-xs text-slate-600">Pro Plan</p>
              </div>
            </div>
            <Button size="sm" className="w-full">
              Upgrade Plan
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

// Enhanced Header Component
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

// Main App Component
const App = () => {
  const [isAuthMode, setIsAuthMode] = useState('login');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const { isAuthenticated, isLoading, user } = useAuth();

  // Auto-initialize analytics and monitoring
  useEffect(() => {
    if (config.enableAnalytics) {
      console.log('Analytics initialized for', config.appName);
    }
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex">
      <NetworkStatus />
      
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

export default RootApp;import React, { useState, useEffect, createContext, useContext, useCallback, useRef } from 'react';
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

// Enhanced Configuration
const config = {
  apiBaseUrl: 'https://backend-9g44.onrender.com',
  apiTimeout: 30000,
  maxRetries: 3,
  appName: 'Influencore',
  appVersion: '2.0.0',
  enableAnalytics: true,
  enableDebug: false,
  environment: 'production'
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

// Enhanced API Client with Better Error Handling
class ApiClient {
  constructor() {
    this.isOnline = navigator.onLine;
    this.requestQueue = [];
    this.setupNetworkMonitoring();
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
    const url = `${config.apiBaseUrl}${endpoint}`;
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
  const [isLoading, setIsLoading] = useState(true);
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
      setIsLoading(false);
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

// Enhanced Login Form
const LoginForm = ({ onSwitchToRegister }) => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const { login, networkStatus } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Client-side validation
    const validationErrors = validateForm(formData, 'login');
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    if (!networkStatus) {
      setServerError('No internet connection. Please check your network and try again.');
      return;
    }

    setIsLoading(true);
    setErrors({});
    setServerError('');

    try {
      await login(formData.email, formData.password);
    } catch (err) {
      setServerError(err.message || 'Login failed. Please try again.');
      setTimeout(() => setServerError(''), 10000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clear errors on change
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
    if (serverError) setServerError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <NetworkStatus />
      
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-slate-200">
          {/* Brand Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl mb-4">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
              {config.appName}
            </h1>
            <p className="text-slate-600 mt-2 font-medium">Welcome back! Sign in to your account</p>
          </div>

          {/* Server Error Alert */}
          {serverError && (
            <Alert type="error" onClose={() => setServerError('')} className="mb-6">
              {serverError}
            </Alert>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
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
              autoComplete="email"
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
              autoComplete="current-password"
            />

            <Button
              type="submit"
              disabled={isLoading || !networkStatus}
              loading={isLoading}
              icon={!isLoading ? Zap : undefined}
              className="w-full"
              size="lg"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          {/* Switch to Register */}
          <div className="mt-8 text-center">
            <p className="text-slate-600">
              Don't have an account?{' '}
              <button
                onClick={onSwitchToRegister}
                className="text-blue-600 hover:text-blue-700 font-semibold transition-colors"
                disabled={isLoading}
              >
                Sign up for free
              </button>
            </p>
          </div>

          {/* Trust Indicators */}
          <div className="mt-6 pt-6 border-t border-slate-200">
            <div className="flex items-center justify-center gap-4 text-xs text-slate-500">
              <div className="flex items-center gap-1">
                <Shield className="w-3 h-3" />
                <span>Secure</span>
              </div>
              <div className="flex items-center gap-1">
                <Zap className="w-3 h-3" />
                <span>Fast</span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3" />
                <span>Trusted</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced Register Form
const RegisterForm = ({ onSwitchToLogin }) => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const { register, networkStatus } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Client-side validation
    const validationErrors = validateForm(formData, 'register');
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    if (!networkStatus) {
      setServerError('No internet connection. Please check your network and try again.');
      return;
    }

    setIsLoading(true);
    setErrors({});
    setServerError('');

    try {
      await register(formData.name, formData.email, formData.password);
    } catch (err) {
      setServerError(err.message || 'Registration failed. Please try again.');
      setTimeout(() => setServerError(''), 10000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clear errors on change
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
    if (serverError) setServerError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <NetworkStatus />
      
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-slate-200">
          {/* Brand Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl mb-4">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
              {config.appName}
            </h1>
            <p className="text-slate-600 mt-2 font-medium">Create your account and start generating videos</p>
          </div>

          {/* Server Error Alert */}
          {serverError && (
            <Alert type="error" onClose={() => setServerError('')} className="mb-6">
              {serverError}
            </Alert>
          )}

          {/* Register Form */}
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
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
              autoComplete="name"
            />

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
              autoComplete="email"
            />

            <FormInput
              label="Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Create a strong password"
              required
              disabled={isLoading}
              icon={Lock}
              showPasswordToggle
              error={errors.password}
              autoComplete="new-password"
            />

            <Button
              type="submit"
              disabled={isLoading || !networkStatus}
              loading={isLoading}
              icon={!isLoading ? UserPlus : undefined}
              className="w-full"
              size="lg"
            >
              {isLoading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>

          {/* Switch to Login */}
          <div className="mt-8 text-center">
            <p className="text-slate-600">
              Already have an account?{' '}
              <button
                onClick={onSwitchToLogin}
                className="text-blue-600 hover:text-blue-700 font-semibold transition-colors"
                disabled={isLoading}
              >
                Sign in
              </button>
            </p>
          </div>

          {/* Terms */}
          <div className="mt-6 pt-6 border-t border-slate-200 text-center">
            <p className="text-xs text-slate-500">
              By creating an account, you agree to our{' '}
              <a href="#" className="text-blue-600 hover:text-blue-700">Terms of Service</a>
              {' '}and{' '}
              <a href="#" className="text-blue-600 hover:text-blue-700">Privacy Policy</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced Video Generator Component
const VideoGenerator = () => {
  const [model, setModel] = useState('veo3');
  const [prompt, setPrompt] = useState('');
  const [options, setOptions] = useState({
    duration
