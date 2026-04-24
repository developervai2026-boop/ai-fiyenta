import React, { useState } from 'react';
import './App.css';

function App() {
  const [message, setMessage] = useState('');
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [improvePrompt, setImprovePrompt] = useState(true);
  const [selectedModels, setSelectedModels] = useState([
    'google/gemma-4-31b-it',
    'qwen/qwen3.6-plus-preview:free',
    'openai/gpt-oss-120b',
    'nvidia/nemotron-3-super',
    'z-ai/glm-4.5-air'
  ]);
  
  const availableModels = [
    { id: 'google/gemma-4-31b-it', name: 'Gemma 4 31B', emoji: '🧠', color: '#4285f4', free: true },
    { id: 'qwen/qwen3.6-plus-preview:free', name: 'Qwen 3.6 Plus', emoji: '🐉', color: '#ff6b35', free: true },
    { id: 'openai/gpt-oss-120b', name: 'GPT-OSS-120B', emoji: '🤖', color: '#10a37f', free: true },
    { id: 'nvidia/nemotron-3-super', name: 'NVIDIA Nemotron 3', emoji: '💚', color: '#76b900', free: true },
    { id: 'z-ai/glm-4.5-air', name: 'GLM-4.5-Air', emoji: '🔥', color: '#667eea', free: true },
    { id: 'deepseek/deepseek-chat', name: 'DeepSeek', emoji: '🔍', color: '#4a90e2', free: true },
    { id: 'mistralai/mistral-7b-instruct', name: 'Mistral 7B', emoji: '🌊', color: '#f7b32b', free: true }
  ];
  
  const toggleModel = (modelId) => {
    if (selectedModels.includes(modelId)) {
      setSelectedModels(selectedModels.filter(id => id !== modelId));
    } else {
      setSelectedModels([...selectedModels, modelId]);
    }
  };
  
  const sendMessage = async () => {
    if (!message.trim()) return;
    
    setLoading(true);
    setResponses([]);
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          models: selectedModels,
          improve: improvePrompt
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setResponses(data.responses);
      } else {
        console.error('Error:', data.error);
        alert('Error: ' + data.error);
      }
    } catch (error) {
      console.error('Request failed:', error);
      alert('Failed to connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="app">
      <header className="header">
        <h1>🔥 AI Fiesta Clone</h1>
        <p>Chat with 7+ AI Models Simultaneously | 100% Free</p>
      </header>
      
      <div className="main-container">
        <div className="sidebar">
          <h3>🤖 Select AI Models</h3>
          {availableModels.map(model => (
            <label key={model.id} className="model-checkbox">
              <input
                type="checkbox"
                checked={selectedModels.includes(model.id)}
                onChange={() => toggleModel(model.id)}
              />
              <span style={{ color: model.color }}>
                {model.emoji} {model.name} {model.free && <small style={{color:'green'}}>(Free)</small>}
              </span>
            </label>
          ))}
          
          <div className="settings">
            <label className="improve-checkbox">
              <input
                type="checkbox"
                checked={improvePrompt}
                onChange={(e) => setImprovePrompt(e.target.checked)}
              />
              ✨ Auto-improve my prompt
            </label>
          </div>
          
          <div className="stats">
            <h4>📊 Stats</h4>
            <p>Selected Models: {selectedModels.length}</p>
            <p>Status: {loading ? '🚀 Processing...' : '✅ Ready'}</p>
            <p>💡 Tip: Each model gives different perspective!</p>
          </div>
        </div>
        
        <div className="chat-area">
          <div className="input-area">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask anything to 7+ AI models at once... Example: Explain quantum computing in simple terms"
              rows="3"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />
            <button onClick={sendMessage} disabled={loading || !message.trim()}>
              {loading ? '🚀 Getting Responses from All AIs...' : '💬 Send to All AIs'}
            </button>
          </div>
          
          {responses.length > 0 && (
            <div className="responses-grid">
              {responses.map((resp, idx) => (
                <div key={idx} className="response-card">
                  <div className="response-header" style={{ background: `linear-gradient(135deg, ${resp.color || '#667eea'}, ${resp.color || '#764ba2'})` }}>
                    <span className="model-name">
                      {resp.emoji} {resp.model}
                    </span>
                    {resp.success && (
                      <span className="badge">✓ {resp.usage?.total_tokens || 0} tokens</span>
                    )}
                  </div>
                  <div className="response-content">
                    {resp.success ? (
                      <div className="response-text">{resp.content}</div>
                    ) : (
                      <div className="error-text">❌ Error: {resp.error}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
