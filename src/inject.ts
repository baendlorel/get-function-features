const inject = () => {
  // 通过注入Proxy和bind来实现标记判定，这样的判定是100%准确的
  let _injectionFlag = false;

  const PROXIED = 0b01 as const;
  const BOUND = 0b10 as const;
  type PBState = typeof PROXIED | typeof BOUND;

  const _source = new WeakMap<Function, Function>();
  const _pbState = new WeakMap<Function, number>();

  const _setSource = (target: Function, newFn: Function) => {
    // 如果target也有源头，那么设置为target的源头
    if (_source.has(target)) {
      const source = _source.get(target) as Function;
      _source.set(newFn, source);
      return;
    }

    // target就是源头，那么设置新函数映射到target
    _source.set(newFn, target);
  };

  const _setPBState = (target: Function, newFn: Function, state: PBState) => {
    if (_pbState.has(target)) {
      const oldState = _pbState.get(target) as number;
      _pbState.set(newFn, oldState | state);
      return;
    }
    _pbState.set(newFn, state);
  };

  // 下面开始注入这两个东西
  const _Proxy = Proxy;
  const newProxy: ProxyConstructor = function <T extends object>(
    target: T,
    handler: ProxyHandler<T>
  ) {
    const p = new _Proxy(target, handler) as any;
    if (typeof target === 'function') {
      _setSource(target, p);
      _setPBState(target, p, PROXIED);
    }
    return p;
  } as any;

  newProxy.revocable = function <T extends object>(target: T, handler: ProxyHandler<T>) {
    // 创建原版
    const revocable = _Proxy.revocable(target, handler) as any;
    if (typeof target === 'function') {
      _setSource(target, revocable.proxy);
      _setPBState(target, revocable.proxy, PROXIED);
    }
    return revocable;
  };
  // 改写
  Proxy = newProxy;

  const oldBind = Function.prototype.bind;
  // 改写
  Function.prototype.bind = function (this, thisArg: any, ...args: any[]) {
    const newFn = oldBind.call(this, thisArg, ...args);
    _setSource(this, newFn);
    _setPBState(this, newFn, BOUND);
    return newFn;
  };

  _injectionFlag = true;

  console.log(
    `[GetFunctionType] 'Proxy' and 'bind' are injected for precise function features detection.`
  );

  return {
    createProxyDirectly: function <T extends object>(
      target: T,
      handler: ProxyHandler<T>
    ) {
      return new _Proxy(target, handler);
    },
    bindDirectly: function (this: any, thisArg: any, ...args: any[]) {
      return oldBind.call(this, thisArg, ...args);
    },
    hasBeenProxied: (o: any) => Boolean((_pbState.get(o) ?? 0) & PROXIED),
    hasBeenBound: (o: any) => Boolean((_pbState.get(o) ?? 0) & BOUND),
    getSourceFunction: (o: Function) => _source.get(o) ?? o,
    isInjected: () => _injectionFlag,
  };
};

export const {
  createProxyDirectly,
  bindDirectly,
  hasBeenProxied,
  hasBeenBound,
  isInjected,
  getSourceFunction,
} = inject();
