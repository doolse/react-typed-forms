import { valMessage, compareJson } from "../lib";

describe("Schemas Test", () => {
  it("Works", () => {
    cy.visit("/form");
    cy.contains("Simple Schema Test");
    cy.contains("div", "First Name").type("Jolse");
    cy.contains("div", "Middle Name").type("Voltron");
    cy.contains("div", "Last Name").type("Smoth");
    cy.contains("div", "Gender").find("select").select("Male");
    cy.contains("button", "Add Compound Collection").click();
    cy.contains("div label", "Compound collection")
      .parent()
      .contains("div", "Nested")
      .type("Nested data");
    cy.get("pre").should(
      compareJson({
        date: "2024-10-12",
        first: "Jolse",
        middle: "Voltron",
        last: "Smoth",
        gender: "M",
        compound: {},
        compoundOptional: [],
        compoundCollection: [
          {
            nest: "Nested data",
          },
        ],
        compoundCollectionWithDefault: [
          {
            nest: "wow",
          },
          {
            nest: "wow2",
          },
        ],
        compoundDynamic: [
          {
            nest: "DYNAMIC",
          },
        ],
      }),
    );
  });
});
