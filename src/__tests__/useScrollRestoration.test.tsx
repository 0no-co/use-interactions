import React, { useState, useRef } from 'react';
import { mount } from '@cypress/react';
import { useScrollRestoration } from '../useScrollRestoration';

it('remembers scroll states and restores scrolls on navigation', () => {
  const Main = () => {
    const [showBlock, setShowBlock] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    useScrollRestoration(ref);

    return (
      <div
        id="container"
        style={{ border: '1px solid red', overflowY: 'scroll', maxHeight: 100 }}
        ref={ref}
      >
        <div style={{ height: 400 }}>block #1</div>
        <button id="extend" onClick={() => setShowBlock(x => !x)}>Show Block</button>
        {showBlock && <div style={{ height: 400 }}>block #2</div>}
      </div>
    );
  };

  cy.window().then(window => {
    window.history.pushState({}, '', '' + window.location);
  });

  mount(<Main />);

  cy.get('#extend').realClick();
  cy.get('#container').scrollTo('bottom');
  cy.get('#container').trigger('scroll');

  cy.window().then(window => {
    window.history.pushState({}, '', '' + window.location + '?test');
  });

  cy.get('#container').invoke('scrollTop').should('not.equal', 0);
  cy.get('#container').scrollTo('top');

  cy.window().then(window => {
    window.history.back();
  });

  cy.get('#container').invoke('scrollTop').should('not.equal', 0);
});

it('waits to restore scroll position until required scrollHeight is reached', () => {
  const Main = () => {
    const [showBlock, setShowBlock] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    useScrollRestoration(ref);

    return (
      <div
        id="container"
        style={{ border: '1px solid red', overflowY: 'scroll', maxHeight: 100 }}
        ref={ref}
      >
        <div style={{ height: 400 }}>block #1</div>
        <button id="extend" onClick={() => setShowBlock(x => !x)}>Show Block</button>
        {showBlock && <div style={{ height: 400 }}>block #2</div>}
      </div>
    );
  };

  cy.window().then(window => {
    window.history.pushState({}, '', '' + window.location);
  });

  mount(<Main />);

  cy.get('#extend').realClick();
  cy.get('#container').scrollTo('bottom');
  cy.get('#container').trigger('scroll');

  cy.window().then(window => {
    window.history.pushState({}, '', '' + window.location + '?test');
  });

  cy.get('#container').invoke('scrollTop').should('not.equal', 0);
  cy.get('#extend').click();
  cy.get('#container').scrollTo('top');

  cy.window().then(window => {
    window.history.back();
  });

  cy.get('#container').invoke('scrollTop').should('equal', 0);
  // once the height is reached it'll scroll back
  cy.get('#extend').click();
  cy.get('#container').invoke('scrollTop').should('not.equal', 0);
});
