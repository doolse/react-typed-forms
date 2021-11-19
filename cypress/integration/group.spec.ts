import { valMessage, compareJson } from "../lib";

describe("Groups", () => {
  it("Works", () => {
    cy.visit("/group");
    cy.contains("Group Test");
    cy.get("#firstName").type("doolse");
    cy.get("#age").type("23");
    cy.get("#anotherField").type("OK");
    cy.get("#updateCount").should("have.text", "8");
    cy.get("#updateParentCount").should("have.text", "10");
    cy.get("#resetData").click();
    cy.get("#updateCount").should("have.text", "9");
    cy.get("#resetSubData").click();
    cy.get("#updateParentCount").should("have.text", "12");
  });
});
