import { tracker } from './tracker';
import { err, isNode, justify, nativeCode } from '@/misc';

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

const matchTag = (fn: Function, tag: 'AsyncFunction' | 'GeneratorFunction') => {
  return fn.constructor.name === tag || (fn as any)[Symbol.toStringTag] === tag;
};

const extractToStringProto = () => {
  const _toString = Function.prototype.toString;

  if (typeof _toString !== 'function') {
    throw err(
      'Function.prototype.toString is not a function. It is definitly been tampered!'
    );
  }

  if (typeof _toString.call !== 'function') {
    throw err(
      'Function.prototype.toString.call is not a function. It is definitly been tampered!'
    );
  }

  const toStringStr = _toString.call(_toString);

  if (typeof toStringStr !== 'string') {
    throw err(
      'Function.prototype.toString.toString() is not a string. It is definitly been tampered!'
    );
  }

  if (
    toStringStr !== nativeCode('toString') &&
    toStringStr.indexOf('native code') === -1
  ) {
    throw err(
      'Function.prototype.toString.toString() is not native code. It is definitly been tampered!'
    );
  }

  const map = new WeakMap<Function, string>();
  return (fn: Function) => {
    let s = map.get(fn);
    if (s === undefined) {
      s = justify(_toString.call(fn));
      map.set(fn, s);
    }
    return s;
  };
};

const fnToString = extractToStringProto();

/**
 * 缓存装饰器，用于缓存getter的计算结果
 * @returns PropertyDescriptor
 */
const Cached = (
  _target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
): void => {
  const originalGetter = descriptor.get;

  if (!originalGetter) {
    throw new Error(`@cached decorator can only be applied to getters`);
  }

  // 使用WeakMap避免内存泄漏
  let result = undefined as boolean | undefined;

  // 替换原始getter
  descriptor.get = function (this: any) {
    if (result === undefined) {
      result = originalGetter.call(this);
    } else {
      console.log('直接来!', propertyKey, result);
    }
    return result;
  };
};

/**
 * 如果toString一个函数，默认值用到了单、双、反这三种引号的组合。那么会出现：\
 * 1.使用了单引号，那么结果会用双引号包裹 \
 * 2.双引号或反引号，会用单引号包裹 \
 * 3.如果使用了两种引号，那么会用第三种没用过的引号包裹 \
 * 4.如果三种都用，那么会用单引号包裹，并将单引号转义 \
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
export class Analyser {
  readonly symbolName: string | undefined;
  readonly head: string;
  readonly params: string;
  readonly body: string;
  readonly target: Function;

  // 可以直接计算出来的feature
  readonly isArrow: boolean;

  constructor(fn: Function) {
    this.target = fn;
    const fnStr = fnToString(fn);
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
        throw err(
          `There is no bracket in the function string, cannot parse the function.`
        );
      }
    }

    this.symbolName =
      nameSymbolLeftIndex !== -1 && nameSymbolRightIndex !== -1
        ? justify(fnStr.slice(nameSymbolLeftIndex, nameSymbolRightIndex + 1))
        : undefined;

    // 解析三个部分
    this.head = justify(fnStr.slice(0, leftParenthesesIndex));
    this.params = justify(fnStr.slice(leftParenthesesIndex, rightParenthesesIndex + 1));
    this.body = justify(fnStr.slice(rightParenthesesIndex + 1));

    this.isArrow = this.body.startsWith('=>') || noParenthesesButArrow;
  }

  /**
   * 经过研究，使用new操作符是最为确定的判断方法，箭头函数无法new \
   * 此处用proxy拦截构造函数，防止普通函数真的作为构造函数运行 \
   * After some research, using new operator to distinct arrow functions from normal functions is the best approach. \
   * We use proxy here to avoid truely running the constructor normal function(while arrow function cannot be newed)
   * @param fn
   * @returns
   */
  get isConstructor() {
    try {
      const fp = tracker.createProxyDirectly(this.target as any, {
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
        this.target,
        error
      );
      throw error;
    }
  }

  // TODO 所有getter加上缓存装饰器避免反复计算
  get isClass() {
    // 有的class可能不能以new调用，确实存在这样的情况
    // 函数定义以class开头，说明是class
    return this.head.match(/^class\b/) !== null;
  }

  get isAsync() {
    if (isNode) {
      const util = require('node:util') as typeof import('util');
      return util.types.isAsyncFunction(this.target);
    }

    return (
      this.head.startsWith('async ') ||
      this.target.constructor.name === 'AsyncFunction' ||
      (this.target as any)[Symbol.toStringTag] === 'AsyncFunction'
    );
  }

  get isMemberMethod() {
    return (
      !(
        this.body.startsWith('=>') ||
        this.head.match(/^function\b/) ||
        this.head.match(/^async function\b/) ||
        this.head.match(/^async function\*\b/)
      ) && !this.isClass
    );
  }

  @Cached
  get isGenerator() {
    if (isNode) {
      const util = require('node:util') as typeof import('util');
      return util.types.isGeneratorFunction(this.target);
    }

    const headWithoutFlag = this.head.replace(/\b(async|function)+\b/g, '').trim();
    return matchTag(this.target, 'GeneratorFunction') || headWithoutFlag.startsWith('*');
  }
}
