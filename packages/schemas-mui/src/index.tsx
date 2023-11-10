import {
  AccordionAdornment,
  ControlAdornment,
  ControlAdornmentType,
  DisplayDataType,
  FieldOption,
  FieldType,
  GridRenderer,
  GroupRenderType,
  HtmlDisplay,
  HtmlEditorRenderOptions,
  IconListRenderOptions,
  IconSelectionRenderOptions,
  DataRenderType,
  SynchronisedRenderOptions,
  TextDisplay,
  TooltipAdornment,
  UserSelectionRenderOptions,
  DateTimeRenderOptions,
  elementValueForField,
  LabelRendererProps,
} from "@react-typed-forms/schemas";
import {
  addElement,
  AnyControl,
  Control,
  RenderControl,
} from "@react-typed-forms/core";
import React, { Fragment, Key, ReactElement } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  Grid,
  Radio,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  ActionRendererProps,
  CompoundGroupRendererProps,
  ControlData,
  controlTitle,
  defaultValueForField,
  DisplayRendererProps,
  FormRendererComponents,
  GroupRendererProps,
  DataRendererProps,
} from "@react-typed-forms/schemas";

import { ExpandMore } from "@mui/icons-material";
import { IconList } from "./IconList";
import Repeater from "./Repeater";
import {
  FCheckbox,
  FCheckList,
  FDateField,
  FNumberField,
  FRadioList,
  FSelect,
  FTextField,
} from "@react-typed-forms/mui";
import { format, parseISO } from "date-fns";

function muiControlRenderer(props: DataRendererProps): ReactElement {
  const {
    definition: { title: _title, renderOptions, adornments },
    properties: {
      options,
      readonly,
      visible,
      required,
      field,
      element,
      control,
    },
  } = props;
  if (!visible) return <></>;
  const title = controlTitle(_title, field);

  return renderAdornments(
    adornments,
    field.collection && !element ? (
      renderCollection(control.as())
    ) : readonly ? (
      <RenderControl children={() => readonlyControl(control)} />
    ) : (
      singleControl(control)
    )
  );

  function renderCollection(control: Control<any[]>) {
    switch (renderOptions?.type) {
      case DataRenderType.CheckList:
        return (
          <RenderChecklist control={control} options={options} title={title} />
        );
      default:
        return (
          <Repeater
            control={control}
            renderControl={(control) =>
              muiControlRenderer({
                ...props,
                properties: { ...props.properties, control, element: true },
              })
            }
            onAdd={() => addElement(control, field.defaultValue)}
          />
        );
    }
  }

  function readonlyControl(control: AnyControl) {
    const value = control.value;
    const text = options?.find((x) => x.value === value)?.name ?? value;
    switch (field.type) {
      case FieldType.DateTime:
        const dateTimeOptions = renderOptions as DateTimeRenderOptions;
        return (
          <div>
            <Typography variant="subtitle2">{title}</Typography>
            <Typography variant="body2">
              {format(parseISO(text), dateTimeOptions.format ?? "dd/MM/yyyy")}
            </Typography>
          </div>
        );
      default:
        return (
          <div>
            <Typography variant="subtitle2">{title}</Typography>
            <Typography variant="body2">{text}</Typography>
          </div>
        );
    }
  }

  function singleControl(control: AnyControl) {
    switch (field.type) {
      case FieldType.Bool:
        return <FCheckbox label={title} state={control as Control<boolean>} />;
      case FieldType.EntityRef:
        return <h1></h1>;
      case FieldType.DateTime:
        return (
          <FDateField
            label={title}
            fullWidth
            size="small"
            state={control as Control<string>}
            required={required}
          />
        );
      case FieldType.Date:
        return (
          <FDateField
            label={title}
            fullWidth
            size="small"
            state={control as Control<string>}
            required={required}
          />
        );
      case FieldType.Any:
      case FieldType.String:
        const stringFC = control as Control<string>;
        if (options) {
          return optionRenderer(stringFC, options);
        }
        switch (renderOptions?.type) {
          default:
            return (
              <FTextField
                label={title}
                fullWidth
                state={stringFC}
                size="small"
                required={required}
              />
            );
        }
      case FieldType.Int:
      case FieldType.Double:
        const numberFC = control as Control<string>;
        if (options) {
          return optionRenderer(numberFC, options);
        }
        return (
          <FNumberField
            label={title}
            fullWidth
            state={control as Control<number>}
            size={"small"}
            required={required}
          />
        );
      default:
        return <h1>No editor for {field.type}</h1>;
    }
  }

  function optionRenderer(control: Control<any>, allOptions: FieldOption[]) {
    if (renderOptions?.type === DataRenderType.IconList) {
      const iconRenderOptions = renderOptions as IconListRenderOptions;
      return (
        <IconList
          options={allOptions}
          renderOptions={iconRenderOptions}
          state={control.as()}
        />
      );
    }
    if (renderOptions?.type === "Radio") {
      return (
        <FRadioList label={title} state={control}>
          {(rf) =>
            allOptions.map((o) => (
              <FormControlLabel
                key={o.name}
                control={<Radio {...rf(o.value)} />}
                label={o.name}
              />
            ))
          }
        </FRadioList>
      );
    }
    return (
      <FSelect
        state={control.as()}
        label={title}
        options={
          required
            ? allOptions
            : [{ name: "Not specified", value: "" }, ...allOptions]
        }
        required={required}
        emptyText={"Please select..."}
        size="small"
        fullWidth
      />
    );
  }
}

