// 通过注入Proxy和bind来实现标记判定，这样的判定是100%准确的
const isInjectedSymbol = Symbol('isInjected');
const proxyChain = new WeakMap<any, any[]>();
const bindChain = new WeakMap<Function, Function[]>();

const inject = () => {
  const globalObject = global ?? globalThis ?? window;
  Object.defineProperty(globalObject, isInjectedSymbol, { value: true });

  // 下面开始注入这两个东西
  const oldProxy = Proxy;
  const newProxy: ProxyConstructor = function <T extends object>(
    target: T,
    handler: ProxyHandler<T>
  ) {
    const p = new oldProxy(target, handler);
    const list = proxyChain.get(target) ?? ([] as any[]);
    proxyChain.set(p, list.concat(target));
    console.log('new proxy made');
    return p;
  } as any;
  newProxy.revocable = function <T extends object>(target: T, handler: ProxyHandler<T>) {
    // : { proxy: T; revoke: () => void; }
    const revocable = oldProxy.revocable(target, handler);
    const list = proxyChain.get(target) ?? ([] as any[]);
    proxyChain.set(revocable.proxy, list.concat(target));
    return revocable;
  };
  Proxy = newProxy;

  const oldBind = Function.prototype.bind;
  Function.prototype.bind = function (this, thisArg: any, ...args: any[]) {
    const bound = oldBind.call(this, thisArg, ...args);
    const list = bindChain.get(this) ?? ([] as Function[]);
    bindChain.set(bound, list.concat(this));
    return bound;
  };

  console.log(`[GetFunctionType] Proxy, Bind Injected`);
};
inject();

export const hasProxyChain = (o: any) => proxyChain.has(o);

export const hasBindChain = (o: any) => bindChain.has(o);

export const isInjected = () =>
  Object.prototype.hasOwnProperty.call(global ?? globalThis ?? window, isInjectedSymbol);
