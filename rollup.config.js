import path from 'path';
import dts from 'rollup-plugin-dts';
import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import alias from '@rollup/plugin-alias';

export default [
  // 主打包配置
  {
    input: 'src/index.ts',
    output: [
      {
        file: 'dist/index.js',
        format: 'cjs', // 指定为CommonJS格式
        sourcemap: true,
      },
    ],
    plugins: [
      alias({
        entries: [{ find: /^@/, replacement: path.resolve(import.meta.dirname, 'src') }],
      }), // 添加路径别名解析
      resolve(),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        // 确保生成声明文件
        declaration: true,
      }),
    ],
    external: [], // 可以加入 'fs'、'path' 等 Node 内建模块
  },
  // 类型声明打包
  {
    input: 'src/index.ts', // 直接从源码生成类型声明
    output: [{ file: 'dist/index.d.ts', format: 'es' }],
    plugins: [
      alias({
        entries: [{ find: /^@/, replacement: path.resolve(import.meta.dirname, 'src') }],
      }), // 确保类型声明中的别名也被正确处理
      dts(),
    ],
  },
];
