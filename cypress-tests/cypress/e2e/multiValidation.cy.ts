import { valMessage, compareJson } from "../lib";

describe("Multi Validation", () => {
  it("Works", () => {
    cy.visit("/multiValidation");
    cy.contains("Multi Validation Example");
    cy.get("pre").should(
      compareJson({
        errors: {
          default: "its empty",
        },
        error: "its empty",
      })
    );
    cy.get("#email > .form-control").type("doolse");
    cy.get("pre").should(
      compareJson({
        errors: {
          Smotho: "it aint 'Smoth'",
          length: "It's too long",
        },
        error: "it aint 'Smoth'",
      })
    );
    cy.get("#email > .form-control").clear().type("Smoth");
    cy.get("pre").should(
      compareJson({
        errors: {
          length: "It's too long",
        },
        error: "It's too long",
      })
    );
    cy.get("#clearErrors").click();
    cy.get("pre").should(
      compareJson({
        errors: {},
        error: null,
      })
    );
    cy.get("#email > .form-control").clear();
    cy.get("pre").should(
      compareJson({
        errors: {
          default: "its empty",
        },
        error: "its empty",
      })
    );
  });
});
