// services/aiService.js
const { OpenAIClient, AzureKeyCredential } = require("@azure/openai");

// Configure Azure OpenAI Service connection
const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
const apiKey = process.env.AZURE_OPENAI_KEY;
const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT;

const client = new OpenAIClient(endpoint, new AzureKeyCredential(apiKey));

// Function to ask AI about documents
async function askAboutDocuments(question, context) {
  try {
    const messages = [
      { role: "system", content: "You are an AI assistant that helps with documents and files." },
      { role: "user", content: `Context from uploaded files: ${context}\n\nQuestion: ${question}` }
    ];

    const response = await client.getChatCompletions(deploymentName, messages);
    return response.choices[0].message.content;
  } catch (error) {
    console.error("Error calling Azure OpenAI:", error);
    throw new Error("Failed to process your question");
  }
}

// Function for regular chat without document context
async function chatWithAI(messages) {
  try {
    const response = await client.getChatCompletions(deploymentName, messages);
    return response.choices[0].message;
  } catch (error) {
    console.error("Error calling Azure OpenAI:", error);
    throw new Error("Failed to process your question");
  }
}

module.exports = {
  askAboutDocuments,
  chatWithAI
};