import { valMessage, compareJson } from "../lib";

describe("Arrays", () => {
  it("Works", () => {
    cy.visit("/exclusions");
    cy.contains("Exclusions Example");
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
  });
});
