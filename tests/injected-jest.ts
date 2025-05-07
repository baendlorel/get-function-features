import { it as itJest, fit as fitJest, describe as describeJest } from '@jest/globals';

type TestNameLike = Parameters<typeof itJest>[0];
type TestFn = Parameters<typeof itJest>[1];

type BlockNameLike = Parameters<typeof describeJest>[0];
type BlockFn = Parameters<typeof describeJest>[1];

export enum Env {
  dev,
  prod,
  published,
}

const createJest = () => {
  let _level = 0;
  let _currentCounter = 0;
  let _globalCounter = 0;
  const _index = [] as number[];

  const _p = (n: number) => `${String(n).padStart(3, ' ')}`;

  const _env: Env = (() => {
    switch (process.env.NODE_ENV) {
      case 'prod':
        return Env.prod;
      case 'pub':
        return Env.published;
      default:
        return Env.dev;
    }
  })();

  console.log('Using ENV =', Env[_env]);

  const describe = (blockName: BlockNameLike, blockFn: BlockFn, env?: Env) => {
    if (env && env !== _env) {
      return;
    }

    _level++;
    if (_level < _index.length) {
      _index.splice(_level);
    }
    _index[_level - 1] = _index[_level - 1] === undefined ? 1 : _index[_level - 1] + 1;
    _currentCounter = 0;
    describeJest(`${_index.join('.')} ${blockName}`, blockFn);
    _currentCounter = 0;
    _level--;
  };

  const it = (
    testName: TestNameLike,
    fn: TestFn,
    timeoutOrEnv?: number | Env,
    timeout?: number
  ) => {
    timeout = typeof timeoutOrEnv === 'number' ? timeoutOrEnv : timeout;
    const env = typeof timeoutOrEnv === 'string' ? timeoutOrEnv : 'both';
    if (env !== 'both' && env !== _env) {
      return;
    }

    _currentCounter++;
    _globalCounter++;
    itJest(`${_p(_currentCounter)}. ${testName} (G-${_globalCounter})`, fn, timeout);
  };

  const fit = (
    testName: TestNameLike,
    fn: TestFn,
    timeoutOrEnv?: number | Env,
    timeout?: number
  ) => {
    timeout = typeof timeoutOrEnv === 'number' ? timeoutOrEnv : timeout;
    const env = typeof timeoutOrEnv === 'string' ? timeoutOrEnv : 'both';
    if (env !== 'both' && env !== _env) {
      return;
    }

    _currentCounter++;
    _globalCounter++;
    fitJest(`${_p(_currentCounter)}. ${testName} (G-${_globalCounter})`, fn, timeout);
  };

  return {
    describe,
    it,
    fit,
    env: _env,
  };
};

export const { describe, it, fit, env } = createJest();
