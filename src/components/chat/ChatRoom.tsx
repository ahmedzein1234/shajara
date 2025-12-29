'use client';

import * as React from 'react';
import {
  Send, Image, Smile, MoreVertical, Edit2, Trash2, Reply,
  Loader2, ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MentionInput } from './MentionInput';
import {
  type ChatMessage,
  getRoomMessages,
  sendMessage,
  editMessage,
  deleteMessage,
  updateReadStatus,
} from '@/lib/db/chat-actions';

interface ChatRoomProps {
  roomId: string;
  treeId: string;
  currentUserId: string;
  locale?: 'ar' | 'en';
}

const translations = {
  ar: {
    typeMessage: 'اكتب رسالتك...',
    send: 'إرسال',
    edit: 'تعديل',
    delete: 'حذف',
    reply: 'رد',
    edited: 'معدّل',
    deleted: 'تم حذف هذه الرسالة',
    loadMore: 'تحميل الرسائل السابقة',
    loading: 'جاري التحميل...',
    noMessages: 'لا توجد رسائل بعد. ابدأ المحادثة!',
    today: 'اليوم',
    yesterday: 'أمس',
  },
  en: {
    typeMessage: 'Type your message...',
    send: 'Send',
    edit: 'Edit',
    delete: 'Delete',
    reply: 'Reply',
    edited: 'edited',
    deleted: 'This message was deleted',
    loadMore: 'Load previous messages',
    loading: 'Loading...',
    noMessages: 'No messages yet. Start the conversation!',
    today: 'Today',
    yesterday: 'Yesterday',
  },
};

function formatMessageTime(timestamp: number, locale: 'ar' | 'en'): string {
  return new Date(timestamp * 1000).toLocaleTimeString(
    locale === 'ar' ? 'ar-SA' : 'en-US',
    { hour: '2-digit', minute: '2-digit' }
  );
}

function formatMessageDate(timestamp: number, locale: 'ar' | 'en', t: typeof translations['ar']): string {
  const date = new Date(timestamp * 1000);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return t.today;
  } else if (date.toDateString() === yesterday.toDateString()) {
    return t.yesterday;
  }

  return date.toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function groupMessagesByDate(messages: ChatMessage[], locale: 'ar' | 'en', t: typeof translations['ar']): Map<string, ChatMessage[]> {
  const groups = new Map<string, ChatMessage[]>();

  for (const message of messages) {
    const dateKey = formatMessageDate(message.created_at, locale, t);
    if (!groups.has(dateKey)) {
      groups.set(dateKey, []);
    }
    groups.get(dateKey)!.push(message);
  }

  return groups;
}

