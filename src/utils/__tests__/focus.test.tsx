import React from 'react';
import { mount } from '@cypress/react';
import { getFocusTargets } from '../focus';

it('detects typical focusable elements', () => {
  const Tabbables = () => (
    <main>
      <button id="start">Start</button>
      <div className="targets" style={{ display: 'flex', flexDirection: 'column' }}>
        <input type="hidden" className="ignored" />
        <input type="text" disabled className="ignored" />
        <button tabIndex={-1} className="ignored" />
        <button style={{ visibility: 'hidden' }} className="ignored">Invisible</button>
        <button style={{ display: 'none' }} className="ignored">Invisible</button>
        <a className="ignored">No href</a>

        <input type="text" />
        <textarea></textarea>
        <button>Button</button>
        <a href="#">Link</a>
        <div tabIndex={0}>Tabbable</div>
      </div>
    </main>
  );

  mount(<Tabbables />);
  cy.get('#start').focus();

  const actualTargets: HTMLElement[] = [];
  for (let i = 0; i < 5; i++) {
    cy.realPress('Tab');
    cy.focused().should('not.have.class', 'ignored').then($el => {
      actualTargets.push($el.get(0));
    });
  }

  cy.get('.targets').then($el => {
    const element = $el.get(0);
    expect(getFocusTargets(element)).to.deep.equal(actualTargets);
  });
});
