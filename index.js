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

  const sources = searchResults.map((r, i) => ({
    number: i + 1,
    title: r.title || 'Medical Source',
    url: r.url,
    content: r.content
  }));

  const context = sources.map(s => 
    `[${s.number}] ${s.content}\nTitle: ${s.title}\nURL: ${s.url}`
  ).join("\n\n");

  const prompt = `You are a medical research assistant writing evidence-based content.

CRITICAL RULES:
1. Use ONLY information from the provided sources below
2. Every factual statement MUST have an inline citation [1], [2], etc.
3. Use multiple citations [1][2] when multiple sources support the same point
4. Be precise - cite the specific source for each claim
5. DO NOT make up information or sources

When writing:
- Start each major section with ## heading
- Use ### for subsections if needed
- Professional medical writing style
- Accessible to educated non-specialists
- Include specific details (symptoms, treatments, statistics) from sources with citations

Sources:
${context}

Topic: ${topic}

Required Structure:
## Overview
[Introduction to the condition with citations]

## Causes and Risk Factors
[What causes it, risk factors - all cited]

## Symptoms and Signs
[Clinical presentation - all cited]

## Diagnosis
[How it's diagnosed - cited]

## Treatment Options
[Current treatments - cited]

## Prevention and Management
[Preventive measures - cited]

## References
[List all sources in numbered format with full titles and URLs]`;

  const response = await openai.chat.completions.create({
    model: "gpt-4.1",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3
  });

  return {
    article: response.choices[0].message.content,
    sources: sources
  };
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

    const result = await generateMedicalArticle(topic);
    res.json(result);
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