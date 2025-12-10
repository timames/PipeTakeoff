namespace PipeTakeoff.API.Models;

public record TakeoffResult
{
    public List<MaterialItem> Materials { get; init; } = new();
    public string? DrawingNotes { get; init; }
    public DateTime AnalyzedAt { get; init; }
}

public record PdfUploadResult
{
    public string SessionId { get; init; } = "";
    public string FileName { get; init; } = "";
    public int PageCount { get; init; }
}

public record PdfSession
{
    public string FileName { get; init; } = "";
    public int PageCount { get; init; }
    public List<byte[]> PageImages { get; init; } = new();
    public DateTime CreatedAt { get; init; }
}

public record AnalyzeRequest
{
    public string SessionId { get; init; } = "";
    public int PageNumber { get; init; }
    public string ApiKey { get; init; } = "";
    public string? CustomPrompt { get; init; }
}

public record ExportRequest
{
    public List<MaterialItem> Materials { get; init; } = new();
}
