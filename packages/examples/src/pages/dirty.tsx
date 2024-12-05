import { Control, Finput, notEmpty, useControl } from "@react-typed-forms/core";
import React, { useEffect, useState } from "react";

interface SimpleForm {
  firstName: string;
  lastName: string;
}

export default function DirtyFlagsPage() {
  return (
    <>
      <DirtyFlags
        setupControl={() =>
          useControl<SimpleForm>({
            firstName: "Doolse",
            lastName: "Mahinnis",
          })
        }
        prefix="not"
      />
      <DirtyFlags
        setupControl={() =>
          useControl<SimpleForm>(
            {
              firstName: "Doolse",
              lastName: "Mahinnis",
            },
            {
              afterCreate: (c) =>
                (c.initialValue = { ...c.current.value, lastName: "Changed" }),
            },
          )
        }
        prefix="last"
      />
      <DirtyFlags
        setupControl={() => {
          const c = useControl<SimpleForm>({
            firstName: "Doolse",
            lastName: "Mahinnis",
          });
          c.fields.firstName;
          useEffect(() => {
            c.setValue((x) => ({ ...x, lastName: "Changed" }));
          }, []);
          return c;
        }}
        hideLast
        prefix="oneField"
      />
    </>
  );
}

export function DirtyFlags({
  setupControl,
  prefix,
  hideLast,
}: {
  setupControl: () => Control<SimpleForm>;
  prefix: string;
  hideLast?: boolean;
}) {
  const formState = setupControl();
  const fields = formState.fields;
  return (
    <div className="m-4">
      {renderDirty(formState, "form")}
      {renderDirty(fields.firstName, "firstName")}
      {!hideLast && renderDirty(fields.lastName, "lastName")}
      <div>
        <div>
          <label>First Name: </label>
          <label>{fields.firstName.value}</label>
        </div>
        <div>
          <label>First Before: </label>
          <label>{fields.firstName.initialValue}</label>
        </div>
      </div>
      {!hideLast && (
        <div>
          <div>
            <label>Last Name: </label>
            <label>{fields.lastName.value}</label>
          </div>
          <div>
            <label>Last Name before: </label>
            <label>{fields.lastName.initialValue}</label>
          </div>
        </div>
      )}
    </div>
  );

  function renderDirty(c: Control<any>, name: string) {
    return (
      <div>
        <label>{name}: </label>
        <label id={prefix + "_" + name}>{c.dirty ? "dirty" : "clean"}</label>
      </div>
    );
  }
}
