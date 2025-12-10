using PipeTakeoff.API.Models;
using PipeTakeoff.API.Services;

namespace PipeTakeoff.API.Endpoints;

public static class ExportEndpoints
{
    public static void MapExportEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/export");

        group.MapPost("/csv", (ExportRequest request, ITakeoffService takeoffService) =>
        {
            if (request.Materials == null || request.Materials.Count == 0)
                return Results.BadRequest(new { message = "No materials to export" });

            var stream = takeoffService.ExportToCsv(request.Materials);
            return Results.File(
                stream,
                "text/csv",
                $"takeoff-{DateTime.Now:yyyyMMdd-HHmmss}.csv");
        })
        .WithName("ExportCsv")
        .WithOpenApi(operation =>
        {
            operation.Summary = "Export materials to CSV";
            operation.Description = "Returns a CSV file with all materials grouped by category";
            return operation;
        });

        group.MapPost("/excel", (ExportRequest request, ITakeoffService takeoffService) =>
        {
            if (request.Materials == null || request.Materials.Count == 0)
                return Results.BadRequest(new { message = "No materials to export" });

            var stream = takeoffService.ExportToExcel(request.Materials);
            return Results.File(
                stream,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                $"takeoff-{DateTime.Now:yyyyMMdd-HHmmss}.xlsx");
        })
        .WithName("ExportExcel")
        .WithOpenApi(operation =>
        {
            operation.Summary = "Export materials to Excel";
            operation.Description = "Returns an Excel file with materials, subtotals, and color-coded confidence levels";
            return operation;
        });
    }
}
