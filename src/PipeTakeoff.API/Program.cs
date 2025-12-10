using PipeTakeoff.API.Configuration;
using PipeTakeoff.API.Endpoints;
using PipeTakeoff.API.Services;

var builder = WebApplication.CreateBuilder(args);

// Configuration
builder.Services.Configure<OpenAiOptions>(
    builder.Configuration.GetSection(OpenAiOptions.SectionName));

// HttpClient for OpenAI
builder.Services.AddHttpClient<IOpenAiService, OpenAiService>(client =>
{
    client.Timeout = TimeSpan.FromMinutes(5);
});

// Services
builder.Services.AddSingleton<IPdfProcessingService, PdfProcessingService>();
builder.Services.AddScoped<ITakeoffService, TakeoffService>();

// CORS
var allowedOrigins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>()
    ?? ["http://localhost:5173"];
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(allowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

// Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Security headers
app.Use(async (context, next) =>
{
    context.Response.Headers["X-Content-Type-Options"] = "nosniff";
    context.Response.Headers["X-Frame-Options"] = "DENY";
    context.Response.Headers["X-XSS-Protection"] = "1; mode=block";
    await next();
});

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();

// Map endpoints
app.MapUploadEndpoints();
app.MapAnalysisEndpoints();
app.MapExportEndpoints();

// Health check
app.MapGet("/health", () => Results.Ok(new { status = "healthy", timestamp = DateTime.UtcNow }))
    .WithName("HealthCheck");

app.MapGet("/", () => Results.Redirect("/swagger"))
    .ExcludeFromDescription();

app.Run();
