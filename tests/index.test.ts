import { strict as assert } from 'assert';
import getFunctionType from '../src/index';
import { FunctionType } from '../src/types';
import { describe, expect, it } from '@jest/globals';

describe('刁钻边界测试用例', () => {
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
    expect(getFunctionType(fn)).toBe(FunctionType.ArrowFunction);
  });

  it('混合了正则表达式的函数', () => {
    // 函数体包含正则表达式，正则中又包含括号
    const fn = function (regex = /function\s*\(\)\s*\{/) {
      return regex.test('function() {');
    };
    expect(getFunctionType(fn)).toBe(FunctionType.NormalFunction);
  });

  it('嵌套多层括号的箭头函数', () => {
    // 箭头函数参数包含多层括号的解构
    const fn = eval(`([{a: {b: {c: {d}}}}]) => ({...d})`);
    expect(getFunctionType(fn)).toBe(FunctionType.ArrowFunction);
  });

  it('Function.toString 被修改后的情况', () => {
    const originalToString = Function.prototype.toString;
    try {
      // 修改 Object.prototype.toString
      Object.prototype.toString = function () {
        return '被修改了';
      };

      const fn = () => {};
      expect(getFunctionType(fn)).toBe(FunctionType.Unknown);
    } finally {
      // 恢复原状
      Object.prototype.toString = originalToString;
    }
  });

  it('有名箭头函数的赋值表达式', () => {
    // 带名字的箭头函数（虽然箭头函数自身无法命名，但赋值给变量算是一种"命名"）
    const namedArrow = () => {};
    expect(getFunctionType(namedArrow)).toBe(FunctionType.ArrowFunction);
  });

  it('模拟构造函数调用 new Function()', () => {
    // 使用 new Function 创建的函数
    const dynamicFn = new Function('a', 'b', 'return a + b');
    expect(getFunctionType(dynamicFn)).toBe(FunctionType.NormalFunction);
  });

  it('具有复杂方括号符号的函数', () => {
    // 具有复杂方括号符号名称的方法
    const obj = {
      ['complex[name]'](a, b) {
        return a + b;
      },
    };
    expect(getFunctionType(obj['complex[name]'])).toBe(FunctionType.MemberFunction);
  });

  it('对象方法简写语法', () => {
    // 使用对象方法简写语法
    const obj = {
      method() {
        return this;
      },
    };
    expect(getFunctionType(obj.method)).toBe(FunctionType.MemberFunction);
  });

  it('异步生成器函数', () => {
    // 异步生成器函数
    async function* asyncGenerator() {
      yield 1;
      yield 2;
    }
    expect(getFunctionType(asyncGenerator)).toBe(FunctionType.AsyncFunction);
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
