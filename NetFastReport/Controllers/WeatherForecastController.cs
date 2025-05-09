using AutoMapper;
using FastReport.Export.PdfSimple;
using Microsoft.AspNetCore.Mvc;

namespace NetFastReport.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class WeatherForecastController : ControllerBase
    {
        private static readonly string[] Summaries = new[]
        {
            "Freezing", "Bracing", "Chilly", "Cool", "Mild", "Warm", "Balmy", "Hot", "Sweltering", "Scorching"
        };

        private readonly ILogger<WeatherForecastController> _logger;

        public WeatherForecastController(ILogger<WeatherForecastController> logger)
        {
            _logger = logger;
        }

        [HttpGet(Name = "GetWeatherForecast")]
        public IEnumerable<WeatherForecast> Get()
        {
            return Enumerable.Range(1, 5).Select(index => new WeatherForecast
            {
                Date = DateOnly.FromDateTime(DateTime.Now.AddDays(index)),
                TemperatureC = Random.Shared.Next(-20, 55),
                Summary = Summaries[Random.Shared.Next(Summaries.Length)]
            })
            .ToArray();
        }

        [HttpGet("CreateReport")]
        [ProducesResponseType(200)]
        public async Task<IActionResult> CreateReport()
        {
            var projectRootPath = Environment.CurrentDirectory;
            var reportFilePath = System.IO.Path.Combine(projectRootPath, "wwwroot", "BaseReport.frx");
            if (!System.IO.Directory.Exists(System.IO.Path.Combine(projectRootPath, "wwwroot")))
            {
                System.IO.Directory.CreateDirectory(System.IO.Path.Combine(projectRootPath, "wwwroot"));
            }
            var freport = new FastReport.Report();

            var dto = Enumerable.Range(1, 5).Select(index => new WeatherForecast
            {
                Date = DateOnly.FromDateTime(DateTime.Now.AddDays(index)),
                TemperatureC = Random.Shared.Next(-20, 55),
                Summary = Summaries[Random.Shared.Next(Summaries.Length)]
            })
            .ToArray();

            freport.Dictionary.RegisterBusinessObject(dto, "WeatherForecastList", 10, true);
            freport.Report.Save(reportFilePath);

            return Ok($" Relatorio gerado : {reportFilePath}");
        }

        [HttpGet("GetReport")]
        [ProducesResponseType(typeof(FileContentResult), 200)]
        [ProducesResponseType(404)]
        public async Task<IActionResult> GetReport()
        {
            var reportFilePath = System.IO.Path.Combine(Environment.CurrentDirectory, "wwwroot", "BaseReport.frx");
            using var report = new FastReport.Report();
            report.Load(reportFilePath);

            var dto = Enumerable.Range(1, 5).Select(index => new WeatherForecast
            {
                Date = DateOnly.FromDateTime(DateTime.Now.AddDays(index)),
                TemperatureC = Random.Shared.Next(-20, 55),
                Summary = Summaries[Random.Shared.Next(Summaries.Length)]
            })
            .ToArray();
            report.Dictionary.RegisterBusinessObject(dto, "WeatherForecastList", 10, true);

            report.Prepare();

            using var pdfExport = new PDFSimpleExport();
            using var ms = new MemoryStream();
            pdfExport.Export(report, ms);
            ms.Flush();
            ms.Position = 0;

            return File(ms.ToArray(), "application/pdf", "WeatherForecast.pdf");
        }
    }
}
