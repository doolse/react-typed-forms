import { valMessage, compareJson } from "../lib";

describe("Optional data", () => {
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
    cy.get("#age").type("10").clear();
    cy.get("#submit").click();
    cy.get("pre").should(
      compareJson({
        firstName: "",
        age: null,
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
    cy.get("#age").type("10.3");
    cy.get("#submit").click();
    cy.get("pre").should(
      compareJson({
        age: 10.3,
        nested: {},
      })
    );
  });
});
