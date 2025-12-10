using PipeTakeoff.API.Services;

namespace PipeTakeoff.API.Endpoints;

public static class UploadEndpoints
{
    public static void MapUploadEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/upload");

        group.MapPost("/", async (IFormFile file, IPdfProcessingService pdfService) =>
        {
            if (file == null || file.Length == 0)
                return Results.BadRequest(new { message = "No file provided" });

            if (!file.FileName.EndsWith(".pdf", StringComparison.OrdinalIgnoreCase))
                return Results.BadRequest(new { message = "Only PDF files are supported" });

            // Limit file size to 50MB
            if (file.Length > 50 * 1024 * 1024)
                return Results.BadRequest(new { message = "File size exceeds 50MB limit" });

            try
            {
                using var stream = file.OpenReadStream();
                var result = await pdfService.ProcessPdfAsync(stream, file.FileName);
                return Results.Ok(result);
            }
            catch (Exception ex)
            {
                return Results.Problem($"Failed to process PDF: {ex.Message}");
            }
        })
        .DisableAntiforgery()
        .WithName("UploadPdf")
        .WithOpenApi(operation =>
        {
            operation.Summary = "Upload a PDF file for analysis";
            operation.Description = "Converts PDF pages to images and returns a session ID for subsequent analysis";
            return operation;
        });

        group.MapGet("/{sessionId}/page/{pageNumber:int}", async (
            string sessionId,
            int pageNumber,
            IPdfProcessingService pdfService) =>
        {
            var imageData = await pdfService.GetPageImageAsync(sessionId, pageNumber);
            if (imageData == null)
                return Results.NotFound(new { message = "Session or page not found" });

            return Results.File(imageData, "image/png", $"page-{pageNumber}.png");
        })
        .WithName("GetPageImage")
        .WithOpenApi(operation =>
        {
            operation.Summary = "Get a specific page as PNG image";
            operation.Description = "Returns the rendered PDF page as a PNG image";
            return operation;
        });
    }
}
