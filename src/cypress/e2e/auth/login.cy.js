import {MSGS, PATHS} from "../../config/constants";

describe(`${MSGS.name}.Auth`, () => {

  it('Can login', () => {
    cy.login()
  })
})