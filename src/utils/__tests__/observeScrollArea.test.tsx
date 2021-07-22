import React, { useState, useRef, useLayoutEffect } from 'react';
import { mount } from '@cypress/react';
import { observeScrollArea } from '../observeScrollArea';

it('reports changes to the scroll area sizes', () => {
  const Resizeable = () => {
    const [minHeight, setMinHeight] = useState(50);
    const toggleHeight = () => setMinHeight(prev => prev === 50 ? 200 : 50);
    return (
      <div style={{ border: '1px solid palevioletred', minHeight }}>
        <button id="increase" onClick={toggleHeight}>Increase Height</button>
      </div>
    );
  };

  const Main = () => {
    const [elements, setElements] = useState<number[]>([]);
    const [height, setHeight] = useState(-1);
    const ref = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
      return observeScrollArea(ref.current!, (_width, height) => {
        setHeight(height);
      });
    });

    const addElement = () => setElements(prev => [...prev, prev.length]);

    return (
      <div
        style={{ border: '1px solid red', overflowY: 'scroll', maxHeight: 100 }}
        ref={ref}
      >
        <Resizeable />
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: 40 }}>
          <span id="size">{height}</span>
          <button id="add" onClick={addElement}>Add Element</button>
        </div>
        {elements.map(num => (
          <div style={{ height: 10, width: 10 }} key={num} />
        ))}
      </div>
    );
  };

  mount(<Main />);

  cy.get('#size').contains('92');
  cy.get('#increase').first().click();
  cy.get('#size').contains('242');
  cy.get('#increase').first().click();
  cy.get('#size').contains('92');
  cy.get('#increase').first().click();
  cy.get('#add').first().click();
  cy.get('#size').contains('252');
  cy.get('#add').first().click();
  cy.get('#size').contains('262');
});
