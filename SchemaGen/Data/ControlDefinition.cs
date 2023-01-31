using System.Collections.Generic;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;
using NJsonSchema.Converters;
using Array = System.Array;

namespace SchemaGen.Data;

[JsonConverter(typeof(StringEnumConverter))]
public enum ControlDefinitionType
{
    Data,
    Group,
    Display,
    Action
}

[JsonConverter(typeof(JsonInheritanceConverter), "type")]
[JsonInheritance("Data", typeof(DataControlDefinition))]
[JsonInheritance("Group", typeof(GroupedControlsDefinition))]
[JsonInheritance("Display", typeof(DisplayControlDefinition))]
[JsonInheritance("Action", typeof(ActionControlDefinition))]
public abstract record ControlDefinition(ControlDefinitionType Type, string? Title,
    IEnumerable<DynamicProperty> Dynamic, IEnumerable<ControlAdornment>? Adornments);

public record DataControlDefinition
(string? Title, [property: SchemaTag(SchemaTags.SchemaField)]
    string Field, bool Required, RenderOptions RenderOptions, object? DefaultValue, bool NoEdit,
    IEnumerable<DynamicProperty> Dynamic, IEnumerable<ControlAdornment>? Adornments) :
    ControlDefinition(
        ControlDefinitionType.Data, Title, Dynamic, Adornments)
{
    public static readonly DataControlDefinition Default = new (null, "", false,
        new StandardRenderer(), null, false,
        Array.Empty<DynamicProperty>(), Array.Empty<ControlAdornment>());
}

public record GroupedControlsDefinition(string Title, [property: SchemaTag(SchemaTags.NoControl)]
    IEnumerable<ControlDefinition> Children,
    [property: SchemaTag(SchemaTags.NestedSchemaField)]
    string? CompoundField, GroupRenderOptions GroupOptions, IEnumerable<DynamicProperty> Dynamic, IEnumerable<ControlAdornment>? Adornments) : ControlDefinition(
    ControlDefinitionType.Group,
    Title, Dynamic, Adornments)
{
    public static readonly GroupedControlsDefinition Default = new ("Default",
        Array.Empty<ControlDefinition>(), null, new StandardGroupRenderer( true),
        Array.Empty<DynamicProperty>(), Array.Empty<ControlAdornment>());
}

public record DisplayControlDefinition
    (string Title, DisplayData DisplayData, IEnumerable<DynamicProperty> Dynamic, IEnumerable<ControlAdornment>? Adornments) : ControlDefinition(
        ControlDefinitionType.Display, Title, Dynamic, Adornments);

public record ActionControlDefinition(string Title, string ActionId, IEnumerable<DynamicProperty> Dynamic, IEnumerable<ControlAdornment>? Adornments) :
    ControlDefinition(
        ControlDefinitionType.Action, Title, Dynamic, Adornments);

[JsonConverter(typeof(StringEnumConverter))]
public enum DataRenderType
{
    [Display(Name = "Default")] Standard,
    [Display(Name = "Radio buttons")] Radio,
    [Display(Name = "HTML Editor")] HtmlEditor,
    [Display(Name = "Icon list")] IconList,
    [Display(Name = "Check list")] CheckList,
    [Display(Name = "User Selection")] UserSelection,
    [Display(Name = "Synchronised Fields")] Synchronised,
    [Display(Name = "Icon Selection")] IconSelector,
    [Display(Name = "Date/Time")] DateTime
}

[JsonConverter(typeof(JsonInheritanceConverter), "type")]
[JsonInheritance("Radio", typeof(RadioButtonRenderOptions))]
[JsonInheritance("Standard", typeof(StandardRenderer))]
[JsonInheritance("HtmlEditor", typeof(HtmlEditorRenderOptions))]
[JsonInheritance("IconList", typeof(IconListRenderOptions))]
[JsonInheritance("CheckList", typeof(CheckListRenderOptions))]
[JsonInheritance("Synchronised", typeof(SynchronisedRenderOptions))]
[JsonInheritance("UserSelection", typeof(UserSelectionRenderOptions))]
[JsonInheritance("IconSelector", typeof(IconSelectionRenderOptions))]
[JsonInheritance("DateTime", typeof(DateTimeRenderOptions))]
public abstract record RenderOptions([property: DefaultValue("Standard")] DataRenderType Type);

