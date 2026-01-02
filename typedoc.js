module.exports = {
  entryPoints: ['./src'],
  out: 'docs/typedoc-md',
  plugin: ['typedoc-plugin-markdown'],
  excludePrivate: true,
  excludeExternals: true,
  tsconfig: 'tsconfig.json'
};
