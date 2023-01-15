import { FieldOption, IconListRenderOptions } from "@react-typed-forms/schemas";
import { Control, useControlValue } from "@react-typed-forms/core";
import { Icon, ToggleButton, ToggleButtonGroup, Tooltip } from "@mui/material";
import React from "react";

export function IconList({
  options,
  renderOptions,
  state,
}: {
  options: FieldOption[];
  renderOptions: IconListRenderOptions;
  state: Control<string>;
}) {
  const iconMappings = renderOptions.iconMappings;
  const selectedOptionVal = useControlValue(state);
  const defaultIcon = "add_circle";

  return (
    <ToggleButtonGroup>
      {options.map((fo) => {
        const iconMapping = iconMappings?.find((x) => fo.value === x.value);
        return (
          <ToggleButton
            value={fo.value}
            onClick={() => (state.value = fo.value)}
            selected={selectedOptionVal === fo.value}
          >
            <Tooltip title={fo.value}>
              <Icon>
                {iconMapping?.materialIcon
                  ? iconMapping.materialIcon
                  : defaultIcon}
              </Icon>
            </Tooltip>
          </ToggleButton>
        );
      })}
    </ToggleButtonGroup>
  );
}
