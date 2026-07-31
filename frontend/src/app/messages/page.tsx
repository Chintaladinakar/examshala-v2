'use client';

import React, { useEffect, useRef, useState } from 'react';
import DashboardSidebar from '@/components/DashboardSidebar';
import { useToast } from '@/components/ui/ToastProvider';
import { useUser } from '@/context/UserContext';
import { MessageSquare, Send, Plus, RefreshCw, Search, X, User2 } from 'lucide-react';

type Contact = { id: string; name: string; role: string; email: string };
type ConversationSummary = {
  conversationId: string;
  otherUser: { id: string; name: string; role: string } | null;
  lastMessage: { body: string; createdAt: string } | null;
  lastMessageAt: string;
  unreadCount: number;
};
type Message = { id: string; body: string; createdAt: string; Sender: { id: string; name: string } };

async function apiJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
  });
  const body = (await res.json().catch(() => null)) as any;
  if (!res.ok || !body?.success) {
    throw new Error(body?.error?.message || body?.message || 'Request failed');
  }
  return body.data as T;
}

export default function MessagesPage() {
  const { showError } = useToast();
  const { user } = useUser();

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [loadingConvos, setLoadingConvos] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactSearch, setContactSearch] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  async function loadConversations() {
    try {
      setLoadingConvos(true);
      const data = await apiJson<ConversationSummary[]>('/api/messages/conversations');
      setConversations(data);
    } catch (e) {
      showError(e);
    } finally {
      setLoadingConvos(false);
    }
  }

  async function loadMessages(id: string) {
    try {
      setLoadingMessages(true);
      const data = await apiJson<Message[]>(`/api/messages/conversations/${id}`);
      setMessages(data);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    } catch (e) {
      showError(e);
    } finally {
      setLoadingMessages(false);
    }
  }

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (activeId) loadMessages(activeId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  async function openNewConversation() {
    try {
      const data = await apiJson<Contact[]>('/api/messages/contacts');
      setContacts(data);
      setShowNew(true);
    } catch (e) {
      showError(e);
    }
  }

  async function startConversation(recipientUserId: string) {
    try {
      const data = await apiJson<{ conversationId: string }>('/api/messages/conversations', {
        method: 'POST',
        body: JSON.stringify({ recipientUserId }),
      });
      setShowNew(false);
      await loadConversations();
      setActiveId(data.conversationId);
    } catch (e) {
      showError(e);
    }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!activeId || !draft.trim()) return;
    const body = draft.trim();
    setDraft('');
    try {
      await apiJson(`/api/messages/conversations/${activeId}`, { method: 'POST', body: JSON.stringify({ body }) });
      await loadMessages(activeId);
      await loadConversations();
    } catch (e) {
      showError(e);
    }
  }

  const filteredContacts = contacts.filter((c) => c.name.toLowerCase().includes(contactSearch.toLowerCase()));
  const activeConversation = conversations.find((c) => c.conversationId === activeId);

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50">
      <DashboardSidebar />
      <main className="flex-1 min-w-0 p-6 md:p-8 overflow-hidden">
        <div className="max-w-7xl mx-auto h-full flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b mb-4">
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <MessageSquare className="w-8 h-8 text-teal-850" />
              Messages
            </h1>
            <div className="flex items-center gap-2">
              <button onClick={loadConversations} className="flex items-center gap-1.5 px-4 py-2 bg-white border hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl shadow-xs">
                <RefreshCw className="w-3.5 h-3.5" /> Refresh
              </button>
              <button onClick={openNewConversation} className="flex items-center gap-1.5 px-4 py-2 bg-teal-900 hover:bg-teal-800 text-white font-bold text-xs rounded-xl shadow-xs">
                <Plus className="w-3.5 h-3.5" /> New Message
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1 bg-white border rounded-3xl shadow-xs overflow-y-auto">
              {loadingConvos ? (
                <div className="py-16 text-center text-xs font-bold text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin text-teal-800 mx-auto mb-2" />
                  Loading...
                </div>
              ) : conversations.length === 0 ? (
                <div className="py-16 text-center text-xs font-extrabold text-slate-500">No conversations yet</div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {conversations.map((c) => (
                    <button
                      key={c.conversationId}
                      onClick={() => setActiveId(c.conversationId)}
                      className={`w-full text-left p-4 hover:bg-slate-50 transition-colors ${activeId === c.conversationId ? 'bg-teal-50/60' : ''}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-sm text-slate-800">{c.otherUser?.name || 'Unknown'}</span>
                        {c.unreadCount > 0 && (
                          <span className="w-5 h-5 flex items-center justify-center rounded-full bg-rose-500 text-white text-[9px] font-black">
                            {c.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">{c.otherUser?.role}</p>
                      {c.lastMessage && (
                        <p className="text-xs text-slate-500 mt-1 truncate">{c.lastMessage.body}</p>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="md:col-span-2 bg-white border rounded-3xl shadow-xs flex flex-col min-h-0">
              {!activeId ? (
                <div className="flex-1 flex items-center justify-center text-xs font-extrabold text-slate-400">
                  Select a conversation to start messaging
                </div>
              ) : (
                <>
                  <div className="p-4 border-b flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-800">
                      <User2 className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-extrabold text-sm text-slate-800">{activeConversation?.otherUser?.name}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">{activeConversation?.otherUser?.role}</p>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {loadingMessages ? (
                      <div className="text-center text-xs font-bold text-slate-400 py-8">Loading messages...</div>
                    ) : (
                      messages.map((m) => {
                        const isMine = m.Sender.id === user?.id;
                        return (
                          <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[70%] px-3.5 py-2 rounded-2xl text-xs ${isMine ? 'bg-teal-900 text-white' : 'bg-slate-100 text-slate-800'}`}>
                              <p>{m.body}</p>
                              <p className={`text-[9px] mt-1 ${isMine ? 'text-teal-200' : 'text-slate-400'}`}>
                                {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={bottomRef} />
                  </div>
                  <form onSubmit={sendMessage} className="p-4 border-t flex items-center gap-2">
                    <input
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 px-3.5 py-2.5 border rounded-xl text-sm focus:outline-none"
                    />
                    <button type="submit" disabled={!draft.trim()} className="p-2.5 bg-teal-900 hover:bg-teal-800 text-white rounded-xl disabled:opacity-50">
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      {showNew && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-800">New Message</h3>
              <button onClick={() => setShowNew(false)} className="p-1.5 hover:bg-slate-100 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={contactSearch}
                onChange={(e) => setContactSearch(e.target.value)}
                placeholder="Search contacts..."
                className="w-full pl-9 pr-3 py-2 border rounded-xl text-sm"
              />
            </div>
            <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
              {filteredContacts.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">No contacts found</p>
              ) : (
                filteredContacts.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => startConversation(c.id)}
                    className="w-full text-left p-3 hover:bg-slate-50 flex items-center justify-between"
                  >
                    <span>
                      <span className="block text-sm font-bold text-slate-800">{c.name}</span>
                      <span className="block text-[10px] text-slate-400 font-bold uppercase">{c.role}</span>
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
