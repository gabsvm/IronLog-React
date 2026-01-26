
import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Icon } from '../ui/Icon';
import { ProgramDay, MuscleGroup } from '../../types';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { getTranslated } from '../../utils';
import { TRANSLATIONS } from '../../constants';

interface Message {
    id: string;
    role: 'user' | 'model';
    text: string;
}

export const IronCoachChat: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { activeMeso, logs, lang, config, setProgram, program, exercises } = useApp();
    const t = TRANSLATIONS[lang];
    
    const [messages, setMessages] = useLocalStorage<Message[]>('il_chat_history_v1', [
        { id: 'init', role: 'model', text: lang === 'en' ? "I am IronCoach. I can analyze your data, create new routines, or modify your current plan." : "Soy IronCoach. Puedo analizar tus datos, crear rutinas nuevas o modificar tu plan actual." }
    ]);
    
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    const handleClearChat = () => {
        if(window.confirm("Clear chat history?")) {
            setMessages([{ id: Date.now().toString(), role: 'model', text: lang === 'en' ? "Chat cleared. How can I help?" : "Chat borrado. ¿En qué puedo ayudarte?" }]);
        }
    };

    const buildContext = () => {
        const safeLogs = Array.isArray(logs) ? logs : [];
        const recentLogs = safeLogs.slice(0, 5).map(l => ({
            date: new Date(l.endTime).toDateString(),
            name: l.name,
            volume: l.exercises?.reduce((acc, ex) => acc + (ex.sets?.filter(s => s.completed).length || 0), 0)
        }));

        const exerciseMap = exercises.slice(0, 100).map(e => `- ID: "${e.id}", Name: "${getTranslated(e.name, 'en')}" (${e.muscle})`).join('\n');

        const currentProgramSummary = (program || []).map((d, i) => 
            `Day ${i+1} (${getTranslated(d.dayName, 'en')}): ${d.slots?.map(s => s.muscle).join(', ')}`
        ).join('\n');

        return `
            CURRENT PROGRAM:
            ${currentProgramSummary}

            ACTIVE STATE:
            - Mesocycle: ${activeMeso ? `${activeMeso.name} (Week ${activeMeso.week})` : "None"}
            
            RECENT LOGS:
            ${JSON.stringify(recentLogs)}

            AVAILABLE EXERCISES (Use these IDs when creating plans):
            ${exerciseMap}
        `;
    };

    const handleSend = async (textOverride?: string) => {
        const text = textOverride || input;
        if (!text.trim() || isLoading) return;

        const userMsg: Message = { id: Date.now().toString(), role: 'user', text };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            // Safety Check for Environment Variable
            // @ts-ignore
            const apiKey = process.env.API_KEY;
            
            // Debug Log (will show in browser console)
            if (!apiKey || apiKey.includes("INSERT_KEY")) {
                console.error("IronCoach Error: API Key is missing.");
                const missingMsg = lang === 'en' 
                    ? "⚠️ API Key Missing. Please create a .env file in the project root with: API_KEY=your_key_here"
                    : "⚠️ Falta la API Key. Crea un archivo .env en la raíz del proyecto con: API_KEY=tu_clave_aqui";
                
                throw new Error(missingMsg);
            }

            // Dynamic import to prevent crash on initial load if SDK fails
            const { GoogleGenAI, Type } = await import("@google/genai");

            // TOOL 1: Create Full Program
            const createProgramTool = {
                name: "createWorkoutPlan",
                description: "Overwrites the ENTIRE workout program. Use this for new routines.",
                parameters: {
                    type: Type.OBJECT,
                    properties: {
                        programName: { type: Type.STRING },
                        days: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    dayName: { type: Type.STRING },
                                    exercises: {
                                        type: Type.ARRAY,
                                        items: {
                                            type: Type.OBJECT,
                                            properties: {
                                                exerciseId: { type: Type.STRING, description: "The exact ID of the exercise from the provided list (e.g., 'bp_bar'). If unknown, leave empty." },
                                                muscle: { type: Type.STRING, description: "Target muscle enum (CHEST, BACK...)" },
                                                sets: { type: Type.NUMBER }
                                            },
                                            required: ["muscle"]
                                        }
                                    }
                                },
                                required: ["dayName", "exercises"]
                            }
                        }
                    },
                    required: ["days"]
                }
            };

            // TOOL 2: Modify Specific Day
            const modifyDayTool = {
                name: "modifyWorkoutDay",
                description: "Modifies a SINGLE day in the current program by index. Use this to tweak specific days.",
                parameters: {
                    type: Type.OBJECT,
                    properties: {
                        dayIndex: { type: Type.NUMBER, description: "0-based index of the day to modify (e.g., 0 for Day 1)" },
                        newStructure: {
                            type: Type.OBJECT,
                            properties: {
                                dayName: { type: Type.STRING },
                                exercises: {
                                    type: Type.ARRAY,
                                    items: {
                                        type: Type.OBJECT,
                                        properties: {
                                            exerciseId: { type: Type.STRING, description: "The exact ID of the exercise (e.g., 'bp_bar')." },
                                            muscle: { type: Type.STRING, description: "Target muscle enum" },
                                            sets: { type: Type.NUMBER }
                                        },
                                        required: ["muscle"]
                                    }
                                }
                            },
                            required: ["exercises"]
                        }
                    },
                    required: ["dayIndex", "newStructure"]
                }
            };

            const contextData = buildContext();
            const ai = new GoogleGenAI({ apiKey });
            
            const systemInstruction = `
                You are IronCoach, an elite hypertrophy coach agent.
                
                CONTEXT:
                ${contextData}

                CAPABILITIES:
                1. ANALYZE: Review user logs and volume.
                2. CREATE: Use 'createWorkoutPlan' to build a FULL new routine.
                3. MODIFY: Use 'modifyWorkoutDay' to change ONE specific day (e.g. "Change Day 1").

                RULES:
                - When assigning exercises, ALWAYS try to find the matching ID from the "AVAILABLE EXERCISES" list. 
                - If the user asks for "Bench Press", use "bp_bar". If "Squat", use "sq_bar" (or similar from list).
                - Keep responses concise and use Markdown.
                - Language: ${lang === 'es' ? 'Spanish' : 'English'}.
            `;

            const history = messages.map(m => ({
                role: m.role,
                parts: [{ text: m.text }]
            }));

            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: [
                    ...history,
                    { role: 'user', parts: [{ text }] }
                ],
                config: {
                    systemInstruction,
                    temperature: 0.5,
                    tools: [{ functionDeclarations: [createProgramTool, modifyDayTool] }]
                }
            });

            const functionCalls = response.functionCalls;
            let aiResponseText = response.text || "";
            
            if (functionCalls && functionCalls.length > 0) {
                for (const call of functionCalls) {
                    if (call.name === 'createWorkoutPlan') {
                        const args = call.args as any;
                        const newProgram: ProgramDay[] = (args.days || []).map((day: any, idx: number) => ({
                            id: `ai_d_${Date.now()}_${idx}`,
                            dayName: { en: day.dayName, es: day.dayName },
                            slots: (day.exercises || []).map((ex: any) => ({
                                muscle: ex.muscle.toUpperCase() as MuscleGroup,
                                setTarget: ex.sets || 3,
                                exerciseId: ex.exerciseId || undefined
                            }))
                        }));
                        setProgram(newProgram);
                        aiResponseText += `\n\n✅ ${lang==='en' ? 'Created new routine:' : 'Nueva rutina creada:'} **${args.programName}**`;
                    }
                    else if (call.name === 'modifyWorkoutDay') {
                        const args = call.args as any;
                        const idx = args.dayIndex;
                        const structure = args.newStructure;

                        if (program && program[idx]) {
                            const updatedDay: ProgramDay = {
                                ...program[idx],
                                dayName: { en: structure.dayName || program[idx].dayName.en, es: structure.dayName || program[idx].dayName.es },
                                slots: (structure.exercises || []).map((ex: any) => ({
                                    muscle: ex.muscle.toUpperCase() as MuscleGroup,
                                    setTarget: ex.sets || 3,
                                    exerciseId: ex.exerciseId || undefined
                                }))
                            };
                            setProgram(prev => {
                                const newProg = [...prev];
                                newProg[idx] = updatedDay;
                                return newProg;
                            });
                            aiResponseText += `\n\n✅ ${lang==='en' ? `Updated Day ${idx + 1}.` : `Día ${idx + 1} actualizado.`}`;
                        } else {
                            aiResponseText += `\n\n⚠️ Error: Day ${idx + 1} not found.`;
                        }
                    }
                }
            }

            if (aiResponseText) {
                setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: aiResponseText }]);
            } else {
                setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: "Done." }]);
            }

        } catch (error: any) {
            console.error("AI Error:", error);
            // Clean up error message if it's the standard JS Error object string
            let errorMsg = error.message || String(error);
            if (errorMsg.includes("GoogleGenAI")) errorMsg = "Connection Error";
            
            setMessages(prev => [...prev, { 
                id: Date.now().toString(), 
                role: 'model', 
                text: errorMsg 
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const formatMessage = (text: string) => {
        return text.split('\n').map((line, i) => {
            if (!line.trim()) return <div key={i} className="h-2"></div>;
            const parts = line.split(/(\*\*.*?\*\*)/g);
            return (
                <p key={i} className="mb-1">
                    {parts.map((part, j) => {
                        if (part.startsWith('**') && part.endsWith('**')) {
                            return <strong key={j} className="text-indigo-600 dark:text-indigo-400 font-bold">{part.slice(2, -2)}</strong>;
                        }
                        return <span key={j}>{part}</span>;
                    })}
                </p>
            );
        });
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-6" onClick={onClose}>
            <div 
                className="bg-white dark:bg-zinc-900 w-full sm:max-w-md h-[85vh] sm:h-[600px] rounded-t-3xl sm:rounded-3xl flex flex-col shadow-2xl border border-zinc-200 dark:border-white/10 overflow-hidden animate-slideUp" 
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-4 border-b border-zinc-100 dark:border-white/5 flex justify-between items-center bg-zinc-50/80 dark:bg-zinc-900/80 backdrop-blur">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                            <Icon name="Bot" size={24} fill="currentColor" />
                        </div>
                        <div>
                            <h3 className="font-black text-zinc-900 dark:text-white leading-none">IronCoach AI</h3>
                            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">Agent Mode Active</p>
                        </div>
                    </div>
                    <div className="flex gap-1">
                        <button onClick={handleClearChat} className="p-2 text-zinc-400 hover:text-red-500" title="Clear History">
                            <Icon name="Trash2" size={20} />
                        </button>
                        <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white">
                            <Icon name="X" size={24} />
                        </button>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50/50 dark:bg-black/20 scroll-container">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] rounded-2xl p-3.5 text-sm leading-relaxed shadow-sm ${
                                msg.role === 'user' 
                                ? 'bg-zinc-900 dark:bg-white text-white dark:text-black rounded-tr-sm' 
                                : 'bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-100 dark:border-white/5 rounded-tl-sm'
                            }`}>
                                {formatMessage(msg.text)}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-white dark:bg-zinc-800 p-3 rounded-2xl rounded-tl-sm border border-zinc-100 dark:border-white/5 flex gap-1.5 items-center">
                                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></div>
                                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce delay-75"></div>
                                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce delay-150"></div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Quick Prompts - Now Localized */}
                {messages.length < 3 && (
                    <div className="px-4 py-2 flex gap-2 overflow-x-auto scroll-container">
                        {t.aiPrompts.map((qp: any, i: number) => (
                            <button 
                                key={i}
                                onClick={() => handleSend(qp.prompt)}
                                className="whitespace-nowrap px-3 py-1.5 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:border-indigo-500 hover:text-indigo-500 transition-colors"
                            >
                                {qp.label}
                            </button>
                        ))}
                    </div>
                )}

                {/* Input */}
                <div className="p-4 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-white/5">
                    <div className="relative flex items-center gap-2">
                        <input 
                            type="text" 
                            className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-xl pl-4 pr-12 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500 text-zinc-900 dark:text-white placeholder-zinc-400"
                            placeholder={lang === 'en' ? "Ask IronCoach..." : "Pregunta a IronCoach..."}
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSend()}
                            disabled={isLoading}
                        />
                        <button 
                            onClick={() => handleSend()}
                            disabled={!input.trim() || isLoading}
                            className="absolute right-2 p-1.5 bg-indigo-600 rounded-lg text-white disabled:opacity-50 hover:bg-indigo-500 transition-colors"
                        >
                            <Icon name="CornerDownRight" size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
