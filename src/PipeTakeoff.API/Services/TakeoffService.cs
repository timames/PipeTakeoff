using ClosedXML.Excel;
using PipeTakeoff.API.Models;

namespace PipeTakeoff.API.Services;

public interface ITakeoffService
{
    MemoryStream ExportToCsv(List<MaterialItem> materials);
    MemoryStream ExportToExcel(List<MaterialItem> materials);
}

public class TakeoffService : ITakeoffService
{
    private readonly ILogger<TakeoffService> _logger;
    private static readonly string[] Categories = ["Pipe", "Fitting", "Valve", "Equipment", "Specialty"];

    public TakeoffService(ILogger<TakeoffService> logger)
    {
        _logger = logger;
    }

    public MemoryStream ExportToCsv(List<MaterialItem> materials)
    {
        _logger.LogInformation("Exporting {Count} materials to CSV", materials.Count);

        var stream = new MemoryStream();
        var writer = new StreamWriter(stream);

        // Header
        writer.WriteLine("Category,Description,Size,Material,Quantity,Unit,Confidence,Notes");

        // Data grouped by category
        foreach (var category in Categories)
        {
            var categoryItems = materials.Where(m => m.Category == category);
            foreach (var item in categoryItems)
            {
                var notes = (item.Notes ?? "").Replace("\"", "\"\"");
                var description = item.Description.Replace("\"", "\"\"");
                writer.WriteLine($"\"{item.Category}\",\"{description}\",\"{item.Size}\",\"{item.Material}\",{item.Quantity},\"{item.Unit}\",\"{item.Confidence}\",\"{notes}\"");
            }
        }

        // Include any items with unknown categories
        var otherItems = materials.Where(m => !Categories.Contains(m.Category));
        foreach (var item in otherItems)
        {
            var notes = (item.Notes ?? "").Replace("\"", "\"\"");
            var description = item.Description.Replace("\"", "\"\"");
            writer.WriteLine($"\"{item.Category}\",\"{description}\",\"{item.Size}\",\"{item.Material}\",{item.Quantity},\"{item.Unit}\",\"{item.Confidence}\",\"{notes}\"");
        }

        writer.Flush();
        stream.Position = 0;
        return stream;
    }

    public MemoryStream ExportToExcel(List<MaterialItem> materials)
    {
        _logger.LogInformation("Exporting {Count} materials to Excel", materials.Count);

        var workbook = new XLWorkbook();
        var ws = workbook.Worksheets.Add("Materials Takeoff");

        // Headers
        var headers = new[] { "Category", "Description", "Size", "Material", "Quantity", "Unit", "Confidence", "Notes" };
        for (int i = 0; i < headers.Length; i++)
        {
            ws.Cell(1, i + 1).Value = headers[i];
            ws.Cell(1, i + 1).Style.Font.Bold = true;
            ws.Cell(1, i + 1).Style.Fill.BackgroundColor = XLColor.LightBlue;
        }

        // Data
        int row = 2;
        foreach (var category in Categories)
        {
            var categoryItems = materials.Where(m => m.Category == category).ToList();
            if (!categoryItems.Any()) continue;

            foreach (var item in categoryItems)
            {
                ws.Cell(row, 1).Value = item.Category;
                ws.Cell(row, 2).Value = item.Description;
                ws.Cell(row, 3).Value = item.Size;
                ws.Cell(row, 4).Value = item.Material;
                ws.Cell(row, 5).Value = (double)item.Quantity;
                ws.Cell(row, 6).Value = item.Unit;
                ws.Cell(row, 7).Value = item.Confidence;
                ws.Cell(row, 8).Value = item.Notes ?? "";

                // Confidence color coding
                var confidenceCell = ws.Cell(row, 7);
                confidenceCell.Style.Fill.BackgroundColor = item.Confidence switch
                {
                    "High" => XLColor.LightGreen,
                    "Medium" => XLColor.LightYellow,
                    "Low" => XLColor.LightCoral,
                    _ => XLColor.White
                };

                // Highlight manual entries
                if (item.IsManualEntry)
                {
                    ws.Row(row).Style.Font.Italic = true;
                }

                row++;
            }

            // Category subtotal
            var subtotalRow = row;
            ws.Cell(subtotalRow, 4).Value = $"{category} Total:";
            ws.Cell(subtotalRow, 4).Style.Font.Bold = true;
            ws.Cell(subtotalRow, 4).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Right;
            ws.Cell(subtotalRow, 5).Value = categoryItems.Sum(i => (double)i.Quantity);
            ws.Cell(subtotalRow, 5).Style.Font.Bold = true;
            ws.Cell(subtotalRow, 6).Value = categoryItems.FirstOrDefault()?.Unit ?? "";
            row += 2;
        }

        // Include any items with unknown categories
        var otherItems = materials.Where(m => !Categories.Contains(m.Category)).ToList();
        if (otherItems.Any())
        {
            foreach (var item in otherItems)
            {
                ws.Cell(row, 1).Value = item.Category;
                ws.Cell(row, 2).Value = item.Description;
                ws.Cell(row, 3).Value = item.Size;
                ws.Cell(row, 4).Value = item.Material;
                ws.Cell(row, 5).Value = (double)item.Quantity;
                ws.Cell(row, 6).Value = item.Unit;
                ws.Cell(row, 7).Value = item.Confidence;
                ws.Cell(row, 8).Value = item.Notes ?? "";
                row++;
            }
        }

        // Grand total
        row++;
        ws.Cell(row, 4).Value = "GRAND TOTAL:";
        ws.Cell(row, 4).Style.Font.Bold = true;
        ws.Cell(row, 4).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Right;
        ws.Cell(row, 5).Value = materials.Sum(m => (double)m.Quantity);
        ws.Cell(row, 5).Style.Font.Bold = true;

        // Auto-fit columns
        ws.Columns().AdjustToContents();

        var stream = new MemoryStream();
        workbook.SaveAs(stream);
        stream.Position = 0;
        return stream;
    }
}
