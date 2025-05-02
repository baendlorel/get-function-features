import { CheckResult } from './types';
import { err } from './logs';
import { isNode, justify, nativeCode, protoToString } from './core';

export const scanForNext = (str: string, char: string) => {
  for (let i = 0; i < str.length; i++) {
    const c = str[i];
    if (c === '\\') {
      i++;
      continue;
    }
    if (c === char) {
      return i;
    }
  }
  return -1;
};

/**
 * 如果toString一个函数，默认值用到了单、双、反这三种引号的组合。那么会出现：\
 * 1、使用了单引号，那么结果会用双引号包裹 \
 * 2、双引号或反引号,会用单引号包裹 \
 * 3、如果使用了两种引号，那么会用第三种没用过的引号包裹 \
 * 4、如果三种都用，那么会用单引号包裹，并将单引号转义
 * @param fnStr
 * @returns
 */
export const analyse = (fn: Function) => {
  const fnStr = protoToString(fn);
  let leftParenthesesIndex = -1;
  let rightParenthesesIndex = -1;
  let bracketLevel = 0;
  let nameSymbolLeftIndex = -1;
  let nameSymbolRightIndex = -1;

  const inNameSymbolBracket = () =>
    nameSymbolLeftIndex !== -1 && nameSymbolRightIndex === -1;

  // 可以合法出现单边括号的地方有
  // 字符串内部、正则表达式、注释文本
  for (let i = 0; i < fnStr.length; i++) {
    const c = fnStr[i];

    if (c === '[' && nameSymbolLeftIndex === -1) {
      nameSymbolLeftIndex = i;
      continue;
    }

    if (c === ']' && nameSymbolLeftIndex !== -1 && nameSymbolRightIndex === -1) {
      nameSymbolRightIndex = i;
      continue;
    }

    // 1 圆括号
    if (c === '(' && !inNameSymbolBracket()) {
      bracketLevel++;
      if (bracketLevel === 1 && leftParenthesesIndex === -1) {
        leftParenthesesIndex = i;
      }
      continue;
    }

    if (c === ')' && !inNameSymbolBracket() && leftParenthesesIndex !== -1) {
      bracketLevel--;
      if (bracketLevel === 0 && rightParenthesesIndex === -1) {
        rightParenthesesIndex = i;
        break;
      }
      continue;
    }

    // 2.1 多行注释
    if (c === '/' && fnStr[i + 1] === '*') {
      i++;
      while (i < fnStr.length) {
        if (fnStr[i] === '*' && fnStr[i + 1] === '/') {
          i++;
          break;
        }
        i++;
      }
      continue;
    }

    // 2.2 单行注释
    if (c === '/' && fnStr[i + 1] === '/') {
      i++;
      while (i < fnStr.length) {
        if (fnStr[i] === '\n') {
          break;
        }
        i++;
      }
      continue;
    }

    // 下面开始判定函数声明中存在的字符串
    // 不需要处理反引号里面转义单引号的情况，因为对字符串、正则表达式的判定一定是基于一个首先出现的标志性字母的
    // 首先作为开头的字母肯定不需要转义，
    // 3 引号、正则表达式
    if (c === `'` || c === `"` || c === '`' || c === '/') {
      const rest = fnStr.slice(i);
      const nextIndex = scanForNext(rest, c);
      if (nextIndex === -1) {
        throw err(
          `There is an unmatched [${c}] in the function string, cannot parse the function.`
        );
      }
      i += nextIndex; // 这里无需另外+1，因为会在for循环中+1
      continue;
    }
  }

  if (inNameSymbolBracket()) {
    throw err(
      `There is an unmatched [${fnStr[nameSymbolLeftIndex]}] in the function string, cannot parse the function.`
    );
  }

  // 现在fn确认是函数了，但没有括号，只有单参数箭头函数满足这个情况
  let noParenthesesButArrow = false;
  if (leftParenthesesIndex === -1 || rightParenthesesIndex === -1) {
    if (fnStr.includes('=>')) {
      noParenthesesButArrow = true;
    } else {
      throw err(`There is no bracket in the function string, cannot parse the function.`);
    }
  }

  const symbolName =
    nameSymbolLeftIndex !== -1 && nameSymbolRightIndex !== -1
      ? justify(fnStr.slice(nameSymbolLeftIndex, nameSymbolRightIndex + 1))
      : undefined;

  // 解析三个部分
  const name = justify(fnStr.slice(0, leftParenthesesIndex));
  const params = justify(fnStr.slice(leftParenthesesIndex, rightParenthesesIndex + 1));
  const body = justify(fnStr.slice(rightParenthesesIndex + 1));

  // 返回解析结果
  return {
    symbolName,
    name,
    params,
    body,
    isArrow: body.startsWith('=>') || noParenthesesButArrow,
    isAsync: fnStr.startsWith('async'),
    isClassMember: !(
      body.startsWith('=>') ||
      name.startsWith('function') ||
      name.startsWith('async function')
    ),
  };
};

export const isBound = (fn: Function): CheckResult => {
  return fn.name.startsWith('bound ') ? 'yes' : 'no';
};

export const isProxy = (o: typeof Proxy<Function>): CheckResult => {
  if (isNode()) {
    const util = require('node:util') as typeof import('util');
    return util.types.isProxy(o) ? 'yes' : 'no';
  }

  return 'unknown';

  // ^ 以下这段说明不了任何问题
  // const str = protoToString(o);
  // // Proxy后的函数和bind一样会变成nativecode，且不含函数名
  // if (str !== nativeCode()) {
  //   return 'no';
  // }
  // // 去掉bound部分
  // const originName = o.name.replace(/^bound\s/, '');
  // if (originName !== '') {
  //   return 'maybe';
  // }
  // return 'unknown';
};

/**
 * 经过研究，使用new操作符是最为确定的判断方法，箭头函数无法new \
 * 此处用proxy拦截构造函数，防止普通函数真的作为构造函数运行 \
 * After some research, using new operator to distinct arrow functions from normal functions is the best approach. \
 * We use proxy here to avoid truely running the constructor normal function(while arrow function cannot be newed)
 * @param fn
 * @returns
 */
export const isConstructor = (fn: any): CheckResult => {
  try {
    const fp = new Proxy(fn, {
      construct(target, args) {
        return {};
      },
    });
    new fp();
    return 'yes';
  } catch (error) {
    if (
      error instanceof TypeError &&
      error.message &&
      error.message.includes('is not a constructor')
    ) {
      return 'no';
    }
    console.error(
      '[GetFunctionType]',
      '发生了未知错误。An unknown error occurred.',
      'fn:',
      fn,
      error
    );
    return 'unknown';
  }
};

export const isAsync = (fn: Function): CheckResult => {
  const fnStr = protoToString(fn);

  // 如果被代理或bind，那么async字样将会丢失
  if (fnStr.startsWith('async ')) {
    return 'yes';
  }

  // 如果此属性未被篡改，那么是可以直接判断的
  if ((fn as any)[Symbol.toStringTag] === 'AsyncFunction') {
    return 'yes';
  }

  // 如果篡改且代理/bind，依然有可能是async函数，但已经无法判断
  return 'unknown';
};

/**
 * proxy or bind may cause confuse
 * @param isProxyOrBound
 * @param someResult
 * @returns
 */
export const pbconfuse = (isProxyOrBound: boolean, someResult: CheckResult) => {
  // 如果是proxy或bind，那么结果可能是async函数
  if (!isProxyOrBound) {
    return someResult;
  }
  if (someResult !== 'yes') {
    return 'maybe';
  }
  return someResult;
};
