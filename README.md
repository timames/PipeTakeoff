# PipeTakeoff

AI-powered materials takeoff from construction piping PDFs using GPT-4o vision.

## Features

- **PDF Upload** - Drag-and-drop PDF upload with page preview and navigation
- **AI Analysis** - GPT-4o vision extracts pipe, fittings, valves, and equipment from drawings
- **Editable Results** - Inline editing, add/delete rows, category grouping with subtotals
- **Export** - Download takeoff as Excel or CSV

## Quick Start

### Prerequisites
- .NET 9 SDK
- Node.js 20+
- OpenAI API key with GPT-4o access

### Run Locally

```bash
# Clone
git clone https://github.com/timames/PipeTakeoff.git
cd PipeTakeoff

# Backend (Terminal 1)
cd src/PipeTakeoff.API
dotnet run

# Frontend (Terminal 2)
cd src/pipetakeoff-web
npm install
npm run dev
```

Open http://localhost:5173, enter your API key in Settings, upload a PDF, and click Analyze.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | .NET 9 Minimal APIs |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS |
| PDF Processing | Docnet.Core (PDFium) |
| AI | OpenAI GPT-4o Vision API |
| Data Grid | TanStack Table |
| Excel Export | ClosedXML |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload` | Upload PDF, returns sessionId and pageCount |
| GET | `/api/upload/{sessionId}/page/{n}` | Get page as PNG image |
| POST | `/api/analysis` | Analyze page with GPT-4o |
| POST | `/api/export/excel` | Export materials to Excel |
| POST | `/api/export/csv` | Export materials to CSV |

## Sample PDFs

The `samples/` folder includes test drawings:
- `nist-plumbing.pdf` - NIST reference building plumbing (62 pages)
- `edraw-plumbing.pdf` - EdrawMax plumbing examples (29 pages)

## Documentation

- [DEVELOPMENT.md](DEVELOPMENT.md) - Setup, testing, and troubleshooting guide
- [SECURITY.md](SECURITY.md) - Security considerations and recommendations

## License

MIT
