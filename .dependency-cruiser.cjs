module.exports = {
  options: {
    doNotFollow: { path: 'node_modules' }
  },
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      comment: '循環依存は許可されません',
      from: {},
      to: { circular: true }
    }
  ]
};
