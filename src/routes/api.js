// routes/api.js
const express = require('express');
const { askAboutDocuments, chatWithAI } = require('../services/aiService');

const router = express.Router();

// In-memory store for chat history (use a database for production)
const chatSessions = {};

// Route for document-based questions
router.post('/ask-document', async (req, res) => {
  try {
    const { question, context, sessionId } = req.body;
    
    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }
    
    const answer = await askAboutDocuments(question, context);
    
    // Store in chat history
    if (sessionId) {
      if (!chatSessions[sessionId]) {
        chatSessions[sessionId] = [];
      }
      
      chatSessions[sessionId].push({ 
        role: 'user', 
        content: question 
      });
      
      chatSessions[sessionId].push({ 
        role: 'assistant', 
        content: answer 
      });
    }
    
    res.json({ answer });
  } catch (error) {
    console.error('Error asking about documents:', error);
    res.status(500).json({ error: 'Failed to process your question' });
  }
});

// Route for general chat without documents
router.post('/chat', async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    // Get or create chat history
    if (!chatSessions[sessionId]) {
      chatSessions[sessionId] = [
        { role: "system", content: "You are a helpful AI assistant." }
      ];
    }
    
    // Add user message to history
    chatSessions[sessionId].push({ role: "user", content: message });
    
    // Get response
    const response = await chatWithAI(chatSessions[sessionId]);
    
    // Add response to history
    chatSessions[sessionId].push(response);
    
    res.json({ reply: response.content });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to process your message' });
  }
});

// Get chat history
router.get('/history/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const history = chatSessions[sessionId] || [];
  
  // Filter out system messages
  const userFacingHistory = history.filter(msg => msg.role !== 'system');
  
  res.json(userFacingHistory);
});

module.exports = router;