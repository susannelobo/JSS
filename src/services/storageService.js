// services/storageService.js
const { BlobServiceClient } = require('@azure/storage-blob');
const { v4: uuidv4 } = require('uuid');
const { TextAnalyticsClient, AzureKeyCredential } = require("@azure/ai-text-analytics");
const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const fs = require('fs');
const path = require('path');

// Azure Storage configuration
const blobServiceClient = BlobServiceClient.fromConnectionString(
  process.env.AZURE_STORAGE_CONNECTION_STRING
);
const containerClient = blobServiceClient.getContainerClient(process.env.STORAGE_CONTAINER_NAME);

// Text Analytics for extracting text from images (if applicable)
const textAnalyticsClient = new TextAnalyticsClient(
  process.env.AZURE_AI_ENDPOINT,
  new AzureKeyCredential(process.env.AZURE_AI_KEY)
);

// Upload file to Azure Blob Storage
async function uploadFile(file) {
  const blobName = `${uuidv4()}-${file.originalname}`;
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  
  // Upload the file
  await blockBlobClient.uploadFile(file.path);
  
  // Extract text based on file type
  let extractedText = '';
  
  try {
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    if (fileExtension === '.pdf') {
      const dataBuffer = fs.readFileSync(file.path);
      const pdfData = await pdf(dataBuffer);
      extractedText = pdfData.text;
    } 
    else if (fileExtension === '.docx') {
      const result = await mammoth.extractRawText({ path: file.path });
      extractedText = result.value;
    }
    else if (['.txt', '.md', '.csv'].includes(fileExtension)) {
      extractedText = fs.readFileSync(file.path, 'utf8');
    }
    // For image files, you could use Azure AI Vision services here
  } catch (error) {
    console.error("Error extracting text:", error);
  }
  
  // Clean up the temporary file
  fs.unlinkSync(file.path);
  
  return {
    filename: file.originalname,
    blobName: blobName,
    contentType: file.mimetype,
    url: blockBlobClient.url,
    extractedText: extractedText
  };
}

module.exports = {
  uploadFile
};