public record StandardRenderer() : RenderOptions(DataRenderType.Standard);

public record UserSelectionRenderOptions(bool NoGroups, bool NoUsers) : RenderOptions(DataRenderType.UserSelection);

public record RadioButtonRenderOptions() : RenderOptions(DataRenderType.Radio);

public record IconSelectionRenderOptions() : RenderOptions(DataRenderType.IconSelector);

public record DateTimeRenderOptions(string? Format) : RenderOptions(DataRenderType.DateTime);

public record CheckListRenderOptions() : RenderOptions(DataRenderType.CheckList);

public record SynchronisedRenderOptions([property: SchemaTag(SchemaTags.SchemaField)] string FieldToSync, SyncTextType SyncType) : RenderOptions(
    DataRenderType.Synchronised);

[JsonConverter(typeof(StringEnumConverter))]
public enum SyncTextType
{
    Camel,
    Snake,
    Pascal,
}
public record IconListRenderOptions(IEnumerable<IconMapping> IconMappings) : RenderOptions(DataRenderType.IconList);

public record HtmlEditorRenderOptions(bool AllowImages) : RenderOptions(DataRenderType.HtmlEditor);

public record IconMapping(string Value, string? MaterialIcon);

[JsonConverter(typeof(StringEnumConverter))]
public enum DisplayDataType
{
    Text,
    Html,
}

[JsonConverter(typeof(JsonInheritanceConverter), "type")]
[JsonInheritance("Text", typeof(TextDisplay))]
[JsonInheritance("Html", typeof(HtmlDisplay))]
public abstract record DisplayData(DisplayDataType Type);

public record TextDisplay(string Text) : DisplayData(DisplayDataType.Text);

public record HtmlDisplay([property: SchemaTag(SchemaTags.HtmlEditor)] string Html) : DisplayData(DisplayDataType.Html);

[JsonConverter(typeof(StringEnumConverter))]
public enum DynamicPropertyType
{
    Visible,
    DefaultValue
}

public record DynamicProperty(DynamicPropertyType Type, EntityExpression Expr);

[JsonConverter(typeof(StringEnumConverter))]
public enum GroupRenderType
{
    Standard,
    Grid,
    GroupElement,
}

[JsonConverter(typeof(JsonInheritanceConverter), "type")]
[JsonInheritance("Standard", typeof(StandardGroupRenderer))]
[JsonInheritance("GroupElement", typeof(GroupElementRenderer))]
[JsonInheritance("Grid", typeof(GridRenderer))]
public abstract record GroupRenderOptions([property: DefaultValue("Standard")] GroupRenderType Type, bool HideTitle);

public record StandardGroupRenderer(bool HideTitle) : GroupRenderOptions(GroupRenderType.Standard, HideTitle);

public record GridRenderer(bool HideTitle, int? Columns) : GroupRenderOptions(GroupRenderType.Grid, HideTitle);

public record GroupElementRenderer(bool HideTitle, [property: SchemaTag(SchemaTags.DefaultValue)] object Value) : GroupRenderOptions(GroupRenderType.GroupElement, HideTitle);

public record ControlSnippet(string Name, string? MaterialIcon, [property: SchemaTag(SchemaTags.NoControl)] ControlDefinition Control);

public record ControlSnippetCategory(string Name, IEnumerable<ControlSnippet> Snippets);

[JsonConverter(typeof(StringEnumConverter))]
public enum ControlAdornmentType
{
    Tooltip,
    Accordion
}

[JsonConverter(typeof(JsonInheritanceConverter), "type")]
[JsonInheritance("Tooltip", typeof(TooltipAdornment))]
[JsonInheritance("Accordion", typeof(AccordionAdornment))]
public record ControlAdornment(ControlAdornmentType Type);

public record TooltipAdornment(string Tooltip) : ControlAdornment(ControlAdornmentType.Tooltip);

public record AccordionAdornment(string Title, bool DefaultExpanded) : ControlAdornment(ControlAdornmentType.Accordion);
