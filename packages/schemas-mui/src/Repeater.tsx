import { Control, FormArray, removeElement } from "@react-typed-forms/core";
import { Box, Button, Paper } from "@mui/material";
import Add from "@mui/icons-material/Add";
import Remove from "@mui/icons-material/Remove";
import React from "react";

export default function Repeater<A>({
  control,
  buttonTitle,
  renderControl,
  onAdd,
}: {
  control: Control<A[]>;
  buttonTitle?: string;
  renderControl: (control: Control<A>) => JSX.Element;
  onAdd: () => void;
}) {
  return (
    <FormArray control={control}>
      {(elems) => (
        <>
          {elems.map((c) => (
            <Box display="flex" key={c.uniqueId} alignItems="center">
              <Paper variant={"outlined"} style={{ marginBottom: "8px" }}>
                <Box m={2}>{renderControl(c)}</Box>
              </Paper>
              <Box ml={2}>
                <Button
                  onClick={() => removeElement(control, c)}
                  startIcon={<Remove />}
                  variant={"outlined"}
                >
                  {"Remove"}
                </Button>
              </Box>
            </Box>
          ))}
          <Button onClick={onAdd} startIcon={<Add />} variant={"contained"}>
            {buttonTitle ?? "Add"}
          </Button>
        </>
      )}
    </FormArray>
  );
}
