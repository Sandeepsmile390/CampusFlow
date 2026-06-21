import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from '../Logo';
import NotificationPanel from '../NotificationPanel';

import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  ClipboardCheck,
  FileSpreadsheet,
  Megaphone,
  Briefcase,
  DollarSign,
  Bot,
  LogOut,
  Sun,
  Moon,
  Menu,
  X,
  Search,
  Bell,
  Send,
  Loader2,
  QrCode,
  Sparkles,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import axiosInstance from '../../utils/axios';
import { useNotificationStore } from '../../store/notificationStore';


export default function DashboardLayout({ children }) {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { fetchNotifications } = useNotificationStore();

  
  // AI assistant states
  const [messages, setMessages] = useState([
    { sender: 'ai', text: `Hello ${user?.profile?.name || 'there'}! I am your CampusFlow AI Assistant. Ask me details about attendance, CGPA metrics, exam schedules, or request course summaries.` }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, aiLoading]);

  // Handle Ctrl+K shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Auto-close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Fetch notifications on mount + poll every 60 s
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);


  const handleLogout = async () => {
    try {
      await axiosInstance.post('/auth/logout');
    } catch (err) {
      console.error(err);
    }
    logout();
    navigate('/login');
  };

  const getNavigationLinks = () => {
    const role = user?.role;
    if (role === 'ADMIN') {
      return [
        { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
        { name: 'Students', path: '/admin/students', icon: Users },
        { name: 'Teachers', path: '/admin/teachers', icon: GraduationCap },
        { name: 'Courses', path: '/admin/courses', icon: BookOpen },
        { name: 'Discussions', path: '/admin/discussions', icon: MessageSquare },
        { name: 'Notice Board', path: '/admin/notices', icon: Megaphone },
        { name: 'Reports', path: '/admin/reports', icon: FileSpreadsheet },
      ];
    }
    if (role === 'TEACHER') {
      return [
        { name: 'Dashboard', path: '/teacher/dashboard', icon: LayoutDashboard },
        { name: 'Manual Attendance', path: '/teacher/attendance', icon: ClipboardCheck },
        { name: 'QR Attendance', path: '/teacher/qr', icon: QrCode },
        { name: 'Assignments', path: '/teacher/assignments', icon: BookOpen },
        { name: 'Marks & Results', path: '/teacher/marks', icon: FileSpreadsheet },
        { name: 'Discussions', path: '/teacher/discussions', icon: MessageSquare },
        { name: 'Announcements', path: '/teacher/notices', icon: Megaphone },
      ];
    }
    if (role === 'STUDENT') {
      return [
        { name: 'Dashboard', path: '/student/dashboard', icon: LayoutDashboard },
        { name: 'Timetable', path: '/student/timetable', icon: Calendar },
        { name: 'Attendance', path: '/student/attendance', icon: ClipboardCheck },
        { name: 'Assignments', path: '/student/assignments', icon: BookOpen },
        { name: 'Fees & Invoices', path: '/student/fees', icon: DollarSign },
        { name: 'Placements', path: '/student/placements', icon: Briefcase },
        { name: 'Discussions', path: '/student/discussions', icon: MessageSquare },
        { name: 'Announcements', path: '/student/notices', icon: Megaphone },
      ];
    }
    if (role === 'PARENT') {
      return [
        { name: 'Dashboard', path: '/parent/dashboard', icon: LayoutDashboard },
        { name: 'Discussions', path: '/parent/discussions', icon: MessageSquare },
        { name: 'Notice Board', path: '/parent/notices', icon: Megaphone },
      ];
    }
    return [];
  };

  const menuItems = getNavigationLinks();

  const handleSendAiMessage = async (textToSend) => {
    const userText = textToSend || inputMessage;
    if (!userText.trim()) return;

    setMessages(prev => [...prev, { sender: 'user', text: userText }]);
    if (!textToSend) setInputMessage('');
    setAiLoading(true);

    try {
      const res = await axiosInstance.post('/ai/chat', { message: userText });
      setMessages(prev => [...prev, { sender: 'ai', text: res.data.data.response }]);
    } catch (err) {
      setMessages(prev => [...prev, { sender: 'ai', text: 'Sorry, I am facing trouble connecting right now. Please try again.' }]);
    } finally {
      setAiLoading(false);
    }
  };

  // Preset prompts for AI Chat
  const presetQuestions = [
    'Show my attendance',
    'What is my GPA?',
    'Upcoming exams',
    'Assignment deadlines',
    'Predict my performance'
  ];

  // Simulated global search matching paths/items
  const handleSearch = (query) => {
    setSearchQuery(query);
    if (!query) {
      setSearchResults([]);
      return;
    }
    const searchable = [
      { title: 'DBMS Course details', path: '/student/timetable', category: 'Academics' },
      { title: 'Submit Operating Systems Assignment 1', path: '/student/assignments', category: 'Tasks' },
      { title: 'Google Recruitment Placement portal', path: '/student/placements', category: 'Placements' },
      { title: 'Mark Attendance via Webcam', path: '/student/attendance', category: 'Attendance' },
      { title: 'Fee Invoices', path: '/student/fees', category: 'Finance' },
      { title: 'End Semester Exams Notice', path: '/admin/notices', category: 'Announcements' }
    ];
    setSearchResults(
      searchable.filter(item => item.title.toLowerCase().includes(query.toLowerCase()))
    );
  };

  // Breadcrumbs calculation
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const breadcrumbItems = pathSegments.map((segment, index) => {
    const url = `/${pathSegments.slice(0, index + 1).join('/')}`;
    const name = segment.charAt(0).toUpperCase() + segment.slice(1);
    return { name, url };
  });

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F8FAFC] dark:bg-[#020617] text-[#0F172A] dark:text-[#F8FAFC] transition-colors duration-300">
      
      {/* 1. Desktop Sidebar */}
      <motion.aside
        animate={{ width: sidebarCollapsed ? 88 : 280 }}
        transition={{ type: 'spring', stiffness: 220, damping: 26 }}
        className="hidden md:flex flex-col bg-[#0F172A] text-slate-300 shrink-0 select-none relative z-40"
      >
        {/* Brand */}
        <div className={`flex items-center py-6 ${sidebarCollapsed ? 'justify-center px-0' : 'justify-between pl-6 pr-4'}`}>
          <Link to="/">
            <Logo size="md" iconOnly={sidebarCollapsed} className="text-white" />
          </Link>
          {!sidebarCollapsed && (
            <button
              onClick={() => setSidebarCollapsed(true)}
              className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Collapsed expand button indicator */}
        {sidebarCollapsed && (
          <div className="flex justify-center mb-6">
            <button
              onClick={() => setSidebarCollapsed(false)}
              className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 space-y-1.5 px-2 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 py-3.5 rounded-xl font-medium transition-all duration-300 relative group overflow-hidden ${
                  sidebarCollapsed ? 'justify-center px-0' : 'px-4'
                } ${
                  isActive
                    ? 'bg-white/10 text-white border-l-4 border-l-brand-teal'
                    : 'text-slate-400 hover:text-white hover:bg-gradient-to-r hover:from-white/5 hover:to-transparent'
                }`}
              >
                <Icon className={`h-5 w-5 shrink-0 transition-transform duration-300 group-hover:scale-110`} />
                {!sidebarCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="truncate text-sm"
                  >
                    {item.name}
                  </motion.span>
                )}
                {/* Collapsed Tooltip */}
                {sidebarCollapsed && (
                  <div className="absolute left-20 scale-0 group-hover:scale-100 transition-all duration-200 bg-[#0F172A] text-white text-xs rounded py-1.5 px-3 border border-slate-700 pointer-events-none shadow-xl z-50 whitespace-nowrap">
                    {item.name}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Info & Settings Footer */}
        <div className="px-2 pb-6 pt-4 border-t border-slate-800/80 space-y-3">
          {/* Theme Toggler */}
          <button
            onClick={toggleTheme}
            className={`flex items-center gap-3 w-full py-2.5 text-xs font-semibold rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all ${
              sidebarCollapsed ? 'justify-center px-0' : 'pl-4 pr-2'
            }`}
          >
            {theme === 'dark' ? <Sun className="h-5 w-5 shrink-0 text-amber-400" /> : <Moon className="h-5 w-5 shrink-0 text-sky-400" />}
            {!sidebarCollapsed && <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>

          {/* User Profile info */}
          <div className={`flex items-center gap-3 bg-white/5 rounded-xl border border-white/5 transition-all ${
            sidebarCollapsed ? 'justify-center p-2' : 'pl-4 pr-2 py-2'
          }`}>
            <img
              src={user?.profile?.profilePhoto || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user?.email}`}
              alt="Avatar"
              className="h-9 w-9 rounded-lg bg-brand-50/10 border border-brand-teal/20"
            />
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate">{user?.profile?.name || 'Administrator'}</p>
                <p className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">{user?.role}</p>
              </div>
            )}
            {!sidebarCollapsed && (
              <button
                onClick={handleLogout}
                className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg transition-colors hover:bg-red-500/10"
              >
                <LogOut className="h-4 w-4" />
              </button>
            )}
          </div>
          {sidebarCollapsed && (
            <button
              onClick={handleLogout}
              className="flex items-center justify-center w-full py-2 hover:bg-red-500/10 rounded-xl text-slate-400 hover:text-red-400 transition-colors"
            >
              <LogOut className="h-5 w-5" />
            </button>
          )}
        </div>
      </motion.aside>

      {/* 2. Mobile Top Header */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-[#0F172A] text-white sticky top-0 z-40 border-b border-white/5">
        <Link to="/">
          <Logo size="sm" className="text-white" />
        </Link>
        <div className="flex items-center gap-1">
          <button onClick={toggleTheme} className="p-2 rounded-xl hover:bg-white/10">
            {theme === 'dark' ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5 text-sky-400" />}
          </button>
          <button onClick={() => setAiDrawerOpen(true)} className="p-2 rounded-xl bg-brand-teal/10 text-brand-teal hover:bg-brand-teal/20">
            <Bot className="h-5 w-5" />
          </button>
          {/* Notification bell on mobile */}
          <NotificationPanel />
          <button onClick={handleLogout} className="p-2 rounded-xl text-red-400 hover:bg-red-500/10">
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>


      {/* 3. Main Dashboard Workspace Content Area */}
      <main className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        {/* Desktop Top Navbar */}
        <header className="hidden md:flex items-center justify-between px-8 py-4 glass-panel border-b border-[#E2E8F0] dark:border-white/5 sticky top-0 z-30">
          
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span className="cursor-pointer hover:text-[#4338CA] dark:hover:text-[#14B8A6]" onClick={() => navigate('/')}>
              CampusFlow
            </span>
            {breadcrumbItems.map((item, i) => (
              <React.Fragment key={i}>
                <span className="text-slate-300">/</span>
                <span
                  onClick={() => navigate(item.url)}
                  className={`cursor-pointer hover:text-[#4338CA] dark:hover:text-[#14B8A6] ${
                    i === breadcrumbItems.length - 1 ? 'text-[#0F172A] dark:text-[#F8FAFC]' : ''
                  }`}
                >
                  {item.name}
                </span>
              </React.Fragment>
            ))}
          </div>

          <div className="flex items-center gap-6">
            {/* Search Launcher */}
            <div className="w-80">
              <div
                onClick={() => setSearchOpen(true)}
                className="flex items-center gap-3 px-4 py-2 rounded-xl cursor-pointer bg-slate-100/50 dark:bg-slate-900/30 border border-slate-200/50 dark:border-slate-800/50 text-slate-400 text-xs transition-all hover:border-[#4338CA] dark:hover:border-[#14B8A6]"
              >
                <Search className="h-4 w-4 shrink-0" />
                <span>Search database... (Ctrl + K)</span>
              </div>
            </div>

            {/* AI Assistant Quick Toggle */}
            <button
              onClick={() => setAiDrawerOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-campus-gradient text-white font-medium text-xs shadow-lg shadow-brand-indigo/10 hover:shadow-brand-indigo/25 hover:scale-[1.02] transition-all"
            >
              <Bot className="h-4 w-4" />
              <span>AI Chat Panel</span>
            </button>

            {/* Notification bell — self-contained (button + dropdown) */}
            <NotificationPanel />


          </div>
        </header>

        {/* Page Inner Container */}
        <div className="flex-1 p-4 md:p-8 overflow-y-auto">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Bar Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0F172A] text-slate-400 border-t border-white/5 px-4 py-2 flex items-center justify-around z-40">
        {menuItems.length <= 5 ? (
          menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                  isActive ? 'text-[#14B8A6] font-semibold' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[9px]">{item.name}</span>
              </Link>
            );
          })
        ) : (
          <>
            {menuItems.slice(0, 4).map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                    isActive ? 'text-[#14B8A6] font-semibold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-[9px]">{item.name}</span>
                </Link>
              );
            })}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="flex flex-col items-center gap-1 p-2 rounded-xl text-slate-400 hover:text-white transition-all"
            >
              <Menu className="h-5 w-5" />
              <span className="text-[9px]">More</span>
            </button>
          </>
        )}
      </nav>

      {/* 4. Glassmorphic Search Command Bar Modal (Ctrl + K) */}
      <AnimatePresence>
        {searchOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg glass-card p-6 space-y-4 border border-white/20 dark:border-slate-800 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-200/30 dark:border-slate-800/30 pb-3">
                <div className="flex items-center gap-3 w-full">
                  <Search className="h-5 w-5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="Search database courses, assignments, schedules..."
                    className="w-full bg-transparent outline-none border-none text-slate-800 dark:text-white placeholder-slate-400"
                    autoFocus
                  />
                </div>
                <button onClick={() => setSearchOpen(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-900/60 rounded-lg">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Results */}
              <div className="max-h-60 overflow-y-auto space-y-2">
                {searchResults.length > 0 ? (
                  searchResults.map((res, i) => (
                    <div
                      key={i}
                      onClick={() => {
                        navigate(res.path);
                        setSearchOpen(false);
                      }}
                      className="p-3 hover:bg-brand-indigo/10 rounded-xl cursor-pointer flex items-center justify-between transition-all"
                    >
                      <div>
                        <p className="text-sm font-semibold">{res.title}</p>
                        <span className="text-[10px] text-brand-teal font-semibold">{res.category}</span>
                      </div>
                      <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-500">Navigate</span>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-xs text-slate-400 py-6 font-medium">
                    {searchQuery ? 'No match found.' : 'Type to search the portal databases...'}
                  </p>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. Glassmorphic Slide-Out AI Assistant Drawer */}
      <AnimatePresence>
        {aiDrawerOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setAiDrawerOpen(false)} />
            
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative w-full max-w-md h-full flex flex-col z-10 overflow-hidden"
            >
              {/* Premium Gradient Mesh Background inside drawer */}
              <div className="absolute inset-0 bg-gradient-to-b from-[#0F172A]/90 to-[#020617]/95 backdrop-blur-2xl -z-10" />
              <div className="absolute top-0 right-0 w-80 h-80 bg-[#14B8A6]/10 rounded-full blur-[100px] pointer-events-none -z-10" />
              <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#4338CA]/10 rounded-full blur-[100px] pointer-events-none -z-10" />

              {/* Header */}
              <div className="p-6 border-b border-white/5 flex items-center justify-between text-white">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-campus-gradient text-white shadow-lg shadow-brand-indigo/25">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-lg text-white">CampusFlow AI</h3>
                    <p className="text-[9px] text-[#14B8A6] font-bold tracking-widest uppercase">ERM ASSISTANT ENGINE</p>
                  </div>
                </div>
                <button onClick={() => setAiDrawerOpen(false)} className="p-2 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl transition-all">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Chat messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3.5 text-sm leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-campus-gradient text-white rounded-br-none shadow-md shadow-brand-indigo/10'
                          : 'bg-[#1e293b]/70 border border-slate-700/50 rounded-bl-none text-slate-200'
                      }`}
                    >
                      <p className="whitespace-pre-line">{msg.text}</p>
                    </div>
                  </div>
                ))}

                {aiLoading && (
                  <div className="flex justify-start">
                    <div className="bg-[#1e293b]/70 border border-slate-700/50 rounded-2xl rounded-bl-none px-4 py-3 flex items-center gap-2 text-slate-400">
                      <Loader2 className="h-4 w-4 animate-spin text-[#14B8A6]" />
                      <span className="text-xs font-semibold">AI Assistant is compiling response...</span>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Suggestion Chips */}
              <div className="p-4 bg-slate-900/40 border-t border-white/5 space-y-2">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider px-1">Suggested Questions</p>
                <div className="flex flex-wrap gap-2">
                  {presetQuestions.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendAiMessage(q)}
                      className="text-xs px-3 py-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/30 transition-all"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              {/* Form Input */}
              <form onSubmit={(e) => { e.preventDefault(); handleSendAiMessage(); }} className="p-4 border-t border-white/5 bg-[#0f172a]/50">
                <div className="flex items-center gap-2 p-1.5 bg-[#1e293b]/90 border border-slate-700/60 rounded-2xl shadow-inner">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Ask attendance status, CGPA, next exams..."
                    className="flex-1 bg-transparent px-3 py-2 outline-none text-sm text-slate-200 placeholder-slate-500"
                  />
                  <button type="submit" className="p-2.5 bg-campus-gradient text-white rounded-xl hover:scale-[1.05] transition-all">
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. Mobile Bottom Sheet Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end bg-slate-950/60 backdrop-blur-sm">
          {/* Click outside to close */}
          <div className="absolute inset-0" onClick={() => setMobileMenuOpen(false)} />
          
          <div className="relative w-full glass-panel rounded-t-3xl border-t border-white/20 dark:border-slate-800 shadow-2xl p-6 space-y-6 max-h-[80vh] overflow-y-auto animate-in fade-in slide-in-from-bottom duration-300">
            {/* Drag indicator line */}
            <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto" onClick={() => setMobileMenuOpen(false)} />
            
            <div className="flex items-center justify-between border-b border-slate-200/30 dark:border-slate-800/30 pb-3">
              <h3 className="font-bold text-base">Navigation Menu</h3>
              <button onClick={() => setMobileMenuOpen(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"><X className="h-5 w-5" /></button>
            </div>

            <div className="grid grid-cols-3 gap-4 pb-8">
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-2xl cursor-pointer transition-all border ${
                      isActive
                        ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-650 dark:text-indigo-400'
                        : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200/50 dark:border-slate-800/50 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Icon className="h-6 w-6" />
                    <span className="text-[10px] text-center font-semibold truncate w-full">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
