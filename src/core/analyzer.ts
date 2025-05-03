import { tracker } from './tracker';
import { err, warnLog, isNode, justify, toStringProto } from '@/misc';

const scanForNext = (str: string, char: string) => {
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

interface Analyser {
  (fn: Function): {
    symbolName: string | undefined;
    name: string;
    params: string;
    body: string;
    isArrow: boolean;
    isMemberMethod: boolean;
  };
  isProxy: (fn: Function) => boolean;
  isBound: (fn: Function) => boolean;
  wasProxy: (fn: Function) => boolean;
  wasBound: (fn: Function) => boolean;
  isConstructor: (fn: Function) => boolean;
  isClass: (fn: Function) => boolean;
  isAsync: (fn: Function) => boolean;
  isGenerator: (fn: Function) => boolean;
}

/**
 * 如果toString一个函数，默认值用到了单、双、反这三种引号的组合。那么会出现：\
 * 1、使用了单引号，那么结果会用双引号包裹 \
 * 2、双引号或反引号,会用单引号包裹 \
 * 3、如果使用了两种引号，那么会用第三种没用过的引号包裹 \
 * 4、如果三种都用，那么会用单引号包裹，并将单引号转义 \
 * ✅ 令人惊喜的是这个函数写了一遍就通过了，没有错误
 *
 * When using toString() on a function that has default parameters using a combination of single quotes, double quotes, and backticks:
 * 1. If single quotes are used, the result will be wrapped in double quotes \
 * 2. If double quotes or backticks are used, the result will be wrapped in single quotes \
 * 3. If two types of quotes are used, the result will be wrapped in the third unused quote type \
 * 4. If all three types of quotes are used, the result will be wrapped in single quotes and the single quotes within will be escaped \
 *
 * ✅ Surprisingly, this 'analyse' function worked on the first try with no errors
 * @param fnStr
 * @returns
 */
const analyser = ((fn: Function) => {
  const fnStr = toStringProto(fn);
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
    isMemberMethod: !(
      body.startsWith('=>') ||
      name.startsWith('function') ||
      name.startsWith('async function* ') ||
      name.startsWith('async function ')
    ),
  };
}) as Analyser;

analyser.isProxy = (fn: any) => {
  if (isNode) {
    const util = require('node:util') as typeof import('util');
    return util.types.isProxy(fn);
  }

  if (tracker.isInjected) {
    return tracker.isProxy(fn);
  }

  warnLog(`Cannot tell if ${fn} is a proxy or not, return false.`);
  // 一般不会到这里
  return false;
};

analyser.isBound = (fn: Function) => {
  if (tracker.isInjected) {
    return tracker.isBound(fn);
  }
  return fn.name.startsWith('bound ');
};

analyser.wasProxy = (fn: any) => {
  if (tracker.isInjected) {
    return tracker.wasProxy(fn);
  }

  warnLog(`Cannot tell if ${fn} was a proxy or not, return false.`);
  // 一般不会到这里
  return false;
};

analyser.wasBound = (fn: Function) => {
  if (tracker.isInjected) {
    return tracker.wasBound(fn);
  }
  return fn.name.includes('bound ');
};

/**
 * 经过研究，使用new操作符是最为确定的判断方法，箭头函数无法new \
 * 此处用proxy拦截构造函数，防止普通函数真的作为构造函数运行 \
 * After some research, using new operator to distinct arrow functions from normal functions is the best approach. \
 * We use proxy here to avoid truely running the constructor normal function(while arrow function cannot be newed)
 * @param fn
 * @returns
 */
analyser.isConstructor = (fn: any) => {
  try {
    const fp = tracker.createProxyDirectly(fn, {
      construct(target, args) {
        return {};
      },
    });
    new fp();
    return true;
  } catch (error) {
    if (
      error instanceof TypeError &&
      error.message &&
      error.message.includes('is not a constructor')
    ) {
      return false;
    }
    console.error(
      '[GetFunctionType]',
      '发生了未知错误。An unknown error occurred.',
      'fn:',
      fn,
      error
    );
    throw error;
  }
};

analyser.isClass = (fn: any) => {
  try {
    const fp = tracker.createProxyDirectly(fn, {
      apply(target, args) {
        return {};
      },
    });
    fp();
    return false;
  } catch (error) {
    if (
      error instanceof TypeError &&
      error.message &&
      error.message.includes(`Class constructor A cannot be invoked without 'new'`)
    ) {
      return true;
    }
    console.error(
      '[GetFunctionType]',
      'An unknown runtime error occurred.',
      'fn:',
      fn,
      error
    );
    throw error;
  }
};

analyser.isAsync = (fn: Function) => {
  if (isNode) {
    const util = require('node:util') as typeof import('util');
    return util.types.isAsyncFunction(fn);
  }

  const fnStr = toStringProto(fn);
  return (
    fnStr.startsWith('async ') ||
    fn.constructor.name === 'AsyncFunction' ||
    (fn as any)[Symbol.toStringTag] === 'AsyncFunction'
  );
};

analyser.isGenerator = (fn: Function) => {
  if (isNode) {
    const util = require('node:util') as typeof import('util');
    return util.types.isGeneratorFunction(fn);
  }

  const fnStr = toStringProto(fn)
    .replace(/\b(async|function)+\b/g, '')
    .trim();
  return (
    fn.constructor.name === 'GeneratorFunction' ||
    (fn as any)[Symbol.toStringTag] === 'GeneratorFunction' ||
    fnStr.startsWith('*')
  );
};

export { analyser };
