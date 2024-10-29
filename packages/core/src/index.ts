export * from "./controlImpl";
export * from "./react-hooks";
export * from "./html";
export * from "./types";
export * from "./components";
export * from "./util";

const version = "3.6.2";
const existingVersion = (globalThis as any)["_react_typed_forms"]; 
if (existingVersion !== "undefined") {
    console.warn(`Multiple versions of @react-typed-forms/core found: ${existingVersion} and ${version}`);
}
(globalThis as any)["typedForms"] = version;
console.info("@react-typed-forms/core "+version+" loaded");