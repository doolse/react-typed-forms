import { valMessage, compareJson } from "../lib";

describe("Mapped", () => {
  it("Works", () => {
    cy.visit("/mapped");
    cy.contains("Mapped control test");
    cy.get("#firstName").type("doolse");
    cy.get("#age").type("23");
    cy.get("#anotherField").type("OK");
    cy.get("pre").should(
      compareJson({
        firstName: "DOOLSE",
        age: 23,
      })
    );
    cy.get("#resetData").click();
    cy.get("pre").should(
      compareJson({
        firstName: "RESET",
        age: 10,
      })
    );
  });
});
