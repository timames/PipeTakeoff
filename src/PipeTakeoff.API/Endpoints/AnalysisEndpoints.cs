using PipeTakeoff.API.Models;
using PipeTakeoff.API.Services;

namespace PipeTakeoff.API.Endpoints;

public static class AnalysisEndpoints
{
    public static void MapAnalysisEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/analysis");

        group.MapPost("/", async (
            AnalyzeRequest request,
            IOpenAiService openAiService,
            IPdfProcessingService pdfService,
            ILogger<Program> logger) =>
        {
            if (string.IsNullOrEmpty(request.ApiKey))
                return Results.BadRequest(new { message = "API key is required" });

            if (string.IsNullOrEmpty(request.SessionId))
                return Results.BadRequest(new { message = "Session ID is required" });

            if (request.PageNumber < 1)
                return Results.BadRequest(new { message = "Page number must be at least 1" });

            try
            {
                logger.LogInformation("Starting analysis for session {SessionId}, page {Page}",
                    request.SessionId, request.PageNumber);

                var base64Image = await pdfService.GetPageAsBase64Async(
                    request.SessionId,
                    request.PageNumber);

                var result = await openAiService.AnalyzeDrawingAsync(
                    base64Image,
                    request.ApiKey,
                    request.CustomPrompt);

                logger.LogInformation("Analysis complete: {Count} materials found",
                    result.Materials.Count);

                return Results.Ok(result);
            }
            catch (KeyNotFoundException)
            {
                return Results.NotFound(new { message = "Session not found or expired" });
            }
            catch (ArgumentOutOfRangeException)
            {
                return Results.BadRequest(new { message = "Invalid page number" });
            }
            catch (HttpRequestException ex)
            {
                logger.LogError(ex, "OpenAI API request failed");
                return Results.Problem($"OpenAI API error: {ex.Message}");
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Analysis failed");
                return Results.Problem($"Analysis failed: {ex.Message}");
            }
        })
        .WithName("AnalyzeDrawing")
        .WithOpenApi(operation =>
        {
            operation.Summary = "Analyze a PDF page using GPT-4o vision";
            operation.Description = "Sends the page image to OpenAI and returns identified materials";
            return operation;
        });
    }
}
