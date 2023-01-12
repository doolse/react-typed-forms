using Newtonsoft.Json;
using Newtonsoft.Json.Converters;
using NJsonSchema.Converters;

namespace SchemaGen.Data;

[JsonConverter(typeof(StringEnumConverter))]
public enum ExpressionType
{
    Jsonata,
    FieldValue,
    UserMatch
}

[JsonConverter(typeof(JsonInheritanceConverter), "type")]
[JsonInheritance("Jsonata", typeof(JsonataExpression))]
[JsonInheritance("FieldValue", typeof(FieldValueExpression))]
[JsonInheritance("UserMatch", typeof(UserMatchExpression))]
public record EntityExpression(ExpressionType Type);

public record JsonataExpression(string Expression) : EntityExpression(ExpressionType.Jsonata);

public record FieldValueExpression([property: SchemaTag(SchemaTags.SchemaField)] string Field,  [property: SchemaTag("_ValuesOf:field")] object Value) : EntityExpression(ExpressionType.FieldValue);

public record UserMatchExpression(string UserMatch) : EntityExpression(ExpressionType.UserMatch);