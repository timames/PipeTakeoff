using System.Text.Json;
using Microsoft.Extensions.Options;
using PipeTakeoff.API.Configuration;
using PipeTakeoff.API.Models;

namespace PipeTakeoff.API.Services;

public interface IOpenAiService
{
    Task<TakeoffResult> AnalyzeDrawingAsync(string base64Image, string apiKey, string? customPrompt = null);
}

public class OpenAiService : IOpenAiService
{
    private readonly HttpClient _httpClient;
    private readonly OpenAiOptions _options;
    private readonly ILogger<OpenAiService> _logger;

    private const string DefaultPrompt = """
        You are an expert construction estimator specializing in piping systems.
        Analyze this construction drawing and identify all piping materials visible.

        For each item found, provide:
        - Category: Pipe, Fitting, Valve, Equipment, or Specialty
        - Description (e.g., '4" PVC SCH40 Pipe', '4" 90° PVC Elbow')
        - Size/Diameter
        - Material (PVC, DI, HDPE, Steel, Copper, etc.)
        - Quantity or Length (use drawing scale if visible, otherwise estimate)
        - Unit (LF for linear pipe, EA for fittings/valves/equipment)
        - Confidence: High, Medium, or Low
        - Notes (optional, for any clarifications)

        Return as JSON with this exact structure:
        {
          "materials": [
            {
              "category": "Pipe",
              "description": "4\" PVC SCH40 Pipe",
              "size": "4\"",
              "material": "PVC",
              "quantity": 150,
              "unit": "LF",
              "confidence": "High",
              "notes": ""
            }
          ],
          "drawingNotes": "Optional notes about scale, unclear items, or assumptions made"
        }

        Focus on identifying:
        - Underground piping runs
        - Above-grade mechanical piping
        - Pumping station piping
        - Tank connections
        - Filter assemblies
        - Wellhead piping
        - All fittings (elbows, tees, reducers, couplings, flanges)
        - All valves (gate, ball, check, butterfly)
        - Equipment connections

        If scale is not determinable, note lengths as estimates and set confidence to "Low".
        If you cannot identify an item clearly, still include it with confidence "Low".
        """;

    public OpenAiService(
        HttpClient httpClient,
        IOptions<OpenAiOptions> options,
        ILogger<OpenAiService> logger)
    {
        _httpClient = httpClient;
        _options = options.Value;
        _logger = logger;
    }

    public async Task<TakeoffResult> AnalyzeDrawingAsync(
        string base64Image,
        string apiKey,
        string? customPrompt = null)
    {
        var prompt = string.IsNullOrWhiteSpace(customPrompt) ? DefaultPrompt : customPrompt;

        _logger.LogInformation("Analyzing drawing with model {Model}", _options.DefaultModel);

        var request = new
        {
            model = _options.DefaultModel,
            messages = new object[]
            {
                new
                {
                    role = "user",
                    content = new object[]
                    {
                        new { type = "text", text = prompt },
                        new
                        {
                            type = "image_url",
                            image_url = new
                            {
                                url = $"data:image/png;base64,{base64Image}",
                                detail = "high"
                            }
                        }
                    }
                }
            },
            max_tokens = _options.MaxTokens,
            response_format = new { type = "json_object" }
        };

        _httpClient.DefaultRequestHeaders.Clear();
        _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {apiKey}");

        var response = await _httpClient.PostAsJsonAsync(_options.Endpoint, request);
        var responseBody = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogError("OpenAI API error: {Status} - {Body}", response.StatusCode, responseBody);
            throw new HttpRequestException($"OpenAI API error: {response.StatusCode} - {responseBody}");
        }

        _logger.LogInformation("Received response from OpenAI");

        var result = ParseOpenAiResponse(responseBody);
        return result;
    }

    private TakeoffResult ParseOpenAiResponse(string responseBody)
    {
        using var doc = JsonDocument.Parse(responseBody);

        var content = doc.RootElement
            .GetProperty("choices")[0]
            .GetProperty("message")
            .GetProperty("content")
            .GetString();

        if (string.IsNullOrEmpty(content))
        {
            _logger.LogWarning("Empty content in OpenAI response");
            return new TakeoffResult { AnalyzedAt = DateTime.UtcNow };
        }

        _logger.LogDebug("Parsing content: {Content}", content);

        using var contentDoc = JsonDocument.Parse(content);
        var materials = new List<MaterialItem>();

        if (contentDoc.RootElement.TryGetProperty("materials", out var materialsArray))
        {
            foreach (var item in materialsArray.EnumerateArray())
            {
                try
                {
                    materials.Add(new MaterialItem
                    {
                        Id = Guid.NewGuid(),
                        Category = GetStringProperty(item, "category", "Unknown"),
                        Description = GetStringProperty(item, "description", ""),
                        Size = GetStringProperty(item, "size", ""),
                        Material = GetStringProperty(item, "material", ""),
                        Quantity = GetDecimalProperty(item, "quantity", 0),
                        Unit = GetStringProperty(item, "unit", "EA"),
                        Confidence = GetStringProperty(item, "confidence", "Medium"),
                        Notes = GetStringProperty(item, "notes", null),
                        IsManualEntry = false
                    });
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to parse material item");
                }
            }
        }

        var drawingNotes = contentDoc.RootElement.TryGetProperty("drawingNotes", out var dn)
            ? dn.GetString()
            : null;

        _logger.LogInformation("Parsed {Count} materials from response", materials.Count);

        return new TakeoffResult
        {
            Materials = materials,
            DrawingNotes = drawingNotes,
            AnalyzedAt = DateTime.UtcNow
        };
    }

    private static string GetStringProperty(JsonElement element, string propertyName, string? defaultValue)
    {
        if (element.TryGetProperty(propertyName, out var prop) && prop.ValueKind == JsonValueKind.String)
            return prop.GetString() ?? defaultValue ?? "";
        return defaultValue ?? "";
    }

    private static decimal GetDecimalProperty(JsonElement element, string propertyName, decimal defaultValue)
    {
        if (element.TryGetProperty(propertyName, out var prop))
        {
            if (prop.ValueKind == JsonValueKind.Number)
                return prop.GetDecimal();
            if (prop.ValueKind == JsonValueKind.String && decimal.TryParse(prop.GetString(), out var parsed))
                return parsed;
        }
        return defaultValue;
    }
}