function RenderChecklist({
  control,
  options,
  title,
}: {
  control: Control<any[]>;
  options: FieldOption[] | undefined | null;
  title: string;
}) {
  return (
    <FCheckList label={title} state={control}>
      {(mkCheck) =>
        options?.map((r) => (
          <FormControlLabel
            control={<Checkbox {...mkCheck(r)} />}
            label={r.name}
          />
        ))
      }
    </FCheckList>
  );
}

function renderGrid(
  title: string | undefined | null,
  hideTitle: boolean | undefined | null,
  childrenCount: number,
  renderChild: (
    c: number,
    wrapChild: (key: Key, childElem: ReactElement) => ReactElement
  ) => ReactElement,
  columns?: number | null
) {
  const cols = columns ?? 1;
  return (
    <>
      {!hideTitle && <Typography variant="h5">{title}</Typography>}

      <div
        style={{
          display: "grid",
          gap: 10,
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
        }}
      >
        {Array.from({ length: childrenCount }, (_, x) =>
          renderChild(x, (key, c) => <Fragment key={key} children={c} />)
        )}
      </div>
    </>
  );
}

function muiGroupRenderer({
  definition: { title, groupOptions, adornments },
  childCount,
  renderChild,
  properties: { visible },
}: GroupRendererProps): ReactElement {
  if (!visible) return <></>;

  const gridOptions =
    groupOptions.type === GroupRenderType.Grid
      ? (groupOptions as GridRenderer)
      : undefined;
  return renderAdornments(
    adornments,
    renderGrid(
      title,
      groupOptions.hideTitle,
      childCount,
      renderChild,
      gridOptions?.columns
    )
  );
}

function muiCompoundRenderer(
  {
    definition: { title: _title, children, groupOptions },
    field,
    renderChild,
    properties: { visible },
  }: CompoundGroupRendererProps,
  control: Control<any>
): ReactElement {
  if (!visible) return <></>;

  const title = controlTitle(_title, field);
  return field.collection
    ? renderCollection(control.as())
    : renderGroup(control as Control<ControlData>);

  function renderCollection(control: Control<ControlData[]>) {
    return (
      <Repeater
        control={control}
        renderControl={renderGroup}
        buttonTitle={`Add ${title}`}
        onAdd={() => addElement(control, elementValueForField(field))}
      />
    );
  }

  function renderGroup(data: Control<ControlData>) {
    const gridOptions =
      groupOptions.type === GroupRenderType.Grid
        ? (groupOptions as GridRenderer)
        : undefined;
    return renderGrid(
      title,
      groupOptions.hideTitle,
      children.length,
      (x, wc) => renderChild(x, children[x], data, wc),
      gridOptions?.columns
    );
  }
}

function muiDisplayRenderer({
  definition: { displayData },
  properties: { visible },
}: DisplayRendererProps) {
  if (!visible) return <></>;

  switch (displayData.type) {
    case DisplayDataType.Text:
      return (
        <Typography variant="body2">
          {(displayData as TextDisplay).text}
        </Typography>
      );
    case DisplayDataType.Html:
      return (
        <div
          dangerouslySetInnerHTML={{
            __html: (displayData as HtmlDisplay).html,
          }}
        />
      );
    default:
      return <h1>Unknown display type: {displayData.type}</h1>;
  }
}

function muiActionRenderer({
  definition,
  properties: { visible, onClick },
}: ActionRendererProps) {
  if (!visible) return <></>;
  return <Button onClick={onClick}>{definition.title}</Button>;
}

function muiRenderLabel(props: LabelRendererProps) {
  return <label>d</label>;
}

export const MuiFormRenderer: FormRendererComponents = {
  renderDisplay: muiDisplayRenderer,
  renderGroup: muiGroupRenderer,
  renderCompound: muiCompoundRenderer,
  renderData: muiControlRenderer,
  renderAction: muiActionRenderer,
  renderLabel: muiRenderLabel,
};

function renderAdornments(
  adornments: ControlAdornment[] | undefined | null,
  elem: ReactElement
) {
  return adornments?.reduce(renderAdornment, elem) ?? elem;
}

function renderAdornment(
  elem: ReactElement,
  adorn: ControlAdornment
): ReactElement {
  switch (adorn.type) {
    case ControlAdornmentType.Tooltip:
      return (
        <Tooltip title={(adorn as TooltipAdornment).tooltip}>{elem}</Tooltip>
      );
    case ControlAdornmentType.Accordion:
      return (
        <Accordion
          defaultExpanded={(adorn as AccordionAdornment).defaultExpanded}
        >
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography>{(adorn as AccordionAdornment).title}</Typography>
          </AccordionSummary>
          <AccordionDetails>{elem}</AccordionDetails>
        </Accordion>
      );
    default:
      return elem;
  }
}
