# Security Report - PipeTakeoff

## Overview
PipeTakeoff is a proof-of-concept web application for AI-powered materials takeoff from construction piping PDFs. This document outlines security considerations, known vulnerabilities, and recommendations.

## Architecture Security

### API Key Handling
- **Current Implementation**: OpenAI API keys are stored in browser localStorage and passed per-request to the backend
- **Risk Level**: Low-Medium
- **Details**:
  - Keys never persist on the server
  - Keys are transmitted over HTTPS in request body
  - localStorage is vulnerable to XSS attacks
- **Recommendation for Production**: Use server-side key management with Azure Key Vault or similar

### File Upload Security
- **Current Implementation**:
  - File size limited to 50MB
  - File type validation (PDF only) on both client and server
  - Files processed in-memory, not persisted to disk
  - Session-based storage with 30-minute auto-cleanup
- **Risk Level**: Low
- **Mitigations in Place**:
  - Content-type validation
  - In-memory processing prevents file system attacks
  - Automatic session expiration

### CORS Configuration
- **Current Implementation**: Configured via `AllowedOrigins` in appsettings.json
- **Development Default**: `http://localhost:5173`
- **Recommendation for Production**: Restrict to specific production domains only

### Security Headers
The following headers are implemented in `Program.cs`:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Content-Security-Policy: default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'`

## Known Vulnerabilities

### 1. SixLabors.ImageSharp - Moderate Severity
- **CVE**: GHSA-rxmq-m78w-7wmc
- **Package Version**: 3.1.7
- **Severity**: Moderate
- **Description**: Potential denial of service via malformed image processing
- **Mitigation**:
  - Input validation on uploaded files
  - File size limits
  - Session timeouts prevent resource exhaustion
- **Recommendation**: Monitor for ImageSharp updates and upgrade when patch available

### 2. Dependabot Alert
- **Source**: GitHub detected 1 moderate vulnerability
- **URL**: https://github.com/timames/PipeTakeoff/security/dependabot/1
- **Action Required**: Review and address per Dependabot recommendations

## Data Flow Security

```
[Browser] --HTTPS--> [.NET API] --HTTPS--> [OpenAI API]
    |                     |
    |                     +-- PDF processed in-memory only
    |                     +-- Images stored in ConcurrentDictionary
    |                     +-- 30-min auto-cleanup
    |
    +-- API key in localStorage (client-side only)
    +-- Materials data in React state (not persisted)
```

## Authentication & Authorization
- **Current Implementation**: None (POC design)
- **Risk Level**: High for production deployment
- **Recommendation for Production**:
  - Implement Azure AD / Entra ID authentication
  - Add role-based access control
  - Audit logging for all operations

## Input Validation

### PDF Upload Endpoint
- File extension validation
- Content-type header validation
- Maximum file size: 50MB
- Processed via Docnet.Core (PDFium-based)

### Analysis Endpoint
- API key presence validation
- Session ID validation
- Page number bounds checking

### Export Endpoints
- Material items validated before export
- ClosedXML sanitizes cell content

## Recommendations for Production

### High Priority
1. Implement authentication (Azure AD recommended)
2. Move API key management to server-side with Key Vault
3. Add request rate limiting
4. Implement audit logging
5. Add input sanitization for all user-editable fields

### Medium Priority
1. Implement HTTPS certificate pinning
2. Add Content Security Policy nonce for inline scripts
3. Implement request signing for API calls
4. Add session management with secure tokens
5. Database-backed session storage (replace in-memory)

### Low Priority
1. Add penetration testing
2. Implement security scanning in CI/CD
3. Add dependency vulnerability scanning automation
4. Create incident response procedures

## Compliance Considerations

### For CMMC/CUI Environments
This POC is **NOT** suitable for CUI data without:
- Full authentication implementation
- Audit logging
- Data encryption at rest
- Access control policies
- GCC High endpoint configuration for any Azure services

### OWASP Top 10 Checklist
| Vulnerability | Status | Notes |
|--------------|--------|-------|
| A01: Broken Access Control | ⚠️ POC | No auth implemented |
| A02: Cryptographic Failures | ✅ | HTTPS for all transmissions |
| A03: Injection | ✅ | Parameterized queries, input validation |
| A04: Insecure Design | ✅ | Secure architecture patterns |
| A05: Security Misconfiguration | ✅ | Security headers configured |
| A06: Vulnerable Components | ⚠️ | ImageSharp moderate CVE |
| A07: Auth Failures | ⚠️ POC | No auth implemented |
| A08: Data Integrity Failures | ✅ | Input validation in place |
| A09: Logging Failures | ⚠️ POC | Basic logging only |
| A10: SSRF | ✅ | No server-side URL fetching |

## Version Information
- .NET Version: 9.0
- ImageSharp: 3.1.7
- Docnet.Core: 2.6.0
- ClosedXML: 0.104.2
- React: 19.x
- Vite: 6.x

## Contact
For security concerns, contact the repository maintainer.

---
*Last Updated: December 2025*
