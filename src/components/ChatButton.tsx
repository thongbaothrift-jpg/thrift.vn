"use client";

import { useState, useRef, useEffect } from "react";

interface ChatMessage {
  id: number;
  text: string;
  isBot: boolean;
  time: string;
}

interface ChatButtonProps {
  pageId?: string;
}

export function ChatButton({ pageId }: ChatButtonProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      text: "Xin chào! 👋 Dream Shop có thể giúp gì cho bạn hôm nay?",
      isBot: true,
      time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [unread, setUnread] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null!);

  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now(),
      text: input.trim(),
      isBot: false,
      time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    // Open Messenger with pre-filled message
    if (pageId) {
      const encoded = encodeURIComponent(input.trim());
      window.open(`https://m.me/${pageId}?text=${encoded}`, "_blank");
    } else {
      window.open(`https://m.me/`, "_blank");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 group"
        aria-label="Mở chat hỗ trợ"
      >
        <div className="relative w-14 h-14 rounded-full bg-black shadow-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-2xl">
          {open ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-6 h-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              {unread > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unread}
                </span>
              )}
            </>
          )}
        </div>

        {/* Pulse ring */}
        {!open && (
          <div className="absolute inset-0 rounded-full bg-black/20 animate-ping pointer-events-none" />
        )}

        {/* Tooltip */}
        <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
          <div className="bg-black text-white text-xs font-medium px-3 py-1.5 rounded-full shadow-lg">
            Chat hỗ trợ
          </div>
        </div>
      </button>

      {/* Chat Window */}
      {open && (
        <div
          className="fixed bottom-24 right-6 z-50 w-80 bg-white rounded-2xl shadow-2xl border border-zinc-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300"
          style={{ height: "500px", maxHeight: "calc(100vh - 8rem)" }}
        >
          {/* Header */}
          <div className="bg-black px-5 py-4 flex items-center gap-3 flex-shrink-0">
            <div className="relative">
              <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5 text-white"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.654V24l4.088-2.242c1.092.301 2.246.464 3.443.464 6.627 0 12-4.975 12-11.111S18.627 0 12 0zm1.191 14.963l-3.055-3.26-5.963 3.26L10.732 8.2l3.131 3.26L19.752 8.2z" />
                </svg>
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-black" />
            </div>
            <div className="flex-1">
              <div className="text-white font-semibold text-sm">Dream Shop</div>
              <div className="text-white/60 text-xs">Hỗ trợ trực tuyến</div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-zinc-50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.isBot ? "justify-start" : "justify-end"}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.isBot
                      ? "bg-white text-zinc-800 rounded-tl-md shadow-sm"
                      : "bg-black text-white rounded-tr-md"
                  }`}
                >
                  {msg.text}
                  <div
                    className={`text-[10px] mt-1 ${
                      msg.isBot ? "text-zinc-400" : "text-white/50"
                    }`}
                  >
                    {msg.time}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick actions */}
          <div className="px-4 py-2 flex gap-2 overflow-x-auto flex-shrink-0 bg-zinc-50 border-t border-zinc-100">
            {["Tìm sản phẩm", "Tư vấn size", "Kiểm tra đơn hàng", "Chính sách đổi trả"].map(
              (q) => (
                <button
                  key={q}
                  onClick={() => {
                    setInput(q);
                    inputRef.current?.focus();
                  }}
                  className="flex-shrink-0 text-xs px-3 py-1.5 bg-white border border-zinc-200 text-zinc-600 rounded-full hover:bg-black hover:text-white transition-colors"
                >
                  {q}
                </button>
              )
            )}
          </div>

          {/* Input */}
          <div className="px-4 py-3 flex items-end gap-2 border-t border-zinc-200 flex-shrink-0">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Nhắn tin hỗ trợ..."
                rows={1}
                className="w-full resize-none rounded-xl border border-zinc-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 max-h-28 overflow-y-auto"
                style={{
                  minHeight: "42px",
                  height: "auto",
                }}
              />
            </div>
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-zinc-800 transition-colors flex-shrink-0"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Backdrop on mobile */}
      {open && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}
    </>
  );
}
