export const err = (message: string) => {
  return new Error('[GetFunctionType] ' + message);
};

export const errLog = (...args: any[]) => {
  console.error('[GetFunctionType error] ', ...args);
};

export const warnLog = (...args: any[]) => {
  console.warn('[GetFunctionType warn] ', ...args);
};
