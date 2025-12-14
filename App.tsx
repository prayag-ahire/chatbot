import React, { useState, useEffect, useRef } from 'react';
import { fetchWorkerData } from './services/dataService';
import { generateWorkerResponse } from './services/geminiService';
import { Message, WorkerContext } from './types';
import { ChatBubble } from './components/ChatBubble';
import { LoadingDots } from './components/LoadingDots';
import { User, Briefcase, Star, Send, Menu, Activity } from 'lucide-react';

// Hardcoded for demo: Simulate Suresh Kumar (ID 1) logged in
const WORKER_ID = 1;

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [workerContext, setWorkerContext] = useState<WorkerContext | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Load Worker Data on Mount
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('Loading worker data for ID:', WORKER_ID);
        const data = await fetchWorkerData(WORKER_ID);
        if (data) {
          console.log('Worker data loaded successfully:', data);
          setWorkerContext(data);
        } else {
          console.error('No worker data returned');
          setLoadError('Unable to load your profile. Please check your connection.');
        }
      } catch (error) {
        console.error('Error loading worker data:', error);
        setLoadError('Failed to load profile: ' + (error instanceof Error ? error.message : 'Unknown error'));
      }
    };
    loadData();
  }, []);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim() || !workerContext) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      const responseText = await generateWorkerResponse(userMsg.content, workerContext);
      
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseText,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error("Chat error", error);
    } finally {
      setIsLoading(false);
    }
  };

  // UI Components helpers
  const StatCard = ({ label, value, icon: Icon, color }: any) => (
    <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-3">
      <div className={`p-2 rounded-lg ${color} bg-opacity-10 text-${color.replace('bg-', '')}-600`}>
        <Icon size={18} className={color.replace('bg-', 'text-')} />
      </div>
      <div>
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className="text-sm font-bold text-gray-800">{value}</p>
      </div>
    </div>
  );

  if (!workerContext) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          {loadError ? (
            <>
              <div className="text-red-500 text-lg mb-4">⚠️ Error</div>
              <p className="text-gray-700 font-medium mb-2">{loadError}</p>
              <p className="text-gray-500 text-sm mb-4">Make sure you have internet connection and valid Supabase credentials.</p>
              <button 
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Retry
              </button>
            </>
          ) : (
            <>
              <LoadingDots />
              <p className="text-gray-500 mt-2 text-sm">Loading your ProWorker profile...</p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      
      {/* Sidebar - Desktop */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:block ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 h-full flex flex-col">
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold shadow-sm">
              PW
            </div>
            <h1 className="text-xl font-bold text-gray-800 tracking-tight">ProWorker</h1>
          </div>

          <div className="flex flex-col items-center mb-6">
            <img 
              src={workerContext.profile.imgurl} 
              alt={workerContext.profile.name} 
              className="w-20 h-20 rounded-full border-4 border-indigo-50 object-cover mb-3 shadow-sm"
            />
            <h2 className="text-lg font-semibold text-gray-900">{workerContext.profile.name}</h2>
            <p className="text-sm text-gray-500 flex items-center">
              <Briefcase size={14} className="mr-1" /> {workerContext.profile.profession}
            </p>
          </div>

          <div className="space-y-3 mb-6">
            <StatCard 
              label="Current Rating" 
              value={workerContext.profile.rating.toFixed(1)} 
              icon={Star} 
              color="bg-yellow-500" 
            />
            <StatCard 
              label="Completed Orders" 
              value={workerContext.orderSummary.completed} 
              icon={Activity} 
              color="bg-green-500" 
            />
          </div>

          <div className="mt-auto">
            <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
              <p className="text-xs text-indigo-800 font-medium mb-1">Did you know?</p>
              <p className="text-xs text-indigo-600 leading-relaxed">
                Updating your schedule weekly helps clients know when you are free.
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col h-full w-full relative">
        {/* Mobile Header */}
        <header className="bg-white border-b border-gray-200 p-4 flex items-center justify-between md:hidden">
          <div className="flex items-center space-x-2">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
              <Menu size={20} />
            </button>
            <span className="font-semibold text-gray-800">ProWorker Assistant</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden">
             <img src={workerContext.profile.imgurl} alt="Profile" className="w-full h-full object-cover"/>
          </div>
        </header>

        {/* Overlay for mobile sidebar */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          ></div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-2 scroll-smooth">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4 opacity-50">
              <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-400 mb-2">
                <Briefcase size={32} />
              </div>
              <p className="text-sm">Say "Hi" to start your assistant</p>
            </div>
          ) : (
            messages.map((msg) => (
              <ChatBubble key={msg.id} message={msg} />
            ))
          )}
          {isLoading && (
            <div className="flex w-full mb-4 justify-start">
               <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-none px-5 py-4 shadow-sm">
                 <LoadingDots />
               </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-gray-200">
          <div className="max-w-4xl mx-auto relative">
            <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask about your performance..."
                className="flex-1 bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-full focus:ring-indigo-500 focus:border-indigo-500 block w-full p-4 pl-5 outline-none transition-shadow focus:ring-2 disabled:opacity-50"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !inputValue.trim()}
                className="p-4 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
              >
                <Send size={18} />
              </button>
            </form>
            <p className="text-center text-xs text-gray-400 mt-2">
              AI can make mistakes. Please verify important details.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}