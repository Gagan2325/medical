# Medical Research Assistant 🩺

AI-powered medical article generation from trusted sources (WHO, CDC, NIH, NEJM, The Lancet, PubMed).

## Features

- 🔍 Searches verified medical sources
- 📝 Generates structured medical articles with citations
- 💊 Covers causes, symptoms, diagnosis, treatment, and prevention
- 🎨 Modern, responsive web interface
- 📋 Copy articles to clipboard
- 🔗 All references linked to original sources

## Tech Stack

- **Backend**: Node.js + Express
- **AI**: OpenAI GPT-4
- **Search**: Tavily API
- **Frontend**: HTML/CSS/JavaScript

## Local Development

### Prerequisites

- Node.js (v14 or higher)
- OpenAI API key
- Tavily API key

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd Perplexity
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
OPENAI_API_KEY=your_openai_api_key_here
TAVILY_API_KEY=your_tavily_api_key_here
```

4. Start the development server:
```bash
npm start
```

5. Open your browser and navigate to:
```
http://localhost:3000
```

## Deployment on Vercel

### Quick Deploy

1. Install Vercel CLI (optional):
```bash
npm install -g vercel
```

2. Deploy using Vercel CLI:
```bash
vercel
```

Or connect your GitHub repository to Vercel for automatic deployments.

### Environment Variables

Add these environment variables in your Vercel project settings:

- `OPENAI_API_KEY` - Your OpenAI API key
- `TAVILY_API_KEY` - Your Tavily API key

#### Setting up Environment Variables:

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables:
   - `OPENAI_API_KEY`
   - `TAVILY_API_KEY`
4. Redeploy your project

## API Endpoints

### POST `/api/generate`

Generates a medical article on the specified topic.

**Request Body:**
```json
{
  "topic": "Dry Eye"
}
```

**Response:**
```json
{
  "article": "Generated article content with citations..."
}
```

## Usage

1. Enter a medical topic in the search box (e.g., "Dry Eye", "Migraine", "Diabetes")
2. Click "Generate Article" or press Enter
3. Wait 10-30 seconds while the AI searches medical sources and generates the article
4. Read the structured article with inline citations
5. Use "Copy Article" to copy to clipboard or "New Search" to start over

## Project Structure

```
Perplexity/
├── index.js          # Express server and API endpoints
├── public/
│   └── index.html    # Frontend interface
├── .env              # Environment variables (not committed)
├── .gitignore        # Git ignore rules
├── vercel.json       # Vercel configuration
├── package.json      # Dependencies
└── README.md         # This file
```

## Dependencies

- `express` - Web framework
- `openai` - OpenAI API client
- `axios` - HTTP client for Tavily API
- `dotenv` - Environment variable management

## License

ISC

## Notes

- Articles are generated from verified medical sources only
- Citations are provided inline and in the references section
- All external links open in new tabs
- Mobile responsive design
