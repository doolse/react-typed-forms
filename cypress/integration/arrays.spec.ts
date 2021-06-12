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
    cy.get("#addStartString").click();
    cy.get("#string-1 input").type("Zero string");
    cy.get("#obj-1 .idField").type("1");
    cy.get("#obj-1 .nameField").type("One");
    cy.get("#addObj").click();
    cy.get("#obj-2 .idField").type("2");
    cy.get("#obj-2 .nameField").type("Two");
    cy.get("#addObj").click();
    cy.get("#obj-3 .idField").type("3");
    cy.get("#obj-3 .nameField").type("Three");
    cy.get("#obj-1 .remove").click();
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
        strings: ["Zero string", "First string", "Third string"],
        structured: [
          { id: "2", name: "Two" },
          { id: "3", name: "Three" },
        ],
      })
    );
    cy.get("#toggleDisabled").click();
    cy.contains("#dirtyFlag", "true");
    cy.get("#setObj").click();
    cy.contains("#dirtyFlag", "false");
    cy.get("#addObj").click();
    cy.contains("#dirtyFlag", "true");
    cy.get("#obj-3 .remove").click();
    cy.contains("#dirtyFlag", "false");
    cy.get("#obj-1 .idField").type("1");
    cy.contains("#dirtyFlag", "true");
    cy.get("#clean").click();
    cy.contains("#dirtyFlag", "false");
    cy.get("#setObj").click();
    cy.get("#obj-1 .down").click();
    cy.get("#submit").click();
    cy.get("pre").should(
      compareJson({
        strings: ["Zero string", "First string", "Third string"],
        structured: [
          { id: "id", name: "Name" },
          { id: "reset", name: "Reset" },
        ],
      })
    );
    cy.get("#obj-2 .up").click();
    cy.get("#submit").click();
    cy.get("pre").should(
      compareJson({
        strings: ["Zero string", "First string", "Third string"],
        structured: [
          { id: "reset", name: "Reset" },
          { id: "id", name: "Name" },
        ],
      })
    );
    cy.get("#addObj").click();
    cy.contains("#validFlag", "false");
    cy.get("#obj-3 .remove").click();
    cy.contains("#validFlag", "true");
  });
});
