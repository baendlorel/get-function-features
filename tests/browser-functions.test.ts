/**
 * @jest-environment jsdom
 */
import getFunctionFeatures from '@/index';
import { expect, jest } from '@jest/globals';
import { describe, it } from './injected-jest';
import getAllFunctionNames from './get-all-function-names';
import { logFn } from '@/misc';

describe('浏览器函数的结论', () => {
  const gff = getFunctionFeatures;
  it('jest.fn()创造的应该是传统函数', () => {
    const feats = gff(jest.fn());
    expect(feats).toMatchObject({
      isClassic: true,
    });
  });

  const propKeys = getAllFunctionNames(window.document);
  for (const k of propKeys) {
    const v = Reflect.get(window.document, k);
    if (typeof v === 'function') {
      const feats = getFunctionFeatures(v);
      let t = '';
      if (feats.isClassic) {
        t += '传统 ';
      }
      if (feats.isMemberMethod) {
        t += '成员';
      }
      if (!feats.isClassic && !feats.isMemberMethod) {
        console.log(`不符合预期的函数 ${logFn(v)}`, feats);
      }
      process.stdout.write(`document.${String(k)} : ${t}\n`);
    }
  }
});
