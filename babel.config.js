/* eslint-disable */
module.exports = function (api) {
  api.cache(true);
  const presets = [
    [
      '@babel/env',
      {
        targets: {
          node: 'current',
        },
        useBuiltIns: 'usage',
      },
    ],
  ];
  const plugins = ['@babel/plugin-proposal-object-rest-spread', '@babel/plugin-proposal-class-properties'];

  return {
    presets,
    plugins,
  };
};
