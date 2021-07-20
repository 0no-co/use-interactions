import React from 'react';
import { mount } from '@cypress/react';
import { RestoreSelection, snapshotSelection, restoreSelection } from '../selection';

it('should restore focused elements', () => {
  let selection: RestoreSelection | null = null;

  mount(<button id="button">Focusable</button>);
  cy.get('button').as('button').focus();

  // snapshot the selection
  cy.get('@button').then($el => {
    selection = snapshotSelection();

    // check selection matches expected state
    expect(selection).to.deep.equal({
      element: $el.get(0),
      method: 'focus',
    });
  });

  // unfocus the button
  cy.realPress('Tab');
  cy.focused().should('not.exist');

  // restore the snapshotted selection
  cy.get('@button').then(() => {
    restoreSelection(selection);
  });

  cy.focused().should('exist');
  cy.get('@button').should('have.focus');
});

it('should restore input selections', () => {
  let selection: RestoreSelection | null = null;

  mount(<input type="text" name="text" />);

  // type and move selection
  cy.get('input').as('input').focus();
  cy.realType('test');
  cy.realPress('ArrowLeft');
  cy.realPress('ArrowLeft');

  // snapshot the selection
  cy.get('@input').then($el => {
    selection = snapshotSelection();

    // check selection matches expected state
    expect(selection).to.deep.equal({
      element: $el.get(0),
      method: 'setSelectionRange',
      arguments: [2, 2, 'none'],
    });
  });

  // unfocus the input
  cy.realPress('Tab');
  cy.focused().should('not.exist');

  // restore the snapshotted selection
  cy.get('@input').then(() => {
    restoreSelection(selection);
  });

  // modify input at selected caret and check value
  cy.focused().should('exist');
  cy.realType('test');
  cy.get('@input').should('have.value', 'tetestst');
});

it('should restore selections otherwise', async () => {
  let selection: RestoreSelection | null = null;

  // type and move selection
  cy.get('#editable').as('editable').focus();
  cy.realType('test');
  cy.realPress('ArrowLeft');
  cy.realPress('ArrowLeft');

  // snapshot the selection
  cy.get('@editable').then($el => {
    selection = snapshotSelection();

    // check selection matches expected state
    expect(selection).to.have.property('element', $el.get(0));
    expect(selection).to.have.property('method', 'range');
    expect(selection).to.have.property('range');
  });

  // unfocus the input
  cy.realPress('Tab');
  cy.focused().should('not.exist');

  // restore the snapshotted selection
  cy.get('@editable').then(() => {
    restoreSelection(selection);
  });

  // modify input at selected caret and check value
  cy.focused().should('exist');
  cy.realType('test');
  cy.get('@editable').should('have.text', 'tetestst');
});
