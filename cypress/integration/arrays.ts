import { valMessage, compareJson } from "../lib";

describe("Arrays", () => {
  it("Works", () => {
    cy.visit("/arrays");
    cy.contains("Arrays Example");
    cy.get("#string-1 input").type("First string");
    cy.get("#addString").click();
    cy.get("#string-2 input").type("Second string");
    cy.get("#addString").click();
    cy.get("#string-3 input").type("Third string");
    cy.get("#string-2 button").click();
    cy.get("#obj-1 .idField").type("1");
    cy.get("#obj-1 .nameField").type("One");
    cy.get("#addObj").click();
    cy.get("#obj-2 .idField").type("2");
    cy.get("#obj-2 .nameField").type("Two");
    cy.get("#addObj").click();
    cy.get("#obj-3 .idField").type("3");
    cy.get("#obj-3 .nameField").type("Three");
    cy.get("#obj-1 button").click();
    cy.get("#toggleDisabled").click();
    cy.get("#string-1 input").should("be.disabled");
    cy.get("#string-2 input").should("be.disabled");
    cy.get("#obj-1 .idField").should("be.disabled");
    cy.get("#obj-2 .idField").should("be.disabled");
    cy.get("#obj-1 .nameField").should("be.disabled");
    cy.get("#obj-2 .nameField").should("be.disabled");
    cy.get("#submit").click();
    cy.get("pre").should(
      compareJson({
        strings: ["First string", "Third string"],
        structured: [
          { id: "2", name: "Two" },
          { id: "3", name: "Three" },
        ],
      })
    );
  });
});
