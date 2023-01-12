using Microsoft.AspNetCore.Mvc;
using SchemaGen.Data;

namespace SchemaGen.Controllers;

[ApiController]
[Route("[controller]")]
public class WeatherForecastController : ControllerBase
{
    [HttpGet()]
    public AllClasses Get()
    {
        throw new NotImplementedException();
    }

    public record AllClasses(SchemaField SchemaField, ControlDefinition Control);
}