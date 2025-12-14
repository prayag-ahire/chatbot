import React from 'react';
import { Message } from '../types';
import ReactMarkdown from 'react-markdown';

interface ChatBubbleProps {
  message: Message;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';

  // Enhanced markdown rendering with better styling for lists and formatting
  const markdownComponents = {
    ul: ({ children }: any) => (
      <ul className="list-none space-y-1 pl-0">
        {children}
      </ul>
    ),
    li: ({ children }: any) => (
      <li className="text-sm flex items-start">
        <span className="mr-2">•</span>
        <span>{children}</span>
      </li>
    ),
    ol: ({ children }: any) => (
      <ol className="list-decimal space-y-1 pl-4">
        {children}
      </ol>
    ),
    p: ({ children }: any) => (
      <p className="text-sm mb-2">{children}</p>
    ),
    strong: ({ children }: any) => (
      <strong className="font-semibold text-gray-900">{children}</strong>
    ),
    em: ({ children }: any) => (
      <em className="italic text-gray-700">{children}</em>
    ),
  };

  return (
    <div className={`flex w-full mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-5 py-3 shadow-sm ${
          isUser
            ? 'bg-blue-600 text-white rounded-br-none'
            : 'bg-white border border-gray-100 text-gray-800 rounded-bl-none'
        }`}
      >
        {isUser ? (
          <p className="text-sm md:text-base">{message.content}</p>
        ) : (
          <div className="space-y-1">
            <ReactMarkdown components={markdownComponents}>
              {message.content}
            </ReactMarkdown>
          </div>
        )}
        <span
          className={`text-[10px] mt-2 block opacity-70 ${
            isUser ? 'text-blue-100 text-right' : 'text-gray-400'
          }`}
        >
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
};
