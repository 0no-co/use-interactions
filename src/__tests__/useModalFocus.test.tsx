import React, { useState, useRef } from 'react';
import { mount } from '@cypress/react';

import { useModalFocus } from '../useModalFocus';

it('keeps the focus loop inside a given modal component', () => {
  const Modal = () => {
    const ref = useRef<HTMLDivElement>(null);
    useModalFocus(ref);

    return (
      <div aria-modal="true" ref={ref}>
        <button>Focus 1</button>
        <button>Focus 2</button>
        <button>Focus 3</button>
      </div>
    );
  };

  mount(
    <main>
      <button className="outside">No Focus</button>
      <Modal />
      <button className="outside">No Focus</button>
    </main>
  );

  // starts out with first element available
  cy.focused().contains('Focus 1');

  // cycles through the modal's focusable targets only
  cy.realPress('Tab');
  cy.focused().contains('Focus 2');
  cy.realPress('Tab');
  cy.focused().contains('Focus 3');
  cy.realPress('Tab');
  cy.focused().contains('Focus 1');
  cy.realPress(['Shift', 'Tab']);
  cy.focused().contains('Focus 3');

  // prevents focus of outside elements
  cy.get('.outside').first().focus();
  cy.focused().contains('Focus 1');
});

it('allows nested modals where the outer modal becomes inactive', () => {
  const ModalOne = () => {
    const ref = useRef<HTMLDivElement>(null);
    useModalFocus(ref);

    return (
      <div aria-modal="true" ref={ref}>
        <button className="inside">Never Focus</button>
        <ModalTwo />
      </div>
    );
  };

  const ModalTwo = () => {
    const ref = useRef<HTMLDivElement>(null);
    useModalFocus(ref);

    return (
      <div aria-modal="true" ref={ref}>
        <button className="inside">Focus 1</button>
      </div>
    );
  };

  mount(
    <main>
      <button className="outside">Never Focus</button>
      <ModalOne />
    </main>
  );

  // starts out with first element available
  cy.focused().contains('Focus 1');
  // keeps focus inside `ModalTwo`
  cy.realPress('Tab');
  cy.focused().contains('Focus 1');
  // prevents focus of `ModalOne`
  cy.get('.inside').first().focus();
  cy.focused().contains('Focus 1');
  // prevents focus of outside elements
  cy.get('.outside').first().focus();
  cy.focused().contains('Focus 1');
});

it('allows modals in semantic order where the preceding modal becomes inactive', () => {
  const ModalOne = () => {
    const ref = useRef<HTMLDivElement>(null);
    useModalFocus(ref);

    return (
      <div aria-modal="true" ref={ref}>
        <button className="inside">Never Focus</button>
      </div>
    );
  };

  const ModalTwo = () => {
    const ref = useRef<HTMLDivElement>(null);
    useModalFocus(ref);

    return (
      <div aria-modal="true" ref={ref}>
        <button className="inside">Focus 1</button>
      </div>
    );
  };

  mount(
    <main>
      <button className="outside">Never Focus</button>
      <ModalOne />
      <ModalTwo />
    </main>
  );

  // starts out with first element available
  cy.focused().contains('Focus 1');
  // keeps focus inside `ModalTwo`
  cy.realPress('Tab');
  cy.focused().contains('Focus 1');
  // prevents focus of `ModalOne`
  cy.get('.inside').first().focus();
  cy.focused().contains('Focus 1');
  // prevents focus of outside elements
  cy.get('.outside').first().focus();
  cy.focused().contains('Focus 1');
});

it('switches focus when nested modal closes', () => {
  const ModalOne = () => {
    const [nested, setNested] = useState(true);
    const ref = useRef<HTMLDivElement>(null);

    useModalFocus(ref);

    const onClose = () => {
      setNested(false);
    };

    return (
      <div aria-modal="true" ref={ref}>
        <button className="inside">Outer Focus</button>
        {nested && <ModalTwo onClose={onClose} />}
      </div>
    );
  };

  const ModalTwo = ({ onClose }) => {
    const ref = useRef<HTMLDivElement>(null);
    useModalFocus(ref);

    return (
      <div aria-modal="true" ref={ref}>
        <button className="inside" onClick={onClose}>Inner Focus</button>
      </div>
    );
  };

  mount(
    <main>
      <button className="outside">Never Focus</button>
      <ModalOne />
    </main>
  );

  // starts out with first element available
  cy.focused().contains('Inner Focus');
  // keeps `InnerModal` focused
  cy.realPress('Tab');
  cy.focused().contains('Inner Focus');
  // switches focus when inner modal closes
  cy.focused().realClick();
  cy.focused().contains('Outer Focus');
});
