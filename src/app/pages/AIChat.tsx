import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { Send, Bot, User, Sparkles, Plus, Copy, FileText } from "lucide-react";
import { useChatMutation, useDocumentsQuery } from "../api/hooks";
import { toast } from "sonner";

const suggestedPrompts = [
  "Summarize my invoices",
  "Find resumes with Python and FastAPI",
  "Search receipts from Amazon",
  "Show contracts expiring this year",
];

type Chat = {
  id: number;
  title: string;
  time: string;
  messages: Message[];
};

type Message = {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  sources?: string[];
};

const initialMessage: Message = {
  role: "assistant",
  content: "Hello! I'm your AI assistant. I can help you analyze your documents, answer questions, and provide insights. What would you like to know?",
  timestamp: new Date().toLocaleTimeString(),
};

const initialChatHistory: Chat[] = [
  { id: 1, title: "Document Analysis Session", time: "Just now", messages: [initialMessage] }
];

export default function AIChat() {
  const navigate = useNavigate();
  const chatMutation = useChatMutation();
  
  // Load documents list to resolve source file click events to page redirects
  const { data: docsData } = useDocumentsQuery();

  const [chatHistory, setChatHistory] = useState<Chat[]>(initialChatHistory);
  const [activeChat, setActiveChat] = useState<Chat>(initialChatHistory[0]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeChat.messages, isTyping]);

  const handleSend = async (overrideInput?: string) => {
    const text = (overrideInput ?? input).trim();
    if (!text) return;

    const userMessage: Message = {
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString(),
    };

    const updatedMessages = [...activeChat.messages, userMessage];
    setActiveChat((prev) => ({ ...prev, messages: updatedMessages }));
    setInput("");
    setIsTyping(true);

    try {
      const response = await chatMutation.mutateAsync(text);
      
      const aiResponse: Message = {
        role: "assistant",
        content: response.answer,
        sources: response.sources || [],
        timestamp: new Date().toLocaleTimeString(),
      };
      
      const finalMessages = [...updatedMessages, aiResponse];
      
      setActiveChat((prev) => ({ ...prev, messages: finalMessages }));
      setChatHistory((prev) => 
        prev.map((c) => c.id === activeChat.id ? { ...c, messages: finalMessages, title: text.slice(0, 30) + (text.length > 30 ? "..." : "") } : c)
      );
    } catch (error) {
      const aiResponse: Message = {
        role: "assistant",
        content: "Sorry, I encountered an error attempting to generate an answer. Please verify your backend server is running and database embeddings have been indexed.",
        timestamp: new Date().toLocaleTimeString(),
      };
      const finalMessages = [...updatedMessages, aiResponse];
      setActiveChat((prev) => ({ ...prev, messages: finalMessages }));
    } finally {
      setIsTyping(false);
    }
  };

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("Message copied to clipboard!");
  };

  const handlePromptClick = (prompt: string) => {
    setInput(prompt);
    handleSend(prompt);
  };

  const startNewChat = () => {
    const newId = Date.now();
    const newChat: Chat = { id: newId, title: "New Chat", time: "now", messages: [initialMessage] };
    setChatHistory((prev) => [newChat, ...prev]);
    setActiveChat(newChat);
    setInput("");
  };

  const loadChat = (chat: Chat) => {
    setActiveChat(chat);
    setInput("");
  };

  const formatContent = (content: string) => {
    return content.split("\n").map((line, i) => {
      const bold = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
      return <p key={i} className={line.startsWith("•") ? "ml-4 text-gray-700" : ""} dangerouslySetInnerHTML={{ __html: bold }} />;
    });
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold">AI Chat</h1>
        <p className="text-gray-600 mt-1">Ask questions about your documents and get instant insights</p>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-4 text-left">
          <Card>
            <CardContent className="pt-6">
              <Button
                className="w-full bg-green-600 hover:bg-green-700 active:scale-95 transition-transform"
                onClick={startNewChat}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Chat
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Chats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {chatHistory.map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => loadChat(chat)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      activeChat.id === chat.id ? "bg-green-50 text-green-700" : "hover:bg-gray-50"
                    }`}
                  >
                    <p className="text-sm font-medium truncate">{chat.title}</p>
                    <p className="text-xs text-gray-500 mt-1">{chat.time}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chat Area */}
        <div className="lg:col-span-3">
          <Card className="flex flex-col" style={{ height: "calc(100vh - 16rem)" }}>
            <CardHeader className="border-b flex-shrink-0 text-left">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <Bot className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <CardTitle>Document Assistant</CardTitle>
                  <CardDescription>Powered by Advanced AI</CardDescription>
                </div>
              </div>
            </CardHeader>

            <div className="flex-1 overflow-hidden flex flex-col">
              {/* Messages */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-6">
                <div className="space-y-6">
                  {activeChat.messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
                    >
                      <Avatar className="w-8 h-8 flex-shrink-0">
                        <AvatarFallback className={message.role === "user" ? "bg-blue-600" : "bg-green-600"}>
                          {message.role === "user"
                            ? <User className="h-4 w-4 text-white" />
                            : <Bot className="h-4 w-4 text-white" />
                          }
                        </AvatarFallback>
                      </Avatar>
                      <div className={`flex flex-col ${message.role === "user" ? "items-end" : "items-start"} max-w-[80%]`}>
                        <div
                          className={`p-4 rounded-lg relative group ${
                            message.role === "user"
                              ? "bg-blue-600 text-white"
                              : "bg-gray-100 text-gray-900"
                          }`}
                        >
                          {/* Copy button next to message content */}
                          {message.role === "assistant" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 hover:bg-gray-200/50 transition-all rounded"
                              onClick={() => handleCopyMessage(message.content)}
                              title="Copy to clipboard"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          )}
                          
                          <div className="text-sm leading-relaxed space-y-1 text-left">
                            {formatContent(message.content)}
                          </div>

                          {/* Beautiful Source Cards (cites documents and redirects user to their Details pages) */}
                          {message.role === "assistant" && message.sources && message.sources.length > 0 && (
                            <div className="mt-3 pt-2.5 border-t border-gray-200/50 w-full text-left">
                              <p className="text-[10px] text-gray-500 font-bold tracking-wider mb-1">SOURCES CITATIONS:</p>
                              <div className="flex gap-1.5 flex-wrap">
                                {message.sources.map((source, sIdx) => (
                                  <Badge
                                    key={sIdx}
                                    variant="outline"
                                    className="text-[10px] bg-white text-gray-600 border-gray-200 hover:bg-green-50 hover:text-green-700 hover:border-green-300 cursor-pointer flex items-center gap-1 transition-all"
                                    onClick={() => {
                                      // Resolve source file to its document id and redirect
                                      const foundDoc = docsData?.items?.find((d) => d.name === source);
                                      if (foundDoc) {
                                        navigate(`/app/documents/${foundDoc.id}`);
                                      } else {
                                        toast.info(`Source filename: ${source}`);
                                      }
                                    }}
                                  >
                                    <FileText className="h-2.5 w-2.5" />
                                    {source}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* Regenerate Action Row for last Assistant message */}
                        {message.role === "assistant" && index === activeChat.messages.length - 1 && activeChat.messages.length > 1 && (
                          <div className="flex gap-2 mt-1 px-1">
                            <Button
                              variant="ghost"
                              onClick={() => {
                                const lastUserQuery = activeChat.messages[index - 1].content;
                                setActiveChat((prev) => ({
                                  ...prev,
                                  messages: prev.messages.slice(0, -1)
                                }));
                                handleSend(lastUserQuery);
                              }}
                              className="h-6 text-[10px] text-gray-500 px-2 flex items-center gap-1 hover:bg-gray-100 rounded"
                            >
                              <Sparkles className="h-2.5 w-2.5 text-green-600" />
                              Regenerate response
                            </Button>
                          </div>
                        )}
                        
                        <p className="text-xs text-gray-400 mt-1 px-1">{message.timestamp}</p>
                      </div>
                    </div>
                  ))}

                  {isTyping && (
                    <div className="flex gap-3">
                      <Avatar className="w-8 h-8 flex-shrink-0">
                        <AvatarFallback className="bg-green-600">
                          <Bot className="h-4 w-4 text-white" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="bg-gray-100 rounded-lg px-4 py-3">
                        <div className="flex gap-1 items-center">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Suggested Prompts */}
              {activeChat.messages.length === 1 && !isTyping && (
                <div className="p-4 border-t bg-gray-50 flex-shrink-0 text-left">
                  <p className="text-sm text-gray-600 mb-3 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-green-600" />
                    Suggested Questions:
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {suggestedPrompts.map((prompt, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        className="justify-start h-auto py-2 px-3 text-left text-xs hover:border-green-300 hover:bg-green-50 transition-colors"
                        onClick={() => handlePromptClick(prompt)}
                      >
                        {prompt}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input */}
              <div className="p-4 border-t flex-shrink-0">
                <div className="flex gap-2">
                  <Input
                    placeholder="Ask a question about your documents..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                    className="flex-1"
                    disabled={isTyping}
                  />
                  <Button
                    onClick={() => handleSend()}
                    className="bg-green-600 hover:bg-green-700 active:scale-95 transition-transform"
                    disabled={!input.trim() || isTyping}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
