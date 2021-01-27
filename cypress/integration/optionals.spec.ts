import { valMessage, compareJson } from "../lib";

describe("Validation", () => {
  it("Works", () => {
    cy.visit("/optionals");
    cy.contains("Optionals Test");

    cy.get("#submit").click();
    cy.get("pre").should(
      compareJson({
        nested: {},
      })
    );
    cy.get("#firstName").type("a").clear();
    cy.get("#lastName").type("a").clear();
    cy.get("#submit").click();
    cy.get("pre").should(
      compareJson({
        firstName: "",
        lastName: "",
        nested: {},
      })
    );
    cy.get("#resetData").click();
    cy.get("#submit").click();
    cy.get("pre").should(
      compareJson({
        nested: {},
      })
    );
  });
});
