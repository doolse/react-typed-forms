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
    cy.get("#previousValue").should(
      compareJson({
        previous: {
          firstName: "doolse",
          age: 23,
          anotherField: "OK",
        },
        current: {
          firstName: "Reset",
          age: 10,
          anotherField: "WOW",
        },
      })
    );
    cy.get("#selectedValue").should(compareJson("Reset"));
    cy.get("#sel2").click();
    cy.get("#selectedValue").should(compareJson("WOW"));
    cy.get("#anotherField").type("OK");
    cy.get("#selectedValue").should(compareJson("WOWOK"));
  });
});
