import { describe, expect, test } from '@jest/globals';
import { scanForNext } from '../src/analyzer';

describe('scanForNext', () => {
  test(`${"\\'"} : 1`, () => expect(scanForNext("\\'", "'")).toBe(1));
});
