import React, { useRef } from 'react';
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

it('supports being attached to an owner element', () => {
  const Menu = () => {
    const ownerRef = useRef<HTMLInputElement>(null);
    const ref = useRef<HTMLUListElement>(null);

    useMenuFocus(ref, { ownerRef });

    return (
      <main>
        <input type="search" name="search" ref={ownerRef} />
        <ul ref={ref}>
          <li tabIndex={0}>#1</li>
          <li tabIndex={0}>#2</li>
          <li tabIndex={0}>#3</li>
        </ul>
      </main>
    );
  };

  mount(<Menu />);

  // focus the input
  cy.get('input').first().as('input').focus();
  cy.focused().should('have.property.name', 'search');

  // pressing escape on input shouldn't change focus
  cy.realPress('Escape');
  cy.get('@input').should('have.focus');

  // pressing arrow down should start focusing the menu
  cy.get('@input').focus();
  cy.realPress('ArrowDown');
  cy.focused().contains('#1');

  // pressing arrow up should start focusing the last item
  cy.get('@input').focus();
  cy.realPress('ArrowUp');
  cy.focused().contains('#3');

  // pressing enter should start focusing the first item
  cy.get('@input').focus();
  cy.realPress('Enter');
  cy.focused().contains('#1');

  // typing regular values should refocus the owner input
  cy.get('li').first().focus();
  cy.realType('test');
  cy.get('@input').should('have.focus').should('have.value', 'test');

  // pressing escape should refocus input
  cy.get('li').first().focus();
  cy.realPress('Escape');
  cy.get('@input').should('have.focus');
});

it('behaves nicely for nested menus', () => {
  const InnerMenu = () => {
    const ref = useRef<HTMLUListElement>(null);
    useMenuFocus(ref);

    return (
      <ul ref={ref}>
        <li tabIndex={0}>Inner #1</li>
        <li tabIndex={0}>Inner #2</li>
      </ul>
    );
  };

  const OuterMenu = () => {
    const ref = useRef<HTMLUListElement>(null);
    useMenuFocus(ref);

    return (
      <ul ref={ref}>
        <li tabIndex={0}>Outer #1</li>
        <InnerMenu />
      </ul>
    );
  };

  mount(
    <main>
      <button tabIndex={-1}>Start</button>
      <OuterMenu />
    </main>
  );

  // Moves into the inner menu as needed
  cy.get('button').first().focus();
  cy.focused().contains('Start');
  cy.realPress('Tab');
  cy.focused().contains('Outer #1');
  cy.realPress('Tab');
  cy.focused().contains('Inner #1');
  cy.realPress('Tab');
  cy.focused().contains('Inner #2');
  cy.realPress('ArrowDown');
  cy.focused().contains('Inner #1');
  cy.realPress('Escape');
  cy.focused().contains('Start');

  // Can move from outer to inner seamlessly
  cy.get('button').first().focus();
  cy.focused().contains('Start');
  cy.realPress('Tab');
  cy.focused().contains('Outer #1');
  cy.realPress('ArrowDown');
  cy.focused().contains('Inner #1');
  cy.realPress('ArrowDown');
  cy.focused().contains('Inner #2');
  cy.realPress('ArrowDown');
  cy.focused().contains('Inner #1');
});

it('should not focus first menu item if input is not part of the menu', () => {
  const Menu = () => {
    const ref = useRef<HTMLUListElement>(null);
    useMenuFocus(ref);

    return (
      <main>
        <input type="search" name="search" />
        <ul ref={ref}>
          <li tabIndex={0}>#1</li>
          <li tabIndex={0}>#2</li>
          <li tabIndex={0}>#3</li>
        </ul>
      </main>
    );
  };

  mount(<Menu />);

  // focus the input
  cy.get('input').first().as('input').focus();
  cy.focused().should('have.property.name', 'search');

  // pressing enter should not focus the first item
  cy.get('@input').focus();
  cy.realPress('Enter');
  cy.get('@input').should('have.focus');
});
