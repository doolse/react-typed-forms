using System.Collections.Generic;
using System.ComponentModel;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;
using NJsonSchema.Converters;

namespace SchemaGen.Data;

[JsonConverter(typeof(StringEnumConverter))]
public enum SchemaFieldType
{
    Scalar,
    Compound
}

[JsonConverter(typeof(JsonInheritanceConverter), "schemaType")]
[JsonInheritance("Scalar", typeof(ScalarField))]
[JsonInheritance("Compound", typeof(CompoundField))]
public abstract record SchemaField([property: DefaultValue("Scalar")] SchemaFieldType SchemaType, string Field, string DisplayName, [property: DefaultValue("String")]  FieldType Type,
    IEnumerable<string> Tags,
    bool System, bool Collection, IEnumerable<string> OnlyForTypes);

public record ScalarField(string Field, string DisplayName, FieldType Type, IEnumerable<string> Tags,
        string EntityRefType, bool System, bool Required, bool Collection, string ParentField, bool Searchable,
        object DefaultValue, bool IsTypeField, IEnumerable<string> OnlyForTypes, SchemaRestrictions? Restrictions)
    : SchemaField(SchemaFieldType.Scalar, Field, DisplayName, Type, Tags, System, Collection, OnlyForTypes);

public record CompoundField(string Field, string DisplayName, FieldType Type, IEnumerable<string> Tags, bool Collection,
        IEnumerable<SchemaField> Children, bool TreeChildren, IEnumerable<string> OnlyForTypes)
    : SchemaField(SchemaFieldType.Compound, Field, DisplayName, Type, Tags, false, Collection, OnlyForTypes);

[JsonConverter(typeof(StringEnumConverter))]
public enum FieldType
{
    String,
    Bool,
    Int,
    Date,
    DateTime,
    Double,
    EntityRef,
    Compound,
    AutoId,
    Image
}

public record SchemaRestrictions(IEnumerable<FieldOption>? Options = null);

public record FieldOption(string Name, object Value);

[System.AttributeUsage(System.AttributeTargets.Property, AllowMultiple = true)]
public class SchemaTagAttribute : System.Attribute
{
    public string Tag;

    public SchemaTagAttribute(string tag)
    {
        Tag = tag;
    }
}

public static class SchemaTags
{
    public const string SchemaField = "_SchemaField";
    public const string NestedSchemaField = "_NestedSchemaField";
    public const string NoControl = "_NoControl";
    public const string ValuesOf = "_ValuesOf:";
    public const string TableList = "_TableList";
    public const string ThemeList = "_ThemeList";
    public const string DefaultValue = "_DefaultValue";
    public const string HtmlEditor = "_HtmlEditor";
}
