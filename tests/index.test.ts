import { describe, expect } from '@jest/globals';
import getFunctionType from '../src/index';
import { createIt } from './it';
import { FunctionFeature } from '../src/feature.class';

const it = createIt();

describe('刁钻边界测试用例', () => {
  const expectFeature = (fn: Function, expected: Partial<FunctionFeature>) =>
    expect(getFunctionType(fn)).toEqual(expect.objectContaining(expected));

  it('Function.toString 被修改后的情况', () => {
    const originalToString = Function.prototype.toString;
    try {
      // 修改 Object.prototype.toString
      Function.prototype.toString = function () {
        return '被修改了';
      };

      const fn = () => {};
      expect(getFunctionType(fn)).toThrowError();
    } finally {
      // 恢复原状
      Function.prototype.toString = originalToString;
    }
  });

  it('包含注释和引号的箭头函数', () => {
    // 包含所有三种引号和注释的箭头函数
    const fn = eval(`() => {
      /* 这是一个多行注释 '使用单引号' "使用双引号" */
      const a = 'single quotes';
      const b = "double quotes";
      const c = \`backticks\`;
      // 这是单行注释
      return { a, b, c };
   
    }`);
    expectFeature(fn, {
      notFunction: false,
      isArrow: 'yes',
      isAsync: 'no',
      isClassMember: 'no',
      isConstructor: 'no',
      isProxy: 'no',
      isBound: 'no',
    });
  });

  it('混合了正则表达式的函数', () => {
    // 函数体包含正则表达式，正则中又包含括号
    const fn = function (regex = /function\s*\(\)\s*\{/) {
      return regex.test('function() {');
    };

    expectFeature(fn, {
      isArrow: 'no',
      isAsync: 'no',
      isClassMember: 'no',
      isConstructor: 'yes',
      isProxy: 'no',
      isBound: 'no',
    });
  });

  it('嵌套多层括号的箭头函数', () => {
    // 箭头函数参数包含多层括号的解构
    const fn = eval(`([{a: {b: {c: {d}}}}]) => ({...d})`);
    expectFeature(fn, {
      isArrow: 'yes',
    });
  });

  it('有名箭头函数的赋值表达式', () => {
    // 带名字的箭头函数（虽然箭头函数自身无法命名，但赋值给变量算是一种"命名"）
    const fn = () => {};
    expectFeature(fn, {
      isArrow: 'yes',
      isConstructor: 'no',
    });
  });

  it('模拟构造函数调用 new Function()', () => {
    // 使用 new Function 创建的函数
    const fn = new Function('a', 'b', 'return a + b');
    expectFeature(fn, {
      isArrow: 'no',
      isConstructor: 'yes',
    });
  });

  it('具有复杂方括号符号的函数', () => {
    // 具有复杂方括号符号名称的方法
    const obj = {
      ['complex[name]'](a, b) {
        return a + b;
      },
    };
    expectFeature(obj['complex[name]'], {
      isArrow: 'no',
      isConstructor: 'no',
      isClassMember: 'yes',
    });
  });

  it('对象方法简写语法', () => {
    // 使用对象方法简写语法
    const obj = {
      method() {
        return this;
      },
    };
    expectFeature(obj.method, {
      isArrow: 'no',
      isConstructor: 'no',
      isClassMember: 'yes',
    });
  });

  it('异步生成器函数', () => {
    // 异步生成器函数
    async function* fn() {
      yield 1;
      yield 2;
    }

    expectFeature(fn, {
      isArrow: 'no',
      isAsync: 'yes',
      isConstructor: 'no',
      isClassMember: 'no',
      isGenerator: 'yes',
    });
  });

  it('带默认参数的箭头函数', () => {
    // 带默认参数和解构的箭头函数
    const fn = ({ a = 1, b = 2 } = {}) => a + b;
    expect(getFunctionType(fn)).toBe(FunctionType.ArrowFunction);
  });

  it('绑定多次的函数', () => {
    // 多次绑定的函数
    const fn = function () {
      return this;
    };
    const boundOnce = fn.bind({ x: 1 });
    const boundTwice = boundOnce.bind({ y: 2 });
    console.log('boundTwice =', boundTwice.name);
    expect(getFunctionType(boundTwice)).toBe(FunctionType.BoundFunction);
  });

  it('带有嵌套函数定义的函数', () => {
    // 函数内部定义其他函数
    function outer() {
      function inner() {
        return () => {};
      }
      return inner;
    }
    const innerFn = outer();
    expect(getFunctionType(innerFn)).toBe(FunctionType.NormalFunction);
    expect(getFunctionType(innerFn())).toBe(FunctionType.ArrowFunction);
  });

  it('代理函数', () => {
    // 使用 Proxy 包装的函数
    const originalFn = () => {};
    const proxiedFn = new Proxy(originalFn, {
      apply(target, thisArg, args) {
        return target.apply(thisArg, args);
      },
    });
    expect(getFunctionType(proxiedFn)).toBe(getFunctionType(originalFn));
  });
});
