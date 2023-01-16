using System.Text;
using Microsoft.AspNetCore.Mvc;
using NJsonSchema;
using NJsonSchema.CodeGeneration.CSharp;
using SchemaGen.Data;

namespace SchemaGen.Controllers;

[ApiController]
[Route("[controller]")]
public class WeatherForecastController : ControllerBase
{
    [HttpGet()]
    public async Task<AllClasses> Get()
    {
        throw new NotSupportedException();
    }
    
    [HttpGet("Code")]
    public async Task<ActionResult> GetCode()
    {
        var jsonBlah= await JsonSchema.FromJsonAsync(System.IO.File.Open("/home/jolz/astrolabe/git/react-typed-forms/packages/schemas/la",
            FileMode.Open));
        var settings = new CSharpGeneratorSettings()
        {
            ClassStyle = CSharpClassStyle.Record
        };
        var resolver = new CSharpTypeResolver(settings);
        resolver.RegisterSchemaDefinitions(jsonBlah.Definitions);
        var gen = new CSharpGenerator(jsonBlah, settings, resolver);
        var schemaFiles = gen.GenerateFile();
        return new FileContentResult(Encoding.UTF8.GetBytes(schemaFiles), "text/plain");
    }

    public record AllClasses(SchemaField SchemaField, ControlDefinition Control);
}