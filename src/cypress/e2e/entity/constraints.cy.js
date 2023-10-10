import {MSGS, PATHS, DATA, WAIT, SELECTORS} from "../../config/constants";

describe(`${MSGS.name}.${MSGS.entity}.Constraints`, () => {
    beforeEach(() => {
        cy.login()
        cy.visit(PATHS.search)
    })
    context('While creating an entity of type Sample, the following constraints apply:', () => {
        it('An Organ can be a descendant of a Source', () => {
            cy.sampleConstraint()
        })

        // DEP: Requires having a sample of type Section
        it('A suspension can be a descendant of a tissue section', () => {
            // DEP: Requires having a sample of type Section
            cy.sampleConstraint({name: 'Sample', keyword: DATA.sample.section.sennetId}, {name: 'Sample', index: 1}, ['Suspension'])
        })

        it('A suspension can be the direct descendant of an organ of type blood', () => {
            const searchTable = ($tr, constraints) => {
                cy.searchTable('SNT687.SFVJ.758')
                cy.wait(WAIT.time)
                cy.checkSampleCategories(constraints)
            }
            // DEP: Requires having a sample of type Organ
            cy.basicConstraint({name: 'Sample', category: 'Organ'}, {name: 'Sample', index: 1}, ['Suspension'], {callback: searchTable})
        })

        // DEP: Requires having a sample of type Organ
        context('When a Sample of type Organ is selected as ancestor:', () => {
            it('A tissue block, section, suspension or organ can be a descendant thereof', () => {
                cy.sampleConstraint({name: 'Sample', keyword: DATA.sample.organBrain.sennetId}, {name: 'Sample', index: 1}, ['Block'])
            })
        })

        // DEP: Requires having a sample of type Block
        context('When a Sample of type Block is selected as ancestor:', () => {
            it('A tissue section, block or suspension can be a descendant thereof', () => {
                cy.sampleConstraint({name: 'Sample', keyword: DATA.sample.block.sennetId}, {name: 'Sample', index: 1}, ['Block', 'Section', 'Suspension'])
            })
        })
    })

    context('While creating an entity of type Dataset, the following constraints apply:', () => {
        it('Tissue section, block and suspension can be ancestors thereof', () => {
            const searchTable = ($tr, constraints) => {
                cy.get(`${SELECTORS.table.tr}`).each(($el, i) => {
                    const text = $el.find(SELECTORS.table.cell).eq(2).find('div').text()
                    cy.log('Category', text)
                    const pos = constraints.indexOf(text)
                    cy.wrap(pos).should('not.eql', -1)
                })
            }
            cy.basicConstraint({name: 'Sample' }, {name: 'Dataset', index: 2}, ['Section', 'Block', 'Suspension'], {callback: searchTable})
        })
    })


})