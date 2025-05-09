using EntityFrameworkProject.Models;
using Microsoft.EntityFrameworkCore;
using NetFastReport.Dto;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowSpecificOrigin",
        builder => builder
           .WithOrigins("http://localhost:3080")
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials());
});

var Configuration = builder.Configuration;

Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .WriteTo.File("logs/myapp.txt", rollingInterval: RollingInterval.Day, rollOnFileSizeLimit: true, fileSizeLimitBytes: 10485760, retainedFileCountLimit: 7)
    .CreateLogger();

builder.Services.AddSingleton(Log.Logger);
builder.Logging.ClearProviders();
builder.Logging.AddSerilog();
builder.Services.AddAutoMapper(typeof(MyProfile));

var connStr = IniFile.GetConnectionString();

builder.Services.AddDbContext<LischContext>(options =>
    options.UseNpgsql(connStr)
     .EnableSensitiveDataLogging()
           .LogTo(Console.WriteLine, LogLevel.Information)

);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowSpecificOrigin");

app.UseAuthorization();

app.UseStaticFiles();

app.MapControllers();

app.Run();
