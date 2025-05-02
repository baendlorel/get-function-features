import { describe, expect, test } from '@jest/globals';
import isArrowFunction from '../src';

describe('EventBus class', () => {
  test(`false:function () {}`, () => expect(isArrowFunction(function () {})).toBe(false));

  test(`false:null`, () => expect(isArrowFunction(null)).toBe(false));

  class A {
    a() {}
  }
  const instA = new A();
  test(`false: class A { a() {} }; instA.a`, () =>
    expect(isArrowFunction(instA.a)).toBe(false));

  test(`[strict]throw error:null`, () =>
    expect(() => isArrowFunction(null, { strict: true })).toThrow());

  test(`true:(a, b) => a * b)`, () =>
    expect(isArrowFunction((a, b) => a * b)).toBe(true));

  test(`true:() => 42`, () => expect(isArrowFunction(() => 42)).toBe(true));

  test(`true: x => x * x`, () => expect(isArrowFunction((x) => x * x)).toBe(true));
  test(`true:(x) => x * x`, () => expect(isArrowFunction((x) => x * x)).toBe(true));

  test(`true:(x) => () => x * x`, () =>
    expect(isArrowFunction((x) => () => x * x)).toBe(true));
});
