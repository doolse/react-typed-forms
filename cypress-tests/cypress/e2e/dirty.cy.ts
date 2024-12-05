import { compareJson, valMessage } from "../lib";

describe("Dirty flags", () => {
  it("Works", () => {
    cy.visit("/dirty");
    cy.contains("#not_form", "clean").click();
    cy.contains("#not_firstName", "clean").click();
    cy.contains("#not_lastName", "clean").click();
    cy.contains("#last_form", "dirty").click();
    cy.contains("#last_firstName", "clean").click();
    cy.contains("#last_lastName", "dirty").click();
    // TODO re-enable when values are synced properly - cy.contains("#oneField_form", "dirty").click();
    cy.contains("#oneField_firstName", "clean").click();
  });
});
