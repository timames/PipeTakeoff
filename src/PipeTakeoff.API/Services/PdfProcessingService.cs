using System.Collections.Concurrent;
using Docnet.Core;
using Docnet.Core.Models;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.PixelFormats;
using PipeTakeoff.API.Models;

namespace PipeTakeoff.API.Services;

public interface IPdfProcessingService
{
    Task<PdfUploadResult> ProcessPdfAsync(Stream pdfStream, string fileName);
    Task<byte[]?> GetPageImageAsync(string sessionId, int pageNumber);
    Task<string> GetPageAsBase64Async(string sessionId, int pageNumber);
}

public class PdfProcessingService : IPdfProcessingService, IDisposable
{
    private readonly ILogger<PdfProcessingService> _logger;
    private static readonly ConcurrentDictionary<string, PdfSession> Sessions = new();
    private readonly Timer _cleanupTimer;
    private const int SessionTimeoutMinutes = 30;

    public PdfProcessingService(ILogger<PdfProcessingService> logger)
    {
        _logger = logger;
        // Cleanup old sessions every 5 minutes
        _cleanupTimer = new Timer(CleanupOldSessions, null, TimeSpan.FromMinutes(5), TimeSpan.FromMinutes(5));
    }

    public async Task<PdfUploadResult> ProcessPdfAsync(Stream pdfStream, string fileName)
    {
        var sessionId = Guid.NewGuid().ToString();

        // Copy to memory for processing
        using var memoryStream = new MemoryStream();
        await pdfStream.CopyToAsync(memoryStream);
        var pdfBytes = memoryStream.ToArray();

        _logger.LogInformation("Processing PDF {FileName} ({Size} bytes)", fileName, pdfBytes.Length);

        var pageImages = new List<byte[]>();

        using var docReader = DocLib.Instance.GetDocReader(pdfBytes, new PageDimensions(2048, 2048));
        var pageCount = docReader.GetPageCount();

        _logger.LogInformation("PDF has {PageCount} pages", pageCount);

        for (int i = 0; i < pageCount; i++)
        {
            using var pageReader = docReader.GetPageReader(i);
            var width = pageReader.GetPageWidth();
            var height = pageReader.GetPageHeight();
            var rawBytes = pageReader.GetImage();

            _logger.LogDebug("Processing page {Page}: {Width}x{Height}", i + 1, width, height);

            // Docnet returns BGRA format
            using var image = Image.LoadPixelData<Bgra32>(rawBytes, width, height);
            using var outputStream = new MemoryStream();
            await image.SaveAsPngAsync(outputStream);
            pageImages.Add(outputStream.ToArray());
        }

        Sessions[sessionId] = new PdfSession
        {
            FileName = fileName,
            PageCount = pageCount,
            PageImages = pageImages,
            CreatedAt = DateTime.UtcNow
        };

        _logger.LogInformation("Created session {SessionId} for {FileName}", sessionId, fileName);

        return new PdfUploadResult
        {
            SessionId = sessionId,
            FileName = fileName,
            PageCount = pageCount
        };
    }

    public Task<byte[]?> GetPageImageAsync(string sessionId, int pageNumber)
    {
        if (!Sessions.TryGetValue(sessionId, out var session))
        {
            _logger.LogWarning("Session {SessionId} not found", sessionId);
            return Task.FromResult<byte[]?>(null);
        }

        if (pageNumber < 1 || pageNumber > session.PageCount)
        {
            _logger.LogWarning("Invalid page number {PageNumber} for session {SessionId}", pageNumber, sessionId);
            return Task.FromResult<byte[]?>(null);
        }

        return Task.FromResult<byte[]?>(session.PageImages[pageNumber - 1]);
    }

    public Task<string> GetPageAsBase64Async(string sessionId, int pageNumber)
    {
        if (!Sessions.TryGetValue(sessionId, out var session))
            throw new KeyNotFoundException($"Session {sessionId} not found");

        if (pageNumber < 1 || pageNumber > session.PageCount)
            throw new ArgumentOutOfRangeException(nameof(pageNumber));

        var imageBytes = session.PageImages[pageNumber - 1];
        return Task.FromResult(Convert.ToBase64String(imageBytes));
    }

    private void CleanupOldSessions(object? state)
    {
        var cutoff = DateTime.UtcNow.AddMinutes(-SessionTimeoutMinutes);
        var expiredSessions = Sessions
            .Where(kvp => kvp.Value.CreatedAt < cutoff)
            .Select(kvp => kvp.Key)
            .ToList();

        foreach (var sessionId in expiredSessions)
        {
            if (Sessions.TryRemove(sessionId, out _))
            {
                _logger.LogInformation("Removed expired session {SessionId}", sessionId);
            }
        }
    }

    public void Dispose()
    {
        _cleanupTimer?.Dispose();
    }
}
