import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryBuilderTag } from './QueryBuilderTag';
import React from 'react';
import '@types/jest';

test.each([
  ['key="text"', 'text'],
  ['key=true', true],
  ['key=1', 1],
  ['key=null', null],
  ['key="{"some":"object"}"', { some: 'object' }],
])('displays key-value as %s for %s', async (expectedContent, value) => {
  render(<QueryBuilderTag name="key" value={value} onRemove={() => {}} />);

  const element: HTMLSpanElement = screen.getByText(/key/);

  expect(element).toBeInTheDocument();
  expect(element).toHaveTextContent(expectedContent);
});
