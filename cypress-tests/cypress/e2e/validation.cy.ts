import { valMessage, compareJson } from "../lib";

describe("Validation", () => {
  it("Works", () => {
    cy.visit("/validation");
    cy.contains("Validation Example");
    cy.get("#email > .form-control").type("doolse");
    cy.get("#async > .form-control").type("Not OK");
    cy.get("#email > .invalid-feedback").should(
      "have.text",
      "Invalid email address",
    );
    cy.get("#email > .form-control").type("@gmail.com");
    cy.get("#email > .invalid-feedback").should("have.text", "");
    cy.get("#async > .invalid-feedback").should(
      "have.text",
      'Error: "Not OK" is not "OK"',
    );
    cy.get("#async > .form-control").clear().type("OK");
    cy.get("#async > .invalid-feedback").should("have.text", "");

    cy.get("#validate").click();
    cy.get("#hook > .invalid-feedback").should("have.text", "Hook not empty");
    cy.get("#clearErrors").click();
    cy.get("#hook > .invalid-feedback").should("have.text", "");
    cy.get("#validate").click();
    cy.get("#hook > .invalid-feedback").should("have.text", "Hook not empty");
    cy.get("#hook > .form-control").type("OK");

    cy.contains("#validFlag", "true");
    cy.get("#submit").click();

    cy.get("pre").should(
      compareJson({
        email: "doolse@gmail.com",
        async: "OK",
        array: [],
        hook: "OK",
      }),
    );

    cy.get("#add").click();
    cy.contains("#validFlag", "false");
  });
});
