// routes/fileUpload.js
const express = require('express');
const multer = require('multer');
const { uploadFile } = require('../services/storageService');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 } // Limit to 10MB
});

// Store file metadata in memory (for a production app, use a database)
let uploadedFiles = [];

// Route for uploading files
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const fileInfo = await uploadFile(req.file);
    uploadedFiles.push(fileInfo);
    
    res.status(200).json(fileInfo);
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// Get all uploaded files
router.get('/', (req, res) => {
  res.json(uploadedFiles.map(file => ({
    filename: file.filename,
    url: file.url,
    contentType: file.contentType
  })));
});

// Get file context for AI queries
router.get('/context', (req, res) => {
  const context = uploadedFiles
    .map(file => `${file.filename}:\n${file.extractedText}`)
    .join('\n\n');
  
  res.json({ context });
});

module.exports = router;