import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import axiosInstance from '../../utils/axios';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Plus, Send, X, Users, BookOpen, Loader2, Bot, AlertCircle } from 'lucide-react';

export default function Discussions() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const chatEndRef = useRef(null);

  const [activeGroupId, setActiveGroupId] = useState('');
  const [createModal, setCreateModal] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: '', description: '', departmentId: '', courseId: '' });
  const [typedMessage, setTypedMessage] = useState('');

  // Fetch departments & courses for the creator modal
  const { data: depts } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const res = await axiosInstance.get('/courses/departments');
      return res.data.data;
    }
  });

  const { data: courses } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const res = await axiosInstance.get('/courses');
      return res.data.data;
    }
  });

  // Fetch groups eligible for this user
  const { data: groups, isLoading: groupsLoading } = useQuery({
    queryKey: ['discussionGroups'],
    queryFn: async () => {
      const res = await axiosInstance.get('/discussions');
      return res.data.data;
    }
  });

  // Automatically select first group on load
  useEffect(() => {
    if (groups && groups.length > 0 && !activeGroupId) {
      setActiveGroupId(groups[0].id);
    }
  }, [groups, activeGroupId]);

  // Fetch messages inside selected group. Poll every 3 seconds for real-time chat simulation.
  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ['discussionMessages', activeGroupId],
    enabled: !!activeGroupId,
    refetchInterval: 3000, // Poll database every 3 seconds for new chat entries
    queryFn: async () => {
      const res = await axiosInstance.get(`/discussions/${activeGroupId}/messages`);
      return res.data.data;
    }
  });

  // Scroll to bottom when messages list updates
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Mutations
  const createGroupMutation = useMutation({
    mutationFn: (data) => axiosInstance.post('/discussions', data),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['discussionGroups']);
      setCreateModal(false);
      setNewGroup({ name: '', description: '', departmentId: '', courseId: '' });
      setActiveGroupId(res.data.data.id);
    }
  });

  const sendMessageMutation = useMutation({
    mutationFn: (content) => axiosInstance.post(`/discussions/${activeGroupId}/messages`, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries(['discussionMessages', activeGroupId]);
      setTypedMessage('');
    }
  });

  const activeGroup = groups?.find(g => g.id === activeGroupId);

  const handleCreateGroup = (e) => {
    e.preventDefault();
    if (!newGroup.name.trim()) return;
    createGroupMutation.mutate(newGroup);
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!typedMessage.trim() || !activeGroupId) return;
    
    // Optimistic Update UI local feed immediately
    const tempMessage = {
      id: Math.random().toString(),
      content: typedMessage.trim(),
      createdAt: new Date().toISOString(),
      sender: {
        id: user.id,
        name: user.profile?.name || 'Me',
        role: user.role,
        avatar: user.profile?.profilePhoto || ''
      }
    };
    queryClient.setQueryData(['discussionMessages', activeGroupId], (prev) => [...(prev || []), tempMessage]);
    
    sendMessageMutation.mutate(typedMessage.trim());
    setTypedMessage('');
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-500/10 text-red-400 border border-red-500/20';
      case 'TEACHER': return 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20';
      case 'PARENT': return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      default: return 'bg-brand-500/10 text-brand-400 border border-brand-500/20';
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-6 overflow-hidden">
      
      {/* 1. Left List of Groups */}
      <div className="w-80 glass-panel rounded-2xl flex flex-col overflow-hidden border border-slate-200/50 dark:border-slate-800/40">
        <div className="p-4 border-b border-slate-200/50 dark:border-slate-800/40 flex items-center justify-between">
          <h2 className="font-display font-bold text-base flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-brand-500" />
            <span>Discussion Rooms</span>
          </h2>
          {['TEACHER', 'ADMIN'].includes(user.role) && (
            <button
              onClick={() => setCreateModal(true)}
              className="p-1.5 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-all"
            >
              <Plus className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Groups scrollable lists */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {groupsLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-brand-500" />
            </div>
          ) : groups?.length > 0 ? (
            groups.map(g => {
              const isSelected = g.id === activeGroupId;
              return (
                <div
                  key={g.id}
                  onClick={() => {
                    setActiveGroupId(g.id);
                    setTypedMessage('');
                  }}
                  className={`p-3 rounded-xl cursor-pointer transition-all flex items-start gap-3 ${
                    isSelected
                      ? 'bg-brand-500/15 border border-brand-500/30'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-900/60 border border-transparent'
                  }`}
                >
                  <div className="p-2 bg-brand-500/10 text-brand-500 rounded-lg">
                    <Users className="h-4.5 w-4.5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-xs truncate">{g.name}</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">{g.description || 'No description.'}</p>
                    {g.course && (
                      <span className="text-[8px] mt-1.5 inline-block px-1.5 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-full font-bold">
                        {g.course.code}
                      </span>
                    )}
                    {g.department && (
                      <span className="text-[8px] mt-1.5 inline-block px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full font-bold ml-1">
                        {g.department.code}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-center py-10 text-xs text-slate-500">No rooms active.</p>
          )}
        </div>
      </div>

      {/* 2. Right Chat Feed */}
      <div className="flex-1 glass-card p-0 flex flex-col overflow-hidden border-glow">
        {activeGroup ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header info */}
            <div className="p-4 border-b border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">{activeGroup.name}</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">{activeGroup.description || 'Discussion board.'}</p>
              </div>
              <div className="flex items-center gap-1.5 text-[9px] text-brand-400 font-bold bg-brand-500/10 px-2 py-0.5 rounded-full border border-brand-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-500 animate-ping"></span>
                <span>LIVE SYNCING</span>
              </div>
            </div>

            {/* Messages feed */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-900/10 dark:bg-slate-950/20">
              {messagesLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
                </div>
              ) : messages?.length > 0 ? (
                messages.map(msg => {
                  const isMe = msg.sender.id === user.id;
                  return (
                    <div key={msg.id} className={`flex gap-3 max-w-[80%] ${isMe ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}>
                      <img
                        src={msg.sender.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${msg.sender.email}`}
                        alt="Avatar"
                        className="h-8 w-8 rounded-lg bg-brand-100 border border-brand-500/20"
                      />
                      <div className="space-y-1 text-left">
                        <div className={`flex items-center gap-1.5 ${isMe ? 'justify-end' : ''}`}>
                          <span className="font-bold text-[11px]">{msg.sender.name}</span>
                          <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold uppercase ${getRoleBadge(msg.sender.role)}`}>
                            {msg.sender.role}
                          </span>
                          <span className="text-[8px] text-slate-500">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className={`p-3 rounded-2xl text-xs leading-relaxed ${
                          isMe
                            ? 'bg-brand-500 text-white rounded-tr-none shadow-md shadow-brand-500/10'
                            : 'bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-tl-none shadow-sm'
                        }`}>
                          <p>{msg.content}</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-20 text-slate-500 text-xs italic">
                  Be the first to post a doubt or ask a question!
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Send form */}
            <form onSubmit={handleSend} className="p-3 border-t border-slate-200/50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-950/20 flex items-center gap-2">
              <input
                type="text"
                value={typedMessage}
                onChange={(e) => setTypedMessage(e.target.value)}
                placeholder="Type a doubt or clarify questions..."
                className="flex-1 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 outline-none text-xs"
              />
              <button
                type="submit"
                disabled={!typedMessage.trim() || sendMessageMutation.isLoading}
                className="p-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl transition-all disabled:opacity-50"
              >
                <Send className="h-4.5 w-4.5" />
              </button>
            </form>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500">
            <MessageSquare className="h-12 w-12 mb-3 text-slate-400" />
            <p className="text-sm font-semibold">No active room selected</p>
            <p className="text-xs text-slate-400">Choose a discussion group from the panel on the left to start chatting.</p>
          </div>
        )}
      </div>

      {/* 3. Create Group Modal */}
      {createModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-sm glass-panel rounded-2xl border border-white/20 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-brand-500" /> Create doubt Group
              </h3>
              <button onClick={() => setCreateModal(false)} className="p-1 hover:bg-slate-800 rounded-lg"><X className="h-5 w-5" /></button>
            </div>
            
            <form onSubmit={handleCreateGroup} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Group Name</label>
                <input
                  type="text"
                  value={newGroup.name}
                  onChange={(e) => setNewGroup(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="DBMS Exam Doubt Q&A"
                  required
                  className="glass-input text-xs py-2"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Description</label>
                <input
                  type="text"
                  value={newGroup.description}
                  onChange={(e) => setNewGroup(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Post DBMS questions and assignments here."
                  className="glass-input text-xs py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Link Department</label>
                  <select
                    value={newGroup.departmentId}
                    onChange={(e) => setNewGroup(prev => ({ ...prev, departmentId: e.target.value }))}
                    className="glass-input text-xs py-2"
                  >
                    <option value="">No Department Link</option>
                    {depts?.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Link Course</label>
                  <select
                    value={newGroup.courseId}
                    onChange={(e) => setNewGroup(prev => ({ ...prev, courseId: e.target.value }))}
                    className="glass-input text-xs py-2"
                  >
                    <option value="">No Course Link</option>
                    {courses?.map(c => (
                      <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={createGroupMutation.isLoading || !newGroup.name.trim()}
                className="w-full btn-primary text-xs py-2.5 flex items-center justify-center gap-1.5"
              >
                {createGroupMutation.isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>Add Discussion Room</span>
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
