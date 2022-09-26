import { valMessage, compareJson } from "../lib";

describe("Optional data", () => {
  it("Works", () => {
    cy.visit("/optionals");
    cy.contains("Optionals Test");

    cy.get("#submit").click();
    cy.get("pre").should(
      compareJson({
        nested: {},
        nullableStruct: null,
      })
    );
    cy.get("#firstName").type("a").clear();
    cy.get("#age").type("10").clear();
    cy.get("#submit").click();
    cy.get("pre").should(
      compareJson({
        firstName: "",
        age: null,
        nullableStruct: null,
        nested: {},
      })
    );
    cy.get("#resetData").click();
    cy.get("#submit").click();
    cy.get("pre").should(
      compareJson({
        nested: {},
        nullableStruct: null,
      })
    );
    cy.get("#age").type("10.3");
    cy.get("#submit").click();
    cy.get("pre").should(
      compareJson({
        age: 10.3,
        nested: {},
        nullableStruct: null,
      })
    );
    cy.get("#clearNested").click();
    cy.get("#submit").click();
    cy.get("pre").should(
      compareJson({
        age: 10.3,
        nullableStruct: null,
      })
    );
    cy.get("#unClearNested").click();
    cy.get("#submit").click();
    cy.get("pre").should(
      compareJson({
        age: 10.3,
        nested: { optional: "optional" },
        nullableStruct: null,
      })
    );
    cy.get("#toggleNullable").click();
    cy.get("#submit").click();
    cy.get("pre").should(
      compareJson({
        age: 10.3,
        nested: { optional: "optional" },
        nullableStruct: { id: "hi" },
      })
    );
  });
});
