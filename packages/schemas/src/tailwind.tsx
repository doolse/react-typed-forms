import React from "react";
import { DefaultRendererOptions } from "./renderers";

export const defaultTailwindTheme: DefaultRendererOptions = {
  label: {
    className: "flex flex-col",
    groupLabelClass: "font-bold",
    requiredElement: <span className="text-red-500"> *</span>,
  },
  array: {
    removableClass: "grid grid-cols-[1fr_auto] items-center gap-x-2",
    childClass: "grow",
  },
  group: {
    standardClassName: "space-y-4",
    gridClassName: "gap-x-2 gap-y-4",
  },
  action: {
    className: "bg-primary rounded-lg p-3 text-white",
  },
};
