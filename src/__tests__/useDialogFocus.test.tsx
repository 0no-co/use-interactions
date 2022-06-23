import React, { useState, useRef } from 'react';
import { mount } from '@cypress/react';

import { useDialogFocus } from '../useDialogFocus';

it('allows dialogs to be navigated without an owner', () => {
  const Dialog = () => {
    const ref = useRef<HTMLUListElement>(null);
    useDialogFocus(ref);
    return (
      <ul ref={ref} role="dialog">
        <li tabIndex={0}>#1</li>
        <li tabIndex={0}>#2</li>
        <li tabIndex={0}>#3</li>
      </ul>
    );
  };

  const App = () => {
    const [hasDialog, setDialog] = useState(false);
    return (
      <main>
        <input type="text" name="text" onFocus={() => setDialog(true)} />
        {hasDialog && <Dialog />}
      </main>
    );
  };

  mount(<App />);

  cy.get('input').first().as('input').focus();
  cy.focused().should('have.property.name', 'text');

  // ArrowRight/ArrowLeft shouldn't affect the selection for inputs
  cy.realPress('ArrowRight');
  cy.realPress('ArrowLeft');
  cy.get('@input').should('have.focus');

  // Navigation with arrow keys is normal otherwise
  cy.realPress('ArrowDown');
  cy.realPress('ArrowDown');
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
  cy.get('@input').should('have.focus');
});

it('should not allow the dialog to be tabbable', () => {
  const Dialog = () => {
    const ref = useRef<HTMLUListElement>(null);
    useDialogFocus(ref);
    return (
      <div>
        <input type="text" name="text" />
        <ul ref={ref} role="dialog">
          <li tabIndex={0}>#1</li>
          <li tabIndex={0}>#2</li>
          <li tabIndex={0}>#3</li>
        </ul>
      </div>
    );
  };

  const App = () => {
    return (
      <main>
        <button>before</button>
        <Dialog />
        <button>after</button>
      </main>
    );
  };

  mount(<App />);

  cy.get('input').first().as('input').focus();
  cy.focused().should('have.property.name', 'text');

  // Tabbing should skip over the dialog
  cy.realPress('Tab');
  cy.focused().contains('after');
  // Tabbing back should skip over the dialog
  cy.realPress(['Shift', 'Tab']);
  cy.get('@input').should('have.focus');
  // Tabbing back on the owner shouldn't affect the dialog
  cy.realPress(['Shift', 'Tab']);
  cy.focused().contains('before');
  // It should still know which element the owner was
  cy.realPress('Tab');
  cy.realPress('ArrowDown');
  cy.focused().contains('#1');
  // From inside the dialog tabbing should skip out of the dialog
  cy.realPress('Tab');
  cy.focused().contains('after');
});

it('supports being attached to an owner element', () => {
  const Dialog = () => {
    const ownerRef = useRef<HTMLInputElement>(null);
    const ref = useRef<HTMLUListElement>(null);

    useDialogFocus(ref, { ownerRef });

    return (
      <main>
        <input type="text" name="text" ref={ownerRef} />
        <ul ref={ref} role="dialog">
          <li tabIndex={0}>#1</li>
          <li tabIndex={0}>#2</li>
          <li tabIndex={0}>#3</li>
        </ul>
      </main>
    );
  };

  mount(<Dialog />);

  cy.get('input').first().as('input').focus();
  cy.focused().should('have.property.name', 'text');

  // pressing escape on input shouldn't change focus
  cy.realPress('Escape');
  cy.get('@input').should('have.focus');

  // pressing arrow down should start focusing the menu
  cy.get('@input').focus();
  cy.realPress('ArrowDown');
  cy.focused().contains('#1');
  cy.realPress('ArrowDown');
  cy.focused().contains('#2');

  // tabbing should skip over the dialog items
  cy.realPress(['Shift', 'Tab']);
  cy.get('@input').should('have.focus');

  // pressing arrow up should start focusing the last item
  cy.get('@input').focus();
  cy.realPress('ArrowUp');
  cy.focused().contains('#3');

  // pressing enter should start focusing the first item
  cy.get('@input').focus();
  cy.realPress('Enter');
  cy.focused().contains('#1');

  // typing regular values should refocus the owner input
  cy.realType('test');
  cy.get('@input')
    .should('have.focus')
    .should('have.value', 'test');

  // pressing escape should refocus input
  cy.get('li').first().focus();
  cy.realPress('Escape');
  cy.get('@input').should('have.focus');
});

