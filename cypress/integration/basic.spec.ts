import { valMessage, compareJson } from "../lib";

describe("Simple Bootstrap Form", () => {
  it("Works", () => {
    cy.visit("/basic");
    cy.contains("Basic Form Example");
    cy.get("#submit").click();
    cy.get("#username").then(valMessage("Required field"));
    cy.get("#username").type("doolse");
    cy.get("#submit").click();
    cy.get("#password").then(valMessage("Password must be 6 characters"));
    cy.get("#password").type("MyPassword");
    cy.get("#number").select("1");
    cy.get("#toggleDisabled").click();
    cy.get("#username").should("be.disabled");
    cy.get("#password").should("be.disabled");
    cy.get("#number").should("be.disabled");
    cy.get("#submit").click();
    cy.get("#renderCount").should("have.text", "5");
    cy.get("pre").should(
      compareJson({
        password: "MyPassword",
        username: "doolse",
        number: "one",
      })
    );
  });
});
