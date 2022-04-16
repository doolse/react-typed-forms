import { valMessage, compareJson } from "../lib";

describe("Validation", () => {
  it("Works", () => {
    cy.visit("/validation");
    cy.contains("Validation Example");
    cy.get("#email > .form-control").type("doolse");
    cy.get("#async > .form-control").type("Not OK");
    cy.get("#email > .invalid-feedback").should(
      "have.text",
      "Invalid email address"
    );
    cy.get("#email > .form-control").type("@gmail.com");
    cy.get("#email > .invalid-feedback").should("have.text", "");
    cy.get("#async > .invalid-feedback").should(
      "have.text",
      'Error: "Not OK" is not "OK"'
    );
    cy.get("#async > .form-control").clear().type("OK");
    cy.get("#async > .invalid-feedback").should("have.text", "");
    cy.get("#submit").click();

    cy.contains("#validFlag", "true");

    cy.get("pre").should(
      compareJson({
        email: "doolse@gmail.com",
        async: "OK",
        array: [],
      })
    );

    cy.get("#add").click();
    cy.contains("#validFlag", "false");
  });
});
