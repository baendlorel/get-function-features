import { Analyser } from '@/core';

export const err = (message: string) => {
  return new Error('[GetFunctionType] ' + message);
};

export const errLog = (...args: any[]) => {
  console.error('[GetFunctionType error] ', ...args);
};

export const warnLog = (...args: any[]) => {
  console.warn('[GetFunctionType warn] ', ...args);
};

export const logFn = (fn: Function) => {
  const analyser = new Analyser(fn);
  const omit = (str: string) => (str.length > 100 ? str.slice(0, 100) + '...' : str);
  return `    functionName: [${fn.name}]
    head  : ${omit(analyser.head)}
    params: ${omit(analyser.params)}
    body  : ${omit(analyser.body)}`;
};
