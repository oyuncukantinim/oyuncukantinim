import { useState } from 'react';
import { Bot, X, Send, MessageCircle } from 'lucide-react';

const callGeminiApi = async (prompt) => {
  const apiKey = "";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
  const payload = { contents: [{ parts: [{ text: prompt }] }] };

  let retries = 3;
  let delay = 1000;
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || "Bir sorun olustu.";
    } catch {
      if (i === retries - 1) return "Uzgunum, su an sunucu ile baglanti kuramiyorum.";
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2;
    }
  }
};

export default function KantinBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([{ sender: 'bot', text: 'Merhaba! Ben KantinBot. Sana nasil yardimci olabilirim?' }]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || typing) return;

    const userMsg = input.trim();
    const newMessages = [...messages, { sender: 'user', text: userMsg }];
    setMessages(newMessages);
    setInput('');
    setTyping(true);

    const prompt = `Sen Oyuncu Kantinim adli oyun pazaryerinde yapay zeka asistani 'KantinBot'sun. Yardımsever bir oyuncu dili kullan. Kullanicinin mesaji: "${userMsg}". Kisa ve ozlu cevap ver (maksimum 3-4 cumle).`;
    const responseText = await callGeminiApi(prompt);
    setMessages([...newMessages, { sender: 'bot', text: responseText }]);
    setTyping(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[150] flex flex-col items-end">
      {isOpen && (
        <div className="bg-white border border-gray-200 rounded-3xl shadow-2xl w-80 sm:w-96 mb-4 overflow-hidden flex flex-col h-[420px]">
          <div className="bg-gradient-to-r from-purple-600 to-cyan-500 p-4 text-white flex justify-between items-center">
            <div className="flex items-center gap-2 font-bold">
              <Bot size={20} /> KantinBot
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded-full transition-colors">
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 p-4 overflow-y-auto bg-gray-50 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-purple-600 text-white rounded-br-sm'
                    : 'bg-white border border-gray-200 text-gray-700 rounded-bl-sm shadow-sm'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {typing && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 text-gray-400 p-3 rounded-2xl rounded-bl-sm shadow-sm text-sm">
                  <span className="animate-pulse">Yazıyor...</span>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-100 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ne ariyorsun?"
              className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-purple-400 outline-none"
            />
            <button type="submit" disabled={typing || !input.trim()} className="bg-purple-600 text-white p-2 rounded-full hover:bg-purple-700 disabled:opacity-50 transition-colors">
              <Send size={18} />
            </button>
          </form>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`${isOpen ? 'bg-rose-500' : 'bg-gradient-to-r from-purple-600 to-cyan-500 animate-bounce'} text-white p-4 rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all`}
      >
        {isOpen ? <X size={28} /> : <MessageCircle size={28} />}
      </button>
    </div>
  );
}
