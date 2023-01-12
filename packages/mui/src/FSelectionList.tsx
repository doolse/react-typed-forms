import {
  Card,
  CardHeader,
  Checkbox,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import {
  Control,
  FormArray,
  groupedChanges,
  RenderControl,
  SelectionGroup,
  useControlValue,
} from "@react-typed-forms/core";
import React, { CSSProperties } from "react";

export function FSelectionList<A>({
  control,
  entryName,
  title,
  entrySelected,
  style,
  elevation,
}: {
  control: Control<SelectionGroup<A>[]>;
  entrySelected?: Control<Control<SelectionGroup<A>> | undefined>;
  title: string;
  entryName: (a: A) => string;
  style?: CSSProperties;
  elevation?: number;
}) {
  return (
    <FormArray state={control}>
      {(items) => {
        const numChecked = items
          .map((x) => x.fields.selected.value)
          .reduce((c, n) => (n ? c + 1 : c), 0);
        const numTables = items.length;
        return (
          <Card style={style} elevation={elevation} sx={{ m: 1 }}>
            <CardHeader
              sx={{ px: 2, py: 1 }}
              avatar={
                <Checkbox
                  onClick={() => handleToggleAll(items)}
                  checked={numChecked === numTables && numTables !== 0}
                  indeterminate={numChecked !== numTables && numChecked !== 0}
                  disabled={numTables === 0 || control.disabled}
                  inputProps={{
                    "aria-label": "all items selected",
                  }}
                />
              }
              title={title}
              subheader={`${numChecked}/${items.length} selected`}
            />
            <Divider />
            <List
              sx={{
                bgcolor: "background.paper",
              }}
              dense
              component="div"
              role="list"
            >
              {items.map((i) => (
                <SelectionEntry
                  key={i.uniqueId}
                  disabled={control.disabled}
                  control={i}
                  entryName={entryName}
                  entrySelected={entrySelected}
                />
              ))}
              <ListItem />
            </List>
          </Card>
        );
      }}
    </FormArray>
  );

  function handleToggleAll(items: Control<SelectionGroup<A>>[]) {
    groupedChanges(() =>
      items.forEach((x) => x.fields.selected.setValue((x) => !x))
    );
  }
}

function SelectionEntry<A>({
  control,
  entryName,
  entrySelected,
  disabled,
}: {
  entrySelected?: Control<Control<SelectionGroup<A>> | undefined>;
  control: Control<SelectionGroup<A>>;
  entryName: (a: A) => string;
  disabled: boolean;
}) {
  const { selected, value } = control.fields;
  const isSelected = useControlValue(selected);
  const isEntrySelected = useControlValue(
    () => entrySelected?.value === control
  );
  const name = useControlValue(() => entryName(value.value));
  return (
    <ListItemButton
      role="listitem"
      onClick={
        entrySelected ? () => (entrySelected.value = control) : undefined
      }
      selected={isEntrySelected}
    >
      <ListItemIcon>
        <Checkbox
          checked={isSelected}
          tabIndex={-1}
          disableRipple
          disabled={disabled}
          onClick={() => selected.setValue((x) => !x)}
        />
      </ListItemIcon>
      <ListItemText primary={name} />
    </ListItemButton>
  );
}
