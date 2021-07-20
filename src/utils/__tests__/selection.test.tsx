import React from 'react';
import { mount } from '@cypress/react';
import { snapshotSelection, restoreSelection } from '../selection';

it('should restore focused elements', async () => {
  await mount(<button id="button">Focusable</button>).promisify();

  let button: HTMLElement | null = null;

  await cy.get('button').as('button').then($el => {
    button = $el.get(0);
  }).focus().promisify();

  const selection = snapshotSelection();

  // check selection matches expected state
  expect(selection).to.deep.equal({
    element: button,
    method: 'focus',
  });

  // unfocus the button
  await cy.realPress('Tab');
  await cy.focused().should('not.exist').promisify();

  // restore the snapshotted selection
  restoreSelection(selection);
  await cy.focused().should('exist').promisify();
  await cy.get('@button').should('have.focus').promisify();
});

it('should restore input selections', async () => {
  await mount(<input type="text" name="text" />).promisify();

  let input: HTMLElement | null = null;

  await cy.get('input').as('input').then($el => {
    input = $el.get(0);
  }).focus().promisify();

  // type and move selection
  await cy.realType('test');
  await cy.realPress('ArrowLeft');
  await cy.realPress('ArrowLeft');

  const selection = snapshotSelection();

  // check selection matches expected state
  expect(selection).to.deep.equal({
    element: input,
    method: 'setSelectionRange',
    arguments: [2, 2, 'none'],
  });

  // unfocus the input
  await cy.realPress('Tab');
  await cy.focused().should('not.exist').promisify();

  // restore the snapshotted selection
  restoreSelection(selection);
  await cy.focused().should('exist').promisify();

  // modify input at selected caret and check value
  await cy.realType('test');
  await cy.get('@input').should('have.value', 'tetestst').promisify();
});

it('should restore selections otherwise', async () => {
  await mount(<div contentEditable="true" id="editable"></div>).promisify();

  let div: HTMLElement | null = null;

  await cy.get('#editable').as('editable').then($el => {
    div = $el.get(0);
  }).focus().promisify();

  // type and move selection
  await cy.realType('test');
  await cy.realPress('ArrowLeft');
  await cy.realPress('ArrowLeft');

  const selection = snapshotSelection();

  // check selection matches expected state
  expect(selection).to.have.property('element', div);
  expect(selection).to.have.property('method', 'range');
  expect(selection).to.have.property('range');

  // unfocus the input
  await cy.realPress('Tab');
  await cy.focused().should('not.exist').promisify();

  // restore the snapshotted selection
  restoreSelection(selection);
  await cy.focused().should('exist').promisify();

  // modify input at selected caret and check value
  await cy.realType('test');
  await cy.get('@editable').should('have.text', 'tetestst').promisify();
});
