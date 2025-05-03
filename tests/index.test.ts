import { expect } from '@jest/globals';
import { describe, it, fit } from './injected-jest';
import { FunctionFeature } from '../src/core';
import { extractToStringProto } from '../src/misc';
import getFunctionFeatures from '../src/index';

describe('刁钻边界测试用例', () => {
  const expectFeature = (fn: Function, expected: Partial<FunctionFeature>) =>
    expect(getFunctionFeatures(fn)).toMatchObject(expected);

  describe('篡改', () => {
    it('Function.prototype.toString 被篡改的情况', () => {
      const originalToString = Function.prototype.toString;
      try {
        // 修改 Function.prototype.toString
        Function.prototype.toString = function () {
          return '被修改了';
        };
        expect(() => extractToStringProto()).toThrowError();
      } finally {
        // 恢复原状
        Function.prototype.toString = originalToString;
      }
    });
  });

  describe('通常的函数情形', () => {
    it('不是函数，应该报错', () => {
      // 包含所有三种引号和注释的箭头函数
      const fn = {};
      expect(() => getFunctionFeatures(fn)).toThrowError();
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
        isArrow: true,
        isAsync: false,
        isMemberMethod: false,
        isConstructor: false,
        isProxy: false,
        isBound: false,
      });
    });

    it('混合了正则表达式的函数', () => {
      // 函数体包含正则表达式，正则中又包含括号
      const fn = function (regex = /function\s*\(\)\s*\{/) {
        return regex.test('function() {');
      };

      expectFeature(fn, {
        isArrow: false,
        isAsync: false,
        isMemberMethod: false,
        isConstructor: true,
        isProxy: false,
        isBound: false,
      });
    });

    it('嵌套多层括号的箭头函数', () => {
      // 箭头函数参数包含多层括号的解构
      const fn = eval(`([{a: {b: {c: {d}}}}]) => ({...d})`);
      expectFeature(fn, {
        isArrow: true,
      });
    });

    it('有名箭头函数的赋值表达式', () => {
      // 带名字的箭头函数（虽然箭头函数自身无法命名，但赋值给变量算是一种"命名"）
      const fn = () => {};
      expectFeature(fn, {
        isArrow: true,
        isConstructor: false,
      });
    });

    it('模拟构造函数调用 new Function()', () => {
      // 使用 new Function 创建的函数
      const fn = new Function('a', 'b', 'return a + b');
      expectFeature(fn, {
        isArrow: false,
        isConstructor: true,
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
        isArrow: false,
        isConstructor: false,
        isMemberMethod: true,
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
        isArrow: false,
        isConstructor: false,
        isMemberMethod: true,
      });
    });

    it('成员函数', () => {
      class A {
        fn() {}
      }

      const a = new A();
      const fn = a.fn;

      expectFeature(fn, {
        isArrow: false,
        isConstructor: false,
        isMemberMethod: true,
        isGenerator: false,
      });
    });

    it('异步生成器函数', () => {
      // 异步生成器函数
      async function* fn() {
        yield 1;
        yield 2;
      }

      expectFeature(fn, {
        isArrow: false,
        isAsync: true,
        isConstructor: false,
        isMemberMethod: false,
        isGenerator: true,
      });
    });

    it('带默认参数的箭头函数', () => {
      // 带默认参数和解构的箭头函数
      const fn = ({ a = 1, b = 2 } = {}) => a + b;

      expectFeature(fn, {
        isArrow: true,
        isAsync: false,
        isConstructor: false,
        isMemberMethod: false,
        isGenerator: false,
      });
    });

    it('Symbol为名的函数', () => {
      // 带默认参数和解构的箭头函数
      const asymbol = Symbol('a');
      const fn = {
        [asymbol]: () => {},
      }[asymbol];

      expectFeature(fn, {
        isArrow: true,
      });
    });

    it('全局Symbol为名的函数，赋予变量的全局Symbol', () => {
      // 带默认参数和解构的箭头函数
      const asymbol = Symbol.for('a');
      const fn = {
        [asymbol]: () => {},
      }[asymbol];

      expectFeature(fn, {
        isArrow: true,
      });
    });

    it('全局Symbol为名的函数，直接使用的全局Symbol', () => {
      // 带默认参数和解构的箭头函数
      const fn = {
        [Symbol.for('a')]: () => {},
      }[Symbol.for('a')];

      expectFeature(fn, {
        isArrow: true,
      });
    });
  });

  describe('绑定与代理', () => {
    it('绑定的函数', () => {
      // 多次绑定的函数
      const fn = function () {
        return this;
      };
      const boundOnce = fn.bind({ x: 1 });
      expectFeature(boundOnce, {
        isBound: true,
        isProxy: false,
        isArrow: false,
        isAsync: false,
        isConstructor: true,
        isMemberMethod: false,
        isGenerator: false,
      });
    });

    it('代理函数', () => {
      // 使用 Proxy 包装的函数
      const originalFn = () => {};
      const proxiedFn = new Proxy(originalFn, {
        apply(target, thisArg, args) {
          return target.apply(thisArg, args);
        },
      });
      expectFeature(proxiedFn, {
        isBound: false,
        isProxy: true,
        isArrow: true,
        isAsync: false,
        isConstructor: false,
        isMemberMethod: false,
        isGenerator: false,
      });
    });

    fit('代理和绑定并用的函数', () => {
      // 使用 Proxy 包装的函数
      const originalFn = function () {};
      const bound = originalFn.bind({});
      const proxiedFn = new Proxy(bound, {
        apply(target, thisArg, args) {
          return target.apply(thisArg, args);
        },
      });
      expectFeature(proxiedFn, {
        isBound: true,
        isProxy: true,
        isArrow: false,
      });
    });

    it('代理过绑定过，但只检测代理的函数', () => {
      // 使用 Proxy 包装的函数
      const originalFn = function () {};
      const boundFn = originalFn.bind({});
      const revocable = Proxy.revocable(originalFn, {
        apply(target, thisArg, args) {
          return target.apply(thisArg, args);
        },
      });
      expectFeature(revocable.proxy, {
        isBound: false,
        isProxy: true,
        isArrow: false,
      });
    });

    it('先代理后绑定，看看能否看出代理过', () => {
      // 使用 Proxy 包装的函数
      const originalFn = function () {};
      const proxiedFn = new Proxy(originalFn.bind({}), {
        apply(target, thisArg, args) {
          return target.apply(thisArg, args);
        },
      });
      const boundFn = proxiedFn.bind({});
      expectFeature(boundFn, {
        isBound: true,
        isProxy: true,
        isArrow: false,
      });
    });
  });
});

// describe('nothing', () => {
//   it('nothing', () => {
//     expect(1).toBe(1);
//   });
// });
