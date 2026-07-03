module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'refactor', 'perf', 'style', 'test', 'docs', 'chore', 'ci', 'revert'],
    ],
    'scope-enum': [
      2,
      'always',
      ['server', 'web', 'shared', 'sdk', 'root', 'deps', 'docs'],
    ],
    'subject-case': [0],
  },
}
