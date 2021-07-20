import React, { ReactNode, useState, useLayoutEffect, useRef } from 'react';
import { mount } from '@cypress/react';

import { makePriorityHook } from '../usePriority';

const usePriority = makePriorityHook();

const FocusOnPriority = (
  { id, children = null }:
  { id: string, children?: ReactNode }
) => {
  const ref = useRef<HTMLDivElement>(null);
  const hasPriority = usePriority(ref);

  useLayoutEffect(() => {
    if (hasPriority && ref.current) {
      ref.current!.focus();
    }
  }, [hasPriority, ref]);

  return (
    <div tabIndex={-1} ref={ref} id={id}>
      {children}
    </div>
  );
};

it('allows sole element to take priority', () => {
  mount(
    <FocusOnPriority id="only" />
  );

  cy.focused().should('have.id', 'only');
});

it('tracks priority of sibling elements in order', () => {
  mount(
    <main>
      <FocusOnPriority id="first" />
      <FocusOnPriority id="second" />
    </main>
  );

  cy.focused().should('have.id', 'second');
});

it('tracks priority of nested elements in order', () => {
  mount(
    <FocusOnPriority id="outer">
      <FocusOnPriority id="inner" />
    </FocusOnPriority>
  );

  cy.focused().should('have.id', 'inner');
});

it('should switch priorities of sibling elements as needed', () => {
  const App = () => {
    const [visible, setVisible] = useState(true);

    return (
      <main>
        <FocusOnPriority id="first" />
        {visible && <FocusOnPriority id="second" />}
        <button onClick={() => setVisible(false)}>switch</button>
      </main>
    );
  };

  mount(<App />);

  cy.focused().should('have.id', 'second');
  cy.get('button').first().click();
  cy.focused().should('have.id', 'first');
});

it('should switch priorities of nested elements as needed', () => {
  const App = () => {
    const [visible, setVisible] = useState(true);

    return (
      <main>
        <FocusOnPriority id="outer">
          {visible && <FocusOnPriority id="inner" />}
        </FocusOnPriority>
        <button onClick={() => setVisible(false)}>switch</button>
      </main>
    );
  };

  mount(<App />);

  cy.focused().should('have.id', 'inner');
  cy.get('button').first().click();
  cy.focused().should('have.id', 'outer');
});

it('should preserve priorities when non-prioritised item is removed', () => {
  const App = () => {
    const [visible, setVisible] = useState(true);

    return (
      <main>
        {visible && <FocusOnPriority id="first" />}
        <FocusOnPriority id="second" />
        <button onClick={() => setVisible(false)}>switch</button>
      </main>
    );
  };

  mount(<App />);

  cy.focused().should('have.id', 'second');
  cy.get('button').first().click();
  cy.get('button').first().should('have.focus');
});

it('should update priorities when new prioritised item is added', () => {
  const App = () => {
    const [visible, setVisible] = useState(false);

    return (
      <main>
        <FocusOnPriority id="first" />
        <FocusOnPriority id="second" />
        {visible && <FocusOnPriority id="third" />}
        <button onClick={() => setVisible(true)}>switch</button>
      </main>
    );
  };

  mount(<App />);

  cy.focused().should('have.id', 'second');
  cy.get('button').first().click();
  cy.focused().should('have.id', 'third');
});
