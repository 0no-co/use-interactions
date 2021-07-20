import React, { useState, useRef } from 'react';
import { mount } from '@cypress/react';

import { useMenuFocus } from '../useMenuFocus';

it('allows menus to be navigated via dialog-like controls', () => {
  const Menu = () => {
    const ref = useRef<HTMLUListElement>(null);
    useMenuFocus(ref);

    return (
      <ul ref={ref}>
        <li tabIndex={0}>#1</li>
        <li tabIndex={0}>#2</li>
        <li tabIndex={0}>#3</li>
      </ul>
    );
  };

  mount(
    <main>
      <button tabIndex={-1}>Start</button>
      <Menu />
    </main>
  );

  // Focus button first
  cy.get('button').first().focus();
  cy.focused().contains('Start');

  // permits regular tab order
  cy.realPress('Tab');
  cy.realPress('Tab');
  cy.focused().contains('#2');

  // permits arrow-key tabbing
  cy.realPress('ArrowDown');
  cy.focused().contains('#3');
  cy.realPress('ArrowUp');
  cy.focused().contains('#2');
  cy.realPress('ArrowRight');
  cy.focused().contains('#3');
  cy.realPress('ArrowLeft');
  cy.focused().contains('#2');

  // permits special key navigation
  cy.realPress('Home');
  cy.focused().contains('#1');
  cy.realPress('End');
  cy.focused().contains('#3');

  // releases focus to original element on escape
  cy.realPress('Escape');
  cy.focused().contains('Start');
});

it('prevents Left/Right arrow keys from overriding input actions', () => {
  const Menu = () => {
    const ref = useRef<HTMLDivElement>(null);
    useMenuFocus(ref);

    return (
      <div ref={ref}>
        <input type="text" name="text" />
        <button>Focus</button>
      </div>
    );
  };

  mount(<Menu />);

  // focus the input
  cy.get('input').first().as('input').focus();
  cy.focused().should('have.property.name', 'text');

  // arrow Left/Right should not change focus
  cy.realPress('ArrowRight');
  cy.get('@input').should('be.focused');
  cy.realPress('ArrowLeft');
  cy.get('@input').should('be.focused');

  // arrow Down/Up should change focus
  cy.realPress('ArrowDown');
  cy.get('@input').should('not.be.focused');
  cy.realPress('ArrowUp');
  cy.get('@input').should('be.focused');
});