it('supports nested dialogs', () => {
  const InnerDialog = () => {
    const ref = useRef<HTMLUListElement>(null);
    useDialogFocus(ref);

    return (
      <ul ref={ref} role="dialog">
        <li tabIndex={0}>Inner #1</li>
        <li tabIndex={0}>Inner #2</li>
      </ul>
    );
  };

  const OuterDialog = () => {
    const [visible, setVisible] = useState(false);
    const [nested, setNested] = useState(false);
    const ref = useRef<HTMLUListElement>(null);

    useDialogFocus(ref, { disabled: !visible });

    return (
      <main>
        <input type="text" name="text" onFocus={() => setVisible(true)} />
        {visible && (
          <ul ref={ref} role="dialog">
            <li tabIndex={0}>Outer #1</li>
            <li tabIndex={0} onFocus={() => setNested(true)}>Outer #2</li>
            {nested && <InnerDialog />}
          </ul>
        )}
        <button>after</button>
      </main>
    );
  };

  mount(<OuterDialog />);

  cy.get('input').first().as('input').focus();
  cy.focused().should('have.property.name', 'text');

  // select first dialog
  cy.realPress('ArrowDown');
  cy.focused().contains('Outer #1');
  cy.realPress('ArrowDown');
  cy.focused().contains('Outer #2');

  // select second dialog
  cy.realPress('ArrowDown');
  cy.focused().contains('Inner #1');
  cy.realPress('ArrowDown');
  cy.focused().contains('Inner #2');

  // remains in inner dialog
  cy.realPress('ArrowDown');
  cy.focused().contains('Inner #1');

  // tabs to last dialog
  cy.realPress(['Shift', 'Tab']);
  cy.focused().contains('Outer #2');

  // arrows bring us back to the inner dialog
  cy.realPress('ArrowUp');
  cy.focused().contains('Inner #2');

  // tab out of dialogs
  cy.realPress('Tab');
  cy.focused().contains('after');
  // we can't reenter the dialogs
  cy.realPress(['Shift', 'Tab']);
  cy.get('@input').should('have.focus');
});

it('supports nested dialogs', () => {
  const InnerDialog = () => {
    const ref = useRef<HTMLUListElement>(null);
    useDialogFocus(ref);

    return (
      <ul ref={ref} role="dialog">
        <li tabIndex={0}>Inner #1</li>
        <li tabIndex={0}>Inner #2</li>
      </ul>
    );
  };

  const OuterDialog = () => {
    const [visible, setVisible] = useState(false);
    const [nested, setNested] = useState(false);
    const ref = useRef<HTMLUListElement>(null);

    useDialogFocus(ref, { disabled: !visible });

    return (
      <main>
        <input type="text" name="text" onFocus={() => setVisible(true)} />
        {visible && (
          <ul ref={ref} role="dialog">
            <li tabIndex={0}>Outer #1</li>
            <li tabIndex={0} onFocus={() => setNested(true)}>Outer #2</li>
            {nested && <InnerDialog />}
          </ul>
        )}
        <button>after</button>
      </main>
    );
  };

  mount(<OuterDialog />);

  cy.get('input').first().as('input').focus();
  cy.focused().should('have.property.name', 'text');

  // select first dialog
  cy.realPress('ArrowDown');
  cy.focused().contains('Outer #1');
  cy.realPress('ArrowDown');
  cy.focused().contains('Outer #2');

  // select second dialog
  cy.realPress('ArrowDown');
  cy.focused().contains('Inner #1');
  cy.realPress('ArrowDown');
  cy.focused().contains('Inner #2');

  // remains in inner dialog
  cy.realPress('ArrowDown');
  cy.focused().contains('Inner #1');

  // tabs to last dialog
  cy.realPress(['Shift', 'Tab']);
  cy.focused().contains('Outer #2');

  // arrows bring us back to the inner dialog
  cy.realPress('ArrowUp');
  cy.focused().contains('Inner #2');

  // tab out of dialogs
  cy.realPress('Tab');
  cy.focused().contains('after');
  // we can't reenter the dialogs
  cy.realPress(['Shift', 'Tab']);
  cy.get('@input').should('have.focus');
});

it('allows dialogs in semantic order', () => {
  const Dialog = ({ name }) => {
    const ownerRef = useRef<HTMLInputElement>(null);
    const ref = useRef<HTMLUListElement>(null);

    useDialogFocus(ref, { ownerRef });

    return (
      <div>
        <input type="text" className={name} ref={ownerRef} tabIndex={-1} />
        <ul ref={ref} role="dialog">
          <li tabIndex={0}>{name} #1</li>
          <li tabIndex={0}>{name} #2</li>
        </ul>
      </div>
    );
  };

  mount(
    <main>
      <Dialog name="First" />
      <Dialog name="Second" />
      <button>after</button>
    </main>
  );

  cy.get('.First').first().as('first');
  cy.get('.Second').first().as('second');

  // focus first dialog
  cy.get('@first').focus();
  cy.get('.First').first().as('first').focus();

  // tabs over both subsequent dialogs
  cy.realPress('Tab');
  cy.focused().contains('after');

  // given a focused first input, doesn't allow the first dialog to be used
  cy.get('@first').focus();
  cy.realPress('ArrowDown');
  cy.get('@first').should('have.focus');

  // given a focused second input, does allow the second dialog to be used
  cy.get('@second').focus();
  cy.realPress('ArrowDown');
  cy.focused().contains('Second #1');
});
