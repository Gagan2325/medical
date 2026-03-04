import 'dotenv/config';
import express from 'express';
import OpenAI from "openai";
import axios from "axios";

const app = express();
const PORT = 3000;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(express.json());
app.use(express.static('public'));

async function searchMedicalSources(query) {
  const response = await axios.post(
    "https://api.tavily.com/search",
    {
      api_key: process.env.TAVILY_API_KEY,
      query: query + " site:who.int OR site:cdc.gov OR site:nih.gov OR site:nejm.org OR site:thelancet.com OR site:pubmed.ncbi.nlm.nih.gov",
      search_depth: "advanced",
      max_results: 5
    }
  );

  return response.data.results;
}

async function generateMedicalArticle(topic) {
  const searchResults = await searchMedicalSources(topic);

  const context = searchResults.map((r, i) => 
    `[${i+1}] ${r.content}\nSource: ${r.url}`
  ).join("\n\n");

  const prompt = `
  You are a medical research assistant.
  Using ONLY the provided sources below, write a structured medical article.

  - Use inline citations like [1], [2].
  - Do NOT invent sources.
  - Cite statements precisely.
  - Professional but accessible tone.

  Sources:
  ${context}

  Topic: ${topic}

  Structure:
  - Overview
  - Causes / Mechanism
  - Symptoms
  - Diagnosis
  - Treatment
  - Prevention
  - References (numbered with links)
  `;

  const response = await openai.chat.completions.create({
    model: "gpt-4.1",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3
  });

  return response.choices[0].message.content;
}

// Default GET route
app.get('/', (req, res) => {
  res.sendFile('index.html', { root: 'public' });
});

// API info endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'Medical Research Assistant API',
    version: '1.0.0',
    description: 'AI-powered medical article generation from trusted sources',
    endpoints: {
      '/': 'Web interface',
      '/api': 'API information',
      '/api/generate': 'POST - Generate medical article (requires: { topic: string })'
    },
    sources: ['WHO', 'CDC', 'NIH', 'NEJM', 'The Lancet', 'PubMed']
  });
});

app.post('/api/generate', async (req, res) => {
  try {
    const { topic } = req.body;
    
    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }

    const article = await generateMedicalArticle(topic);
    res.json({ article });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Only listen on port in local development
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🩺 Medical Research Assistant running at http://localhost:${PORT}`);
  });
}

// Export for Vercel serverless
export default app;