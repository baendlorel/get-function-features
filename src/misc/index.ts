export * from './logs';
export * from './decorators';

export const nativeCode = (functionName?: string) =>
  `function ${functionName ?? ''}() { [native code] }`;

export const isNode = process?.versions?.node !== undefined;

/**
 * 所有空格缩减为1格，去掉首尾空格
 * @param str
 * @returns
 */
export const justify = (str: string) => str.trim().replace(/\s+/g, ' ');
