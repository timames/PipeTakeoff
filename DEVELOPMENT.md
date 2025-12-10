# Development & Testing Guide - PipeTakeoff

## Prerequisites

### Required Software
- **Windows 10/11** (x64)
- **.NET 9 SDK** - [Download](https://dotnet.microsoft.com/download/dotnet/9.0)
- **Node.js 20+** - [Download](https://nodejs.org/)
- **Git** - [Download](https://git-scm.com/downloads)
- **OpenAI API Key** - [Get API Key](https://platform.openai.com/api-keys)

### Verify Installation
```powershell
dotnet --version    # Should show 9.0.x
node --version      # Should show v20.x or higher
npm --version       # Should show 10.x or higher
git --version       # Any recent version
```

## Quick Start

### 1. Clone Repository
```powershell
git clone https://github.com/timames/PipeTakeoff.git
cd PipeTakeoff
```

### 2. Start Backend API
```powershell
cd src/PipeTakeoff.API
dotnet restore
dotnet run
```
- API runs at: http://localhost:5197
- Swagger UI: http://localhost:5197/swagger
- Health check: http://localhost:5197/health

### 3. Start Frontend (New Terminal)
```powershell
cd src/pipetakeoff-web
npm install
npm run dev
```
- Frontend runs at: http://localhost:5173
- Opens in default browser automatically

### 4. Configure API Key
1. Open http://localhost:5173
2. Click **Settings** tab
3. Enter your OpenAI API key
4. Key is stored in browser localStorage

## Testing the Application

### Test 1: PDF Upload
1. Go to **Upload** tab
2. Drag and drop a PDF or click to browse
3. Sample PDFs included in `samples/` folder:
   - `nist-plumbing.pdf` (62 pages, 6.6MB)
   - `edraw-plumbing.pdf` (29 pages, 2.3MB)
4. Verify page count displays correctly
5. Navigate through pages using arrows

### Test 2: Drawing Analysis
1. Upload a PDF
2. Navigate to a page with piping details
3. Click **Analyze Page**
4. Wait for GPT-4o to process (10-30 seconds)
5. Verify materials table populates

### Test 3: Edit Materials
1. After analysis, click any quantity cell
2. Edit the value
3. Press Enter or click outside to save
4. Add new row using **Add Item** button
5. Delete rows using trash icon

### Test 4: Export
1. With materials in the table
2. Click **Export** dropdown
3. Select **Excel** or **CSV**
4. Verify file downloads correctly

## API Endpoints Testing

### Using Swagger UI
Navigate to http://localhost:5197/swagger for interactive API testing.

### Using curl

**Upload PDF:**
```powershell
curl -X POST "http://localhost:5197/api/upload" -F "file=@samples/edraw-plumbing.pdf"
```
Response:
```json
{"sessionId":"abc123...","fileName":"edraw-plumbing.pdf","pageCount":29}
```

**Get Page Image:**
```powershell
curl -o page1.png "http://localhost:5197/api/upload/{sessionId}/page/1"
```

**Analyze Page:**
```powershell
curl -X POST "http://localhost:5197/api/analysis" ^
  -H "Content-Type: application/json" ^
  -d "{\"sessionId\":\"{sessionId}\",\"pageNumber\":1,\"apiKey\":\"sk-...\"}"
```

**Export to Excel:**
```powershell
curl -X POST "http://localhost:5197/api/export/excel" ^
  -H "Content-Type: application/json" ^
  -d "{\"materials\":[...],\"fileName\":\"takeoff\"}" ^
  -o takeoff.xlsx
```

## Development Workflow

### Project Structure
```
PipeTakeoff/
├── src/
│   ├── PipeTakeoff.API/          # .NET 9 Backend
│   │   ├── Configuration/        # Options classes
│   │   ├── Endpoints/            # Minimal API endpoints
│   │   ├── Models/               # Data models
│   │   ├── Services/             # Business logic
│   │   └── Program.cs            # App entry point
│   │
│   └── pipetakeoff-web/          # React Frontend
│       ├── src/
│       │   ├── components/       # React components
│       │   ├── hooks/            # Custom hooks
│       │   ├── services/         # API client
│       │   └── types/            # TypeScript types
│       └── package.json
│
├── samples/                      # Sample PDFs for testing
├── SECURITY.md                   # Security documentation
├── DEVELOPMENT.md                # This file
└── PipeTakeoff.sln              # Solution file
```

### Making Changes

**Backend Changes:**
```powershell
# Stop running server (Ctrl+C)
# Make changes
dotnet build                     # Check for errors
dotnet run                       # Restart server
```

**Frontend Changes:**
- Vite hot-reloads automatically
- For major changes, restart with `npm run dev`

### Build for Production

**Backend:**
```powershell
cd src/PipeTakeoff.API
dotnet publish -c Release -o ../../publish/api
```

**Frontend:**
```powershell
cd src/pipetakeoff-web
npm run build
# Output in dist/ folder
```

## Troubleshooting

### Common Issues

**"Port 5197 already in use"**
```powershell
netstat -ano | findstr :5197
taskkill /PID <pid> /F
```

**"npm install fails"**
```powershell
rd /s /q node_modules
del package-lock.json
npm cache clean --force
npm install
```

**"PDF upload fails"**
- Check file size < 50MB
- Verify PDF is not corrupted
- Check browser console for errors

**"Analysis returns error"**
- Verify OpenAI API key is valid
- Check API key has billing/credits
- Check backend logs in terminal

**"Tailwind styles not loading"**
```powershell
npm run build
npm run dev
```

### Viewing Logs

**Backend Logs:**
Visible in terminal running `dotnet run`

**Frontend Logs:**
Open browser DevTools (F12) → Console tab

## Environment Configuration

### appsettings.json (Backend)
```json
{
  "OpenAi": {
    "Endpoint": "https://api.openai.com/v1/chat/completions",
    "DefaultModel": "gpt-4o",
    "MaxTokens": 4096
  },
  "AllowedOrigins": ["http://localhost:5173"]
}
```

### vite.config.ts (Frontend)
```typescript
export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:5197'
    }
  }
})
```

## Testing Checklist

- [ ] Backend starts without errors
- [ ] Frontend starts without errors
- [ ] Swagger UI loads at /swagger
- [ ] Health endpoint returns healthy
- [ ] PDF upload works (both sample files)
- [ ] Page navigation works
- [ ] Zoom controls work
- [ ] Settings saves API key
- [ ] Analysis returns materials (requires valid API key)
- [ ] Table editing works
- [ ] Add/delete rows works
- [ ] Excel export downloads file
- [ ] CSV export downloads file

## Performance Notes

- PDF processing: ~1-3 seconds per page
- GPT-4o analysis: ~10-30 seconds per page
- Large PDFs (50+ pages): Initial upload may take 10-20 seconds
- Sessions auto-expire after 30 minutes of inactivity

## Next Steps for Development

1. **Add authentication** - Integrate Azure AD
2. **Persist sessions** - Replace in-memory with database
3. **Batch analysis** - Analyze multiple pages at once
4. **Custom prompts** - Fine-tune prompts for specific drawing types
5. **History** - Save and reload previous takeoffs

---
*Last Updated: December 2025*
