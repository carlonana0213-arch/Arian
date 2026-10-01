import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const MessagingWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeChatId, setActiveChatId] = useState(null); // null means showing the inbox list
  const [inputText, setInputText] = useState('');
  const { user } = useAuth();
  const messagesEndRef = useRef(null);

  // Advanced Mock Data Structure with DMs and Groups
  const [conversations, setConversations] = useState([
    {
      id: 1,
      name: 'Jane Director',
      role: 'Project Manager',
      type: 'direct',
      unread: 2,
      messages: [
        { id: 101, sender: 'Jane Director', text: 'Hey, are we on track for the milestone tomorrow?', time: '09:00 AM', isMe: false },
        { id: 102, sender: 'Jane Director', text: 'Has the Hirono concept art been updated yet?', time: '10:14 AM', isMe: false }
      ]
    },
    {
      id: 2,
      name: 'France Sotelo',
      role: 'Lead Animator',
      type: 'direct',
      unread: 0,
      messages: [
        { id: 201, sender: 'France Sotelo', text: 'I just pushed the new walk cycle to the pipeline.', time: 'Yesterday', isMe: false },
        { id: 202, sender: 'Me', text: 'Awesome, I will review it shortly.', time: 'Yesterday', isMe: true }
      ]
    },
    {
      id: 3,
      name: 'Studio General',
      role: 'Everyone',
      type: 'group',
      unread: 0,
      messages: [
        { id: 301, sender: 'System', text: 'Zhongli_Burst_v2 was Approved.', time: '10:30 AM', isMe: false, isSystem: true }
      ]
    }
  ]);

  const activeChat = conversations.find(c => c.id === activeChatId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && activeChatId) scrollToBottom();
  }, [isOpen, activeChatId, conversations]);

  const openChat = (id) => {
    setActiveChatId(id);
    // Mark as read when opened
    setConversations(prev => prev.map(chat => 
      chat.id === id ? { ...chat, unread: 0 } : chat
    ));
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeChatId) return;
    
    setConversations(prev => prev.map(chat => {
      if (chat.id === activeChatId) {
        return {
          ...chat,
          messages: [...chat.messages, {
            id: Date.now(),
            sender: user?.name || 'Me',
            text: inputText,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isMe: true
          }]
        };
      }
      return chat;
    }));
    setInputText('');
  };

  // Safe early return after all hooks are declared
  if (!user) return null;

  const totalUnread = conversations.reduce((sum, chat) => sum + chat.unread, 0);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen && (
        <div className="glass-panel w-80 h-[450px] mb-4 flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4 transition-colors">
          
          {/* DYNAMIC HEADER */}
          <div className="bg-[#1e1e1e] border-b border-[#333333] p-4 flex justify-between items-center z-10">
            {activeChatId ? (
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setActiveChatId(null)} 
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  &larr;
                </button>
                <div>
                  <h3 className="text-white font-bold text-sm flex items-center gap-2">
                    {activeChat.type === 'direct' && <span className="w-2 h-2 rounded-full bg-[#10b981]"></span>}
                    {activeChat.name}
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">{activeChat.role}</p>
                </div>
              </div>
            ) : (
              <div>
                <h3 className="text-white font-bold text-sm">Messages</h3>
                <p className="text-xs text-gray-400 mt-0.5">Studio Inbox</p>
              </div>
            )}
            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white transition-colors">✕</button>
          </div>
          
          {/* CONDITIONAL BODY: INBOX LIST vs ACTIVE CHAT */}
          {!activeChatId ? (
            <div className="flex-1 overflow-y-auto bg-[#121212]">
              <div className="divide-y divide-[#333333]">
                {conversations.map(chat => (
                  <div 
                    key={chat.id} 
                    onClick={() => openChat(chat.id)}
                    className="p-4 hover:bg-white/5 cursor-pointer transition-colors flex items-center gap-3 relative"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#1e1e1e] border border-[#333333] flex items-center justify-center text-white font-bold shrink-0">
                      {chat.type === 'group' ? '👥' : chat.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-1">
                        <p className={`text-sm truncate ${chat.unread > 0 ? 'text-white font-bold' : 'text-gray-300 font-medium'}`}>
                          {chat.name}
                        </p>
                        <span className="text-[10px] text-gray-500 whitespace-nowrap ml-2">
                          {chat.messages.length > 0 ? chat.messages[chat.messages.length - 1].time : ''}
                        </span>
                      </div>
                      <p className={`text-xs truncate ${chat.unread > 0 ? 'text-gray-300' : 'text-gray-500'}`}>
                        {chat.messages.length > 0 ? chat.messages[chat.messages.length - 1].text : 'No messages yet.'}
                      </p>
                    </div>
                    {chat.unread > 0 && (
                      <div className="w-5 h-5 rounded-full bg-[#ff477e] flex items-center justify-center text-[10px] font-bold text-white shadow-md">
                        {chat.unread}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 p-4 overflow-y-auto bg-[#121212] flex flex-col gap-4">
                <p className="text-[10px] text-center text-gray-500 mb-2 uppercase tracking-widest font-bold">Encrypted Connection</p>
                
                {activeChat.messages.map(msg => (
                  <div key={msg.id} className={`flex flex-col ${msg.isSystem ? 'items-center' : msg.isMe ? 'items-end' : 'items-start'}`}>
                    {msg.isSystem ? (
                      <span className="bg-[#1e1e1e] text-xs text-gray-400 px-3 py-1 rounded-full border border-[#333333]">{msg.text}</span>
                    ) : (
                      <>
                        {(!msg.isMe && activeChat.type === 'group') && <span className="text-xs text-gray-400 mb-1 ml-1">{msg.sender}</span>}
                        <div className={`p-3 rounded-xl text-sm max-w-[85%] shadow-sm ${
                          msg.isMe 
                            ? 'bg-[#9d4edd] text-white rounded-br-none' 
                            : 'bg-[#1e1e1e] border border-[#333333] text-white rounded-bl-none'
                        }`}>
                          {msg.text}
                        </div>
                        <span className="text-[10px] text-gray-500 mt-1 mx-1">{msg.time}</span>
                      </>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSend} className="p-3 bg-[#1e1e1e] border-t border-[#333333] flex gap-2">
                <input 
                  type="text" 
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type a message..." 
                  className="flex-1 bg-[#121212] border border-[#333333] text-white px-3 py-2 rounded text-sm focus:outline-none focus:border-[#9d4edd] transition-colors" 
                />
                <button type="submit" className="bg-[#9d4edd] text-white px-3 py-2 rounded text-sm font-bold hover:bg-[#ff477e] transition-colors">
                  ➤
                </button>
              </form>
            </>
          )}
        </div>
      )}
      
      {/* TRIGGER BUTTON */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-14 h-14 rounded-full bg-gradient-to-r from-[#9d4edd] to-[#ff477e] text-white shadow-[0_0_20px_rgba(157,78,221,0.4)] flex items-center justify-center text-2xl hover:scale-110 transition-transform"
      >
        💬
        {!isOpen && totalUnread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-white text-[#ff477e] rounded-full flex items-center justify-center text-xs font-bold shadow-lg border-2 border-[#121212]">
            {totalUnread}
          </span>
        )}
      </button>
    </div>
  );
};

export default MessagingWidget;