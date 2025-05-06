/**
 * @type {import('@babel/core').TransformOptions}
 */
export default {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    '@babel/preset-typescript',
  ],
  plugins: [
    [
      '@babel/plugin-proposal-decorators',
      {
        // 指定装饰器版本
        // "legacy": true  -> 使用旧版装饰器 (stage 1, 2018版本之前)
        // "version": "2021-12" -> 使用新版装饰器 (TC39 提案)
        version: '2021-12', // 使用最新的装饰器提案
      },
    ],
  ],
};
