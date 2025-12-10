namespace PipeTakeoff.API.Configuration;

public class OpenAiOptions
{
    public const string SectionName = "OpenAi";

    public string Endpoint { get; set; } = "https://api.openai.com/v1/chat/completions";
    public string DefaultModel { get; set; } = "gpt-4o";
    public int MaxTokens { get; set; } = 4096;
}
