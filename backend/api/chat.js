const axios = require('axios');

// Environment variable from Vercel
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const URL = 'https://openrouter.ai/api/v1/chat/completions';

// Available free models
const MODELS = [
  { id: 'google/gemma-4-31b-it', name: 'Gemma 4 31B', emoji: '🧠', color: '#4285f4' },
  { id: 'qwen/qwen3.6-plus-preview:free', name: 'Qwen 3.6 Plus', emoji: '🐉', color: '#ff6b35' },
  { id: 'openai/gpt-oss-120b', name: 'GPT-OSS-120B', emoji: '🤖', color: '#10a37f' },
  { id: 'nvidia/nemotron-3-super', name: 'NVIDIA Nemotron 3', emoji: '💚', color: '#76b900' },
  { id: 'z-ai/glm-4.5-air', name: 'GLM-4.5-Air', emoji: '🔥', color: '#667eea' },
  { id: 'deepseek/deepseek-chat', name: 'DeepSeek', emoji: '🔍', color: '#4a90e2' },
  { id: 'mistralai/mistral-7b-instruct', name: 'Mistral 7B', emoji: '🌊', color: '#f7b32b' }
];

// Improve prompt using AI
async function improvePrompt(userPrompt) {
  const improvementPrompt = `Improve this user prompt. Add role, context, and format requirements. Return ONLY the improved prompt, no explanation.\nOriginal: ${userPrompt}`;
  
  try {
    const response = await axios.post(URL, {
      model: 'openai/gpt-3.5-turbo',
      messages: [{ role: 'user', content: improvementPrompt }],
      temperature: 0.5,
      max_tokens: 500
    }, {
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 15000
    });
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Prompt improvement failed:', error.message);
    return userPrompt;
  }
}

// Chat with specific model
async function askModel(modelId, message) {
  try {
    const response = await axios.post(URL, {
      model: modelId,
      messages: [
        { 
          role: 'system', 
          content: 'You are a helpful AI. Provide clear, accurate, detailed responses.'
        },
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      max_tokens: 800
    }, {
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
    
    return {
      success: true,
      content: response.data.choices[0].message.content,
      usage: response.data.usage
    };
  } catch (error) {
    console.error(`Error with model ${modelId}:`, error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { message, models, improve = false } = req.body;
  
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }
  
  try {
    let finalMessage = message;
    
    // Improve prompt if requested
    if (improve) {
      finalMessage = await improvePrompt(message);
    }
    
    // Select which models to query
    const modelsToQuery = models || MODELS.map(m => m.id);
    const modelDetails = MODELS.filter(m => modelsToQuery.includes(m.id));
    
    if (modelDetails.length === 0) {
      return res.status(400).json({ error: 'No valid models selected' });
    }
    
    // Query all models in parallel
    const promises = modelDetails.map(model => 
      askModel(model.id, finalMessage).then(result => ({
        model: model.name,
        modelId: model.id,
        emoji: model.emoji,
        color: model.color,
        ...result
      }))
    );
    
    const results = await Promise.all(promises);
    
    return res.status(200).json({
      success: true,
      originalPrompt: message,
      improvedPrompt: improve ? finalMessage : null,
      responses: results,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
