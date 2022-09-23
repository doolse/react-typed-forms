import { valMessage, compareJson } from "../lib";

describe("Simple html5 test", () => {
  it("Works", () => {
    cy.visit("/simple");
    cy.contains("First Name");
    cy.get("#firstName").type("Doolse");
    cy.get("#submit").click();
    cy.get("#lastName").then(valMessage("Required field"));
    cy.get("#lastName").type("Mahinnis");
    cy.get("#submit").click();
    cy.get("pre").should(
      compareJson({ firstName: "Doolse", lastName: "Mahinnis" })
    );
  });
});
