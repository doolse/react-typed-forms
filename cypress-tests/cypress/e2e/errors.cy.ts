import { valMessage, compareJson } from "../lib";

describe("Validation", () => {
  it("Works", () => {
    cy.visit("/errors");
    cy.contains("Errors");
    cy.contains("button", "Cool").click();
    cy.get("pre").should(
      compareJson({
        default: "cool",
      })
    );
    cy.contains("button", "blank").click();
    cy.get("pre").should(compareJson({}));
    cy.contains("button", "default").click();
    cy.get("pre").should(compareJson({ default: "default" }));
    cy.contains("button", "another wow").click();
    cy.get("pre").should(compareJson({ default: "default", another: "wow" }));
    cy.contains("button", "another wow2").click();
    cy.get("pre").should(compareJson({ another: "wow" }));
  });
});
