/**
 * @jest-environment jsdom
 */
import getFunctionFeatures from '@/index';
import { expect, jest } from '@jest/globals';
import { describe, it } from './injected-jest';
import getAllFunctionNames from './get-all-function-names';

describe('浏览器函数的结论', () => {
  const gff = getFunctionFeatures;
  it('jest.fn()创造的应该是传统函数', () => {
    const feats = gff(jest.fn());
    expect(feats).toMatchObject({
      isClassic: true,
    });
  });

  const propKeys = getAllFunctionNames(window.document);
  const messages = [] as string[];
  ``;
  for (const k of propKeys) {
    const v = Reflect.get(window.document, k);
    if (typeof v === 'function') {
      const feats = getFunctionFeatures(v);
      let t = [] as string[];
      if (feats.isClassic) {
        t.push('传统');
      }
      if (feats.isClass) {
        t.push('类');
      }
      if (feats.isMemberMethod) {
        t.push('成员');
      }
      if (t.length === 0) {
        console.log(`不符合预期的函数 ${v.toString().slice(0, 100)}...`, feats);
      }
      messages.push(`document.${String(k)} : ${t}`);
    }
  }
  console.log(messages.join('\n'));
});
