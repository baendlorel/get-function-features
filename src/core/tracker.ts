const createTracker = () => {
  // 通过注入Proxy和bind来实现标记判定，这样的判定是100%准确的

  const IS_PROXIED = 0b0001 as const;
  const IS_BOUND = 0b0010 as const;
  const WAS_PROXIED = 0b0100 as const;
  const WAS_BOUND = 0b1000 as const;

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

  const _setPBState = (
    target: Function,
    newFn: Function,
    state: typeof IS_PROXIED | typeof IS_BOUND
  ) => {
    if (_pbState.has(target)) {
      let oldState = _pbState.get(target) as number;
      if (oldState & IS_PROXIED) {
        oldState = (oldState & ~IS_PROXIED) | WAS_PROXIED;
      }
      if (oldState & IS_BOUND) {
        oldState = (oldState & ~IS_BOUND) | WAS_BOUND;
      }
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
      _setPBState(target, p, IS_PROXIED);
    }
    return p;
  } as any;

  newProxy.revocable = function <T extends object>(target: T, handler: ProxyHandler<T>) {
    // 创建原版
    const revocable = _Proxy.revocable(target, handler);
    const p = revocable.proxy as Function;
    if (typeof target === 'function') {
      _setSource(target, p);
      _setPBState(target, p, IS_PROXIED);
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
    _setPBState(this, newFn, IS_BOUND);
    return newFn;
  };

  console.log(
    `[GetFunctionType] 'Proxy' and 'bind' are injected for precise function features detection.`
  );

  const _be = (o: any, binaryNum: number) => Boolean((_pbState.get(o) ?? 0) & binaryNum);

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
    isProxy: (o: any) => _be(o, IS_PROXIED),
    isBound: (o: any) => _be(o, IS_BOUND),
    wasProxy: (o: any) => _be(o, WAS_PROXIED),
    wasBound: (o: any) => _be(o, WAS_BOUND),
    getSource: (o: Function) => _source.get(o) ?? o,
    isInjected: true,
  };
};

export const tracker = createTracker();