export function ChatRoom({ roomId, treeId, currentUserId, locale = 'ar' }: ChatRoomProps) {
  const t = translations[locale];
  const isRTL = locale === 'ar';

  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [sending, setSending] = React.useState(false);
  const [hasMore, setHasMore] = React.useState(true);
  const [messageText, setMessageText] = React.useState('');
  const [replyTo, setReplyTo] = React.useState<ChatMessage | null>(null);
  const [editingMessage, setEditingMessage] = React.useState<ChatMessage | null>(null);
  const [activeMenu, setActiveMenu] = React.useState<string | null>(null);

  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const messagesContainerRef = React.useRef<HTMLDivElement>(null);

  // Load messages
  const loadMessages = async (before?: string) => {
    setLoading(true);
    try {
      const data = await getRoomMessages(roomId, { limit: 50, before });

      if (before) {
        setMessages(prev => [...data, ...prev]);
      } else {
        setMessages(data);
      }

      setHasMore(data.length === 50);

      // Mark as read
      if (data.length > 0 && !before) {
        await updateReadStatus(roomId, data[data.length - 1].id);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadMessages();

    // Poll for new messages every 5 seconds
    const interval = setInterval(async () => {
      if (messages.length > 0) {
        const lastMessage = messages[messages.length - 1];
        const newMessages = await getRoomMessages(roomId, { after: lastMessage.id, limit: 50 });
        if (newMessages.length > 0) {
          setMessages(prev => [...prev, ...newMessages]);
          await updateReadStatus(roomId, newMessages[newMessages.length - 1].id);
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [roomId]);

  // Scroll to bottom on new messages
  React.useEffect(() => {
    if (!loading && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, loading]);

  const handleSend = async () => {
    if (!messageText.trim()) return;

    setSending(true);
    try {
      if (editingMessage) {
        await editMessage(editingMessage.id, messageText);
        setMessages(prev =>
          prev.map(m =>
            m.id === editingMessage.id
              ? { ...m, content: messageText, is_edited: true, edited_at: Date.now() / 1000 }
              : m
          )
        );
        setEditingMessage(null);
      } else {
        const result = await sendMessage(roomId, messageText, {
          replyToId: replyTo?.id,
        });
        if (result.success && result.message) {
          setMessages(prev => [...prev, result.message!]);
        }
        setReplyTo(null);
      }
      setMessageText('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (messageId: string) => {
    try {
      await deleteMessage(messageId);
      setMessages(prev =>
        prev.map(m =>
          m.id === messageId
            ? { ...m, content: '[deleted]', is_deleted: true, deleted_at: Date.now() / 1000 }
            : m
        )
      );
    } catch (error) {
      console.error('Failed to delete message:', error);
    }
    setActiveMenu(null);
  };

  const handleEdit = (message: ChatMessage) => {
    setEditingMessage(message);
    setMessageText(message.content);
    setActiveMenu(null);
  };

  const handleReply = (message: ChatMessage) => {
    setReplyTo(message);
    setActiveMenu(null);
  };

  const groupedMessages = groupMessagesByDate(messages, locale, t);

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Messages Area */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {/* Load More */}
        {hasMore && messages.length > 0 && (
          <div className="text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => loadMessages(messages[0].id)}
              disabled={loading}
            >
              {loading ? t.loading : t.loadMore}
              <ChevronDown className="w-4 h-4 ms-1 rotate-180" />
            </Button>
          </div>
        )}

        {/* No Messages */}
        {!loading && messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-slate-400">
            <p>{t.noMessages}</p>
          </div>
        )}

        {/* Messages */}
        {Array.from(groupedMessages.entries()).map(([dateKey, dayMessages]) => (
          <div key={dateKey}>
            {/* Date Separator */}
            <div className="flex items-center gap-4 my-4">
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
              <span className="text-xs text-slate-400 px-2">{dateKey}</span>
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
            </div>

            {/* Day Messages */}
            {dayMessages.map((message, index) => {
              const isOwn = message.sender_id === currentUserId;
              const showAvatar = index === 0 || dayMessages[index - 1].sender_id !== message.sender_id;

              return (
                <div
                  key={message.id}
                  className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}
                >
                  {/* Avatar */}
                  {showAvatar ? (
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                      isOwn ? 'bg-islamic-primary' : 'bg-slate-400'
                    }`}>
                      {(message.sender_name || '?').charAt(0).toUpperCase()}
                    </div>
                  ) : (
                    <div className="w-8" />
                  )}

                  {/* Message Bubble */}
                  <div className={`group relative max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
                    {/* Sender Name */}
                    {showAvatar && !isOwn && (
                      <p className="text-xs text-slate-500 mb-1 ms-2">
                        {message.sender_name}
                      </p>
                    )}

                    {/* Reply Preview */}
                    {message.reply_to_id && (
                      <div className={`text-xs p-2 mb-1 rounded-lg border-s-2 ${
                        isOwn
                          ? 'bg-islamic-light/50 border-islamic-primary'
                          : 'bg-slate-100 dark:bg-slate-800 border-slate-300'
                      }`}>
                        <p className="text-slate-500 truncate">
                          {messages.find(m => m.id === message.reply_to_id)?.content || '...'}
                        </p>
                      </div>
                    )}

                    <div
                      className={`relative px-4 py-2 rounded-2xl ${
                        message.is_deleted
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 italic'
                          : isOwn
                            ? 'bg-islamic-primary text-white'
                            : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">
                        {message.is_deleted ? t.deleted : message.content}
                      </p>

                      {/* Time & Edited */}
                      <div className={`flex items-center gap-1 mt-1 text-xs ${
                        isOwn ? 'text-white/70' : 'text-slate-400'
                      }`}>
                        <span>{formatMessageTime(message.created_at, locale)}</span>
                        {message.is_edited && !message.is_deleted && (
                          <span>• {t.edited}</span>
                        )}
                      </div>

                      {/* Actions Menu */}
                      {!message.is_deleted && (
                        <div className={`absolute top-1 ${isOwn ? 'start-0 -translate-x-full' : 'end-0 translate-x-full'} opacity-0 group-hover:opacity-100 transition-opacity`}>
                          <button
                            onClick={() => setActiveMenu(activeMenu === message.id ? null : message.id)}
                            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {activeMenu === message.id && (
                            <div className={`absolute top-full mt-1 ${isOwn ? 'start-0' : 'end-0'} bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-10 min-w-[120px]`}>
                              <button
                                onClick={() => handleReply(message)}
                                className="w-full px-4 py-2 text-sm text-start text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                              >
                                <Reply className="w-4 h-4" />
                                {t.reply}
                              </button>
                              {isOwn && (
                                <>
                                  <button
                                    onClick={() => handleEdit(message)}
                                    className="w-full px-4 py-2 text-sm text-start text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                    {t.edit}
                                  </button>
                                  <button
                                    onClick={() => handleDelete(message.id)}
                                    className="w-full px-4 py-2 text-sm text-start text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    {t.delete}
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Reply/Edit Preview */}
      {(replyTo || editingMessage) && (
        <div className="px-4 py-2 bg-slate-100 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {replyTo ? (
              <>
                <Reply className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-500">{locale === 'ar' ? 'رد على:' : 'Replying to:'}</span>
                <span className="text-sm text-slate-700 dark:text-slate-300 truncate max-w-[200px]">
                  {replyTo.content}
                </span>
              </>
            ) : (
              <>
                <Edit2 className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-500">{locale === 'ar' ? 'تعديل الرسالة' : 'Editing message'}</span>
              </>
            )}
          </div>
          <button
            onClick={() => {
              setReplyTo(null);
              setEditingMessage(null);
              setMessageText('');
            }}
            className="p-1 text-slate-400 hover:text-slate-600"
          >
            <span className="sr-only">Cancel</span>
            ✕
          </button>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <MentionInput
              treeId={treeId}
              value={messageText}
              onChange={setMessageText}
              placeholder={t.typeMessage}
              locale={locale}
              onSubmit={handleSend}
            />
          </div>
          <Button
            onClick={handleSend}
            disabled={sending || !messageText.trim()}
            className="bg-islamic-primary hover:bg-islamic-dark text-white h-10"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
