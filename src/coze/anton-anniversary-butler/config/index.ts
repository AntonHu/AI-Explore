import { defineConfig, type UserConfigExport } from '@tarojs/cli'
import TsconfigPathsPlugin from 'tsconfig-paths-webpack-plugin'
import path from 'path';
import devConfig from './dev'
import prodConfig from './prod'

const platform = process.env.TARO_ENV;
const output = platform === 'weapp' ? 'dist' : 'dist_tt';
// https://taro-docs.jd.com/docs/next/config#defineconfig-辅助函数
export default defineConfig<'webpack5'>(async (merge, {}) => {
  const baseConfig: UserConfigExport<'webpack5'> = {
    projectName: 'taro_app',
    date: '2024-10-17',
    designWidth(input) {
      // 配置 NutUI 375 尺寸
      if (
        // @ts-expect-error 配置文件忽略
        input?.file?.replace(/\\+/g, '/').indexOf('@nutui') > -1
      ) {
        return 375;
      }
      // 全局使用 Taro 默认的 390 尺寸
      return 375;
    },
    deviceRatio: {
      640: 2.34 / 2,
      750: 1,
      375: 2,
      828: 1.81 / 2,
    },
    sourceRoot: 'src',
    outputRoot: output,
    plugins: ['@tarojs/plugin-html', require('path').resolve(__dirname, './mobx-plugin/index.ts')],
    defineConstants: {
    },
    framework: 'react',
    compiler: {
      type: 'webpack5',
      prebundle: {
        enable: false,
      },
    },
    cache: {
      enable: false // Webpack 持久化缓存配置，建议开启。默认配置请参考：https://docs.taro.zone/docs/config-detail#cache
    },
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@coze-kit/ui-builder-components-mp': '@coze-kit/ui-builder-components-mp/taro'
    },
    mini: {
      compile: {
        include: [
          (filename => /node_modules/.test(filename)) as unknown as string
        ],
      },
      postcss: {
        pxtransform: {
          enable: true,
          config: {

          }
        },
        cssModules: {
          enable: false, // 默认为 false，如需使用 css modules 功能，则设为 true
          config: {
            namingPattern: 'module', // 转换模式，取值为 global/module
            generateScopedName: '[name]__[local]___[hash:base64:5]'
          }
        }
      },
      webpackChain(chain) {
        chain.resolve.plugin('tsconfig-paths').use(TsconfigPathsPlugin);
        chain.resolve.plugin('MultiPlatformPlugin').tap((args) => {
          args[2]['include'] = ['@coze/taro-api']
          return args
        });
        chain.module
          .rule("script").resolve.merge({
            fullySpecified: false
          })
      }
    },
    h5: {
      publicPath: '/',
      staticDirectory: 'static',
      output: {
        filename: 'js/[name].[hash:8].js',
        chunkFilename: 'js/[name].[chunkhash:8].js'
      },
      miniCssExtractPluginOption: {
        ignoreOrder: true,
        filename: 'css/[name].[hash].css',
        chunkFilename: 'css/[name].[chunkhash].css'
      },
      postcss: {
        autoprefixer: {
          enable: true,
          config: {}
        },
        cssModules: {
          enable: false, // 默认为 false，如需使用 css modules 功能，则设为 true
          config: {
            namingPattern: 'module', // 转换模式，取值为 global/module
            generateScopedName: '[name]__[local]___[hash:base64:5]'
          }
        }
      },
      webpackChain(chain) {
        chain.resolve.plugin('tsconfig-paths').use(TsconfigPathsPlugin)
      }
    },
    rn: {
      appName: 'taroDemo',
      postcss: {
        cssModules: {
          enable: false, // 默认为 false，如需使用 css modules 功能，则设为 true
        }
      }
    }
  }
  if (process.env.NODE_ENV === 'development') {
    // 本地开发构建配置（不混淆压缩）
    return merge({}, baseConfig, devConfig)
  }
  // 生产构建配置（默认开启压缩混淆等）
  return merge({}, baseConfig, prodConfig)
})
