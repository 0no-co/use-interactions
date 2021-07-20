import React, { useState, useRef } from 'react';
import { mount } from '@cypress/react';

import { useDismissable } from '../useDismissable';

const Dialog = ({ focusLoss }: { focusLoss?: boolean }) => {
  const [visible, setVisible] = useState(true);
  const ref = useRef<HTMLDivElement>(null);

  const onDismiss = () => setVisible(false);
  useDismissable(ref, onDismiss, { focusLoss, disabled: !visible });

  return (
    <div ref={ref} role="dialog" style={{ display: visible ? 'block' : 'none' }}>
      <button className="inside">focusable</button>
    </div>
  );
};

it('is dismissed by clicking outside', () => {
  mount(
    <main>
      <button className="outside">outside</button>
      <Dialog />
    </main>
  );

  cy.get('.inside').as('inside').realClick();
  cy.get('@inside').should('be.visible');
  cy.get('.outside').first().realClick();
  cy.get('@inside').should('not.be.visible');
});

it('is not dismissed by clicking outside when it does not have priority', () => {
  mount(
    <main>
      <button className="outside">outside</button>
      <Dialog />
      <Dialog />
    </main>
  );

  cy.get('.inside').as('inside').should('be.visible');
  // at first not dismissed
  cy.get('.outside').first().realClick();
  cy.get('@inside').should('be.visible');
  // dismissed when the second Dialog loses focus
  cy.get('.outside').first().realClick();
  cy.get('@inside').should('not.be.visible');
});

it('is dismissed by tapping outside', () => {
  mount(
    <main>
      <button className="outside">outside</button>
      <Dialog />
    </main>
  );

  cy.get('.inside').as('inside').realClick();
  cy.get('@inside').should('be.visible');
  cy.get('.outside').first().realTouch();
  cy.get('@inside').should('not.be.visible');
});

it('is dismissed by pressing Escape', () => {
  mount(
    <main>
      <button className="outside">outside</button>
      <Dialog />
    </main>
  );

  cy.get('.inside').as('inside').should('be.visible');
  cy.realPress('Escape');
  cy.get('@inside').should('not.be.visible');
});

it('is not dismissed by pressing Escape when it does not have priority', () => {
  mount(
    <main>
      <button className="outside">outside</button>
      <Dialog />
      <Dialog />
    </main>
  );

  cy.get('.inside').as('inside').should('be.visible');
  // at first not dismissed
  cy.realPress('Escape');
  cy.get('@inside').should('be.visible');
  // dismissed when the second Dialog loses focus
  cy.realPress('Escape');
  cy.get('@inside').should('not.be.visible');
});

it('is dismissed without priority when it has focus', () => {
  const Second = () => {
    const ref = useRef<HTMLDivElement>(null);
    useDismissable(ref, () => {});
    return <div ref={ref} />;
  };

  mount(
    <main>
      <button className="outside">outside</button>
      <Dialog />
      <Second />
    </main>
  );

  cy.get('.inside').as('inside').should('be.visible');
  // not dismissed with escape press
  cy.realPress('Escape');
  cy.get('@inside').should('be.visible');
  // is dismissed when it has focus
  cy.get('@inside').focus();
  cy.realPress('Escape');
  cy.get('@inside').should('not.be.visible');
});

it('is dismissed when focus moves out of it, with focus loss active', () => {
  mount(
    <main>
      <button className="outside">outside</button>
      <Dialog focusLoss />
    </main>
  );

  cy.get('.inside').as('inside').should('be.visible');
  cy.get('@inside').focus();
  cy.get('@inside').should('be.visible');
  // is dismissed when it loses focus
  cy.realPress(['Shift', 'Tab']);
  cy.focused().contains('outside');
  cy.get('@inside').should('not.be.visible');
});
