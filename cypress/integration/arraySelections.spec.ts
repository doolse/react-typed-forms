import { valMessage, compareJson } from "../lib";

describe("Array Selections", () => {
  it("Works", () => {
    cy.visit("/arraySelections");
    cy.contains("Array Selections Example");
    cy.get("#submit").click();
    cy.get("pre").should(compareJson([{ first: "Jolse", last: "Maginnis" }]));
    cy.get(".row_0 .enabled").click();
    cy.get("#submit").click();
    cy.get("pre").should(compareJson([]));
    cy.get(".row_1 .enabled").click();
    cy.get(".row_2 .enabled").click();
    cy.get("#submit").click();
    cy.get("pre").should(
      compareJson([
        { first: "Thomas", last: "" },
        { first: "Nicholas", last: "" },
      ])
    );
    cy.get(".row_1 .enabled").click();
    cy.get(".row_2 .enabled").click();
    cy.get(".row_0 .enabled").click();
    cy.contains("#dirtyFlag", "false");
    cy.get("#setValue").click();
    cy.contains("#dirtyFlag", "true");
    cy.get("#submit").click();
    cy.get("pre").should(compareJson([{ first: "Thomas", last: "" }]));
    cy.get("#clean").click();
    cy.get(".row_0 .lastField").type("This won't matter");
    cy.contains("#dirtyFlag", "false");
  });
});
