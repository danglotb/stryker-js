import { expect } from 'chai';

import { expectJSMutation } from '../../helpers/expect-mutation.js';
import { descartesMutator as sut } from '../../../src/mutators/descartes-mutator.js';

describe('Descartes', () => {
  it('should have name "Descartes"', () => {
    expect(sut.name).eq('Descartes');
  });

  it('should mutate void function body to empty block statement', () => {
    expectJSMutation(
      sut,
      "function f() { console.log('foo')}",
      'function f() {}',
    );
  });

  it('should mutate functional component to return null', () => {
    expectJSMutation(
      sut,
      'export default function f({ flag } : { flag: boolean; }) { if (flag) { return "string"; } return <div>foo</div>}',
      'export default function f({ flag } : { flag: boolean; }) {\n  return null;\n}',
    );
  });

  it('should mutate a function returning a string to return an empty string and an empty block', () => {
    expectJSMutation(
      sut,
      'function f() { return "hello"; }',
      'function f() {\n  return "";\n}',
    );
  });

  it('should mutate a function returning a number to return 0 and an empty block', () => {
    expectJSMutation(
      sut,
      'function f() { return 42; }',
      'function f() {\n  return 0;\n}',
    );
  });

  it('should mutate a function returning a boolean to return false and an empty block', () => {
    expectJSMutation(
      sut,
      'function f() { return true; }',
      'function f() {\n  return false;\n}',
    );
  });

  it('should mutate a function returning an object to return undefined and an empty block', () => {
    expectJSMutation(
      sut,
      'function f() { return { a: 1 }; }',
      'function f() {\n  return undefined;\n}',
    );
  });

  it('should mutate a function returning an array to return undefined and an empty block', () => {
    expectJSMutation(
      sut,
      'function f() { return [1, 2, 3]; }',
      'function f() {\n  return [];\n}',
    );
  });

  it('should mutate a function returning null to return undefined and an empty block', () => {
    expectJSMutation(
      sut,
      'function f() { return null; }',
      'function f() {\n  return undefined;\n}',
    );
  });

  it('should mutate a function returning undefined to return undefined and an empty block', () => {
    expectJSMutation(
      sut,
      'function f() { return undefined; }',
      'function f() {\n  return undefined;\n}',
    );
  });

  it('should pick the most generic type when multiple return types are present', () => {
    expectJSMutation(
      sut,
      'function f(flag) { if (flag) { return 42; } return "hello"; }',
      'function f(flag) {\n  return "";\n}',
    );
  });

  it('should mutate an arrow function returning a number to return 0 and an empty block', () => {
    expectJSMutation(
      sut,
      'const f = () => { return 10; }',
      'const f = () => {\n  return 0;\n}',
    );
  });

  it('should mutate a method returning a boolean to return false and an empty block', () => {
    expectJSMutation(
      sut,
      'const obj = { m() { return true; } }',
      'const obj = { m() {\n  return false;\n} }',
    );
  });
});
