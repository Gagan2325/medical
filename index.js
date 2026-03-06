import 'dotenv/config';
import express from 'express';
import OpenAI from "openai";
import axios from "axios";

const app = express();
const PORT = process.env.PORT || 3000;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.use(express.json({ limit: "1mb" }));
app.use(express.static('public'));


/* --------------------------------------------------
   TRUSTED MEDICAL DOMAINS
-------------------------------------------------- */

const TRUSTED_SITES = [
  "who.int",
  "cdc.gov",
  "nih.gov",
  "nejm.org",
  "thelancet.com",
  "pubmed.ncbi.nlm.nih.gov",
  "mayoclinic.org",
  "medlineplus.gov"
];


/* --------------------------------------------------
   CLEAN CONTENT FROM SEARCH
-------------------------------------------------- */

function cleanContent(text) {
  if (!text) return "";

  return text
    .replace(/\s+/g, " ")
    .replace(/\[[^\]]*\]/g, "")
    .replace(/\(.*?copyright.*?\)/gi, "")
    .trim()
    .slice(0, 1200);
}


/* --------------------------------------------------
   SEARCH MEDICAL SOURCES (TAVILY)
-------------------------------------------------- */

async function searchMedicalSources(query) {

  try {

    const siteFilter = TRUSTED_SITES
      .map(site => `site:${site}`)
      .join(" OR ");

    const response = await axios.post(
      "https://api.tavily.com/search",
      {
        api_key: process.env.TAVILY_API_KEY,
        query: `${query} ${siteFilter}`,
        search_depth: "advanced",
        include_answer: false,
        include_images: false,
        max_results: 8
      },
      {
        timeout: 20000
      }
    );

    const results = response.data.results || [];

    /* Remove duplicate URLs */

    const seen = new Set();
    const unique = [];

    for (const r of results) {
      if (!seen.has(r.url)) {
        seen.add(r.url);

        unique.push({
          title: r.title,
          url: r.url,
          content: cleanContent(r.content)
        });
      }
    }

    return unique.slice(0, 6);

  } catch (error) {

    console.error("Search error:", error.message);
    return [];

  }
}


/* --------------------------------------------------
   GENERATE MEDICAL ARTICLE
-------------------------------------------------- */

async function generateMedicalArticle(topic) {

  const searchResults = await searchMedicalSources(topic);

  if (!searchResults.length) {
    throw new Error("No medical sources found.");
  }

  const sources = searchResults.map((r, i) => ({
    number: i + 1,
    title: r.title || "Medical Source",
    url: r.url,
    content: r.content
  }));


  /* Build context for GPT */

  const context = sources
    .map(s => `
SOURCE ${s.number}
Title: ${s.title}
URL: ${s.url}
Content:
${s.content}
`)
    .join("\n\n");


  const prompt = `
You are a professional medical researcher.

Write a comprehensive medical article using ONLY the provided sources.

STRICT RULES
- Every sentence must include citations [1], [2]
- Use ONLY the provided sources
- Never invent medical facts
- Combine citations when supported by multiple sources
- If information is not in the sources, skip it

STYLE
- Professional medical tone
- Evidence-based writing
- Organize information naturally based on the sources
- Use headings as appropriate for the topic
- Clear paragraphs
- Concise language
- No filler content

SOURCES
${context}

TOPIC
${topic}
`;


  const response = await openai.chat.completions.create({

    model: "gpt-4.1",

    messages: [
      {
        role: "system",
        content:
          "You are a strict medical research assistant that writes evidence-based articles with citations."
      },
      {
        role: "user",
        content: prompt
      }
    ],

    temperature: 0.2

  });


  return {
    article: response.choices[0].message.content,
    sources
  };
}



/* --------------------------------------------------
   ROUTES
-------------------------------------------------- */

app.get('/', (req, res) => {
  res.sendFile('index.html', { root: 'public' });
});


app.get('/api', (req, res) => {

  res.json({
    name: 'Medical Research Assistant API',
    version: '1.1.0',
    description: 'AI-powered medical article generation from trusted sources',
    endpoints: {
      '/': 'Web interface',
      '/api': 'API information',
      '/api/generate': 'POST { topic }'
    },
    trusted_sources: TRUSTED_SITES
  });

});


app.post('/api/generate', async (req, res) => {

  try {

    const { topic } = req.body;

    if (!topic || topic.length < 3) {
      return res.status(400).json({
        error: "Valid topic is required"
      });
    }

    const result = await generateMedicalArticle(topic);

    res.json(result);

  } catch (error) {

    console.error("Generation error:", error);

    res.status(500).json({
      error: "Failed to generate article"
    });

  }

});


/* --------------------------------------------------
   START SERVER
-------------------------------------------------- */

if (process.env.NODE_ENV !== 'production') {

  app.listen(PORT, () => {
    console.log(`🩺 Medical Research Assistant running at http://localhost:${PORT}`);
  });

}

export default app;