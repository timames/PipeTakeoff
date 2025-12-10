namespace PipeTakeoff.API.Models;

public record MaterialItem
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public string Category { get; init; } = "";      // Pipe, Fitting, Valve, Equipment, Specialty
    public string Description { get; init; } = "";
    public string Size { get; init; } = "";
    public string Material { get; init; } = "";
    public decimal Quantity { get; init; }
    public string Unit { get; init; } = "EA";        // LF, EA, etc.
    public string Confidence { get; init; } = "Medium";  // High, Medium, Low
    public string? Notes { get; init; }
    public bool IsManualEntry { get; init; }
}
