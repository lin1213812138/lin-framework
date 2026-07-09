module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      // type: feat(feature) / fix(bug修复) / refactor(重构) / perf(性能) /
      //       style(样式) / test(测试) / docs(文档) / chore(杂项) /
      //       ci(CI配置) / revert(回滚)
      ['feat', 'fix', 'refactor', 'perf', 'style', 'test', 'docs', 'chore', 'ci', 'revert'],
    ],
    'scope-enum': [
      2,
      'always',
      // scope: server(后端) / web(前端) / shared(共享包) /
      //        sdk(SDK) / root(根配置) / deps(依赖) / docs(文档)
      ['server', 'web', 'shared', 'sdk', 'root', 'deps', 'docs'],
    ],
    // 关闭 subject 大小写限制，允许中文描述
    'subject-case': [0],
  },
}
