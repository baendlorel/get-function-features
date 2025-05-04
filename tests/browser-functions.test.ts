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

  for (const k of getAllFunctionNames(window.document)) {
    const v = Reflect.get(window.document, k);
    if (typeof v === 'function') {
      const feats = getFunctionFeatures(v);
      process.stdout.write(
        `document.${String(k)} : ${feats.isClassic ? '传统' : ''} ${
          feats.isMemberMethod ? '成员' : ''
        }\n`
      );
    }
  }
});
