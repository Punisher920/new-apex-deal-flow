import React, { useState, useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bot, Plus, Send, Trash2, Edit, Check } from 'lucide-react';
import MessageBubble from '../components/agent/MessageBubble';
import { AnimatePresence, motion } from 'framer-motion';

const AGENT_NAME = "apex_deal_flow_manager";

const SUGGESTED_COMMANDS = [
    "Find me 10 new wholesale deals in Tampa, Florida",
    "Update all market data for Orlando, FL",
    "Refresh buyer database and match properties",
    "Scan for new foreclosure filings in Hillsborough County",
    "Generate weekly deal flow report",
    "Update property valuations and ARVs for all active deals",
    "Find FSBO and expired listings in Miami, FL",
    "Update outreach status for all pending contacts"
];

export default function AgentChat() {
    const [conversations, setConversations] = useState([]);
    const [activeConversation, setActiveConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isEditing, setIsEditing] = useState({ id: null, text: '' });
    const [agentAvailable, setAgentAvailable] = useState(true);
    const endOfMessagesRef = useRef(null);

    const scrollToBottom = () => {
        endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const loadConversations = useCallback(async () => {
        try {
            const convos = await base44.agents.listConversations({ agent_name: AGENT_NAME });
            setConversations(convos);
            if (convos.length > 0 && !activeConversation) {
                setActiveConversation(convos[0]);
            }
        } catch (error) {
            console.error('Error loading conversations:', error);
            setAgentAvailable(false);
        }
    }, [activeConversation]);

    useEffect(() => {
        loadConversations();
    }, [loadConversations]);

    useEffect(() => {
        if (!activeConversation) return;

        const unsubscribe = base44.agents.subscribeToConversation(activeConversation.id, (data) => {
            setMessages(data.messages);
            scrollToBottom();
        });

        return () => unsubscribe();
    }, [activeConversation]);

    const handleCreateConversation = async () => {
        try {
            const convo = await base44.agents.createConversation({
                agent_name: AGENT_NAME,
                metadata: { name: `Analysis - ${new Date().toLocaleString()}` }
            });
            setConversations(prev => [convo, ...prev]);
            setActiveConversation(convo);
        } catch (error) {
            console.error('Error creating conversation:', error);
        }
    };

    const handleSendMessage = async () => {
        if (!input.trim() || !activeConversation) return;

        setIsSending(true);
        const messageContent = input;
        setInput('');
        
        try {
            await base44.agents.addMessage(activeConversation, {
                role: 'user',
                content: messageContent
            });
        } catch (error) {
            console.error('Error sending message:', error);
            setInput(messageContent); // Restore input on error
        }
        
        setIsSending(false);
    };
    
    const handleEditConversationName = async (id, newName) => {
        try {
            await base44.agents.updateConversation(id, { metadata: { name: newName } });
            await loadConversations();
            setIsEditing({ id: null, text: '' });
        } catch (error) {
            console.error('Error updating conversation:', error);
        }
    };
    
    const handleDeleteConversation = async (id) => {
        try {
            await base44.agents.deleteConversation(id);
            setConversations(convos => convos.filter(c => c.id !== id));
            if (activeConversation?.id === id) {
                const remainingConversations = conversations.filter(c => c.id !== id);
                setActiveConversation(remainingConversations[0] || null);
            }
        } catch (error) {
            console.error('Error deleting conversation:', error);
        }
    };

    const handleSuggestedCommand = (command) => {
        setInput(command);
    };

    if (!agentAvailable) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-6">
                <Card className="p-8 max-w-md text-center">
                    <Bot className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Agents Not Available</h2>
                    <p className="text-slate-600 mb-4">
                        AI Agents may not be enabled for this app. Please visit the Agent Diagnostics page to troubleshoot.
                    </p>
                    <Button onClick={() => window.location.href = '/agent-diagnostics'}>
                        Run Diagnostics
                    </Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex">
            {/* Sidebar */}
            <div className="w-80 border-r border-slate-200 bg-white/80 backdrop-blur-sm p-4 flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-slate-800">Conversations</h2>
                    <Button size="icon" variant="ghost" onClick={handleCreateConversation}>
                        <Plus className="w-5 h-5" />
                    </Button>
                </div>
                <div className="flex-1 overflow-y-auto space-y-2">
                    {conversations.map(convo => (
                        <div
                            key={convo.id}
                            onClick={() => setActiveConversation(convo)}
                            className={`p-3 rounded-lg cursor-pointer transition-all group ${activeConversation?.id === convo.id ? 'bg-blue-100' : 'hover:bg-slate-100'}`}
                        >
                            {isEditing.id === convo.id ? (
                                <div className="flex items-center gap-2">
                                    <Input value={isEditing.text} onChange={e => setIsEditing(prev => ({...prev, text: e.target.value}))} className="h-8"/>
                                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleEditConversationName(convo.id, isEditing.text)}><Check className="w-4 h-4"/></Button>
                                </div>
                            ) : (
                                <div className="flex justify-between items-center">
                                    <p className="text-sm font-medium text-slate-700 truncate">{convo.metadata?.name || `Conversation ${convo.id.slice(0,5)}`}</p>
                                    <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={(e) => {e.stopPropagation(); setIsEditing({id: convo.id, text: convo.metadata?.name})}}><Edit className="w-3 h-3"/></Button>
                                        <Button size="icon" variant="ghost" className="h-6 w-6 text-red-500" onClick={(e) => {e.stopPropagation(); handleDeleteConversation(convo.id)}}><Trash2 className="w-3 h-3"/></Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col">
                {activeConversation ? (
                    <>
                        <div className="flex-1 p-6 overflow-y-auto">
                            <div className="max-w-4xl mx-auto space-y-6">
                                {/* Suggested Commands */}
                                {messages.length === 0 && (
                                    <div className="mb-8">
                                        <h3 className="text-lg font-semibold text-slate-700 mb-4">Try these commands:</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {SUGGESTED_COMMANDS.map((command, index) => (
                                                <button
                                                    key={index}
                                                    onClick={() => handleSuggestedCommand(command)}
                                                    className="p-3 text-left bg-white/60 hover:bg-white/80 rounded-lg border border-slate-200 transition-all text-sm text-slate-700 hover:text-slate-900"
                                                >
                                                    {command}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <AnimatePresence>
                                    {messages.map((msg, index) => (
                                        <motion.div
                                            key={msg.id || index}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <MessageBubble message={msg} />
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                                <div ref={endOfMessagesRef} />
                            </div>
                        </div>

                        <div className="p-4 border-t border-slate-200 bg-white/80 backdrop-blur-sm">
                            <div className="max-w-4xl mx-auto">
                                <div className="relative">
                                    <Input
                                        value={input}
                                        onChange={e => setInput(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                                        placeholder="Ask the Apex Deal Flow Manager to find deals, update data, or manage your pipeline..."
                                        className="pr-12 h-12"
                                        disabled={isSending}
                                    />
                                    <Button
                                        size="icon"
                                        className="absolute right-2 top-1/2 -translate-y-1/2"
                                        onClick={handleSendMessage}
                                        disabled={isSending || !input.trim()}
                                    >
                                        <Send className="w-5 h-5" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                        <Bot className="w-24 h-24 text-slate-300 mb-6" />
                        <h2 className="text-2xl font-semibold text-slate-700">Apex Deal Flow Manager</h2>
                        <p className="text-slate-500 max-w-md mt-2">
                            Your comprehensive real estate AI that finds deals, updates market data, manages buyers, and tracks your entire investment pipeline with live web intelligence.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}