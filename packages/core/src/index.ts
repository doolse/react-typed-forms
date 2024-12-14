export * from "./controlImpl";
export * from "./hooks";
export * from "./Fcheckbox";
export * from "./Fselect";
export * from "./Finput";
export * from "./components";
export * from "./util";
export * from "@astroapps/controls";
const version = "3.6.4";
const existingVersion = (globalThis as any)["_react_typed_forms"];
if (existingVersion) {
  console.warn(
    `Multiple versions of @react-typed-forms/core found: ${existingVersion} and ${version}`,
  );
}
(globalThis as any)["typedForms"] = version;
if (typeof window !== "undefined")
  console.info("@react-typed-forms/core " + version + " loaded");
