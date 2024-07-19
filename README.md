# Quack Quack 🦆

The next hit audio effects app for remote teams.

Video conference calls don't have to be boring. Quack Quack 🦆 let's you bring your meetings to life with a personalised sound board.

Quack Quack 🦆 was born in [Stellate](https://stellate.co). The team hacked together the first version in an offsite.

## Development

```
pnpm install
pnpm dev
```

You can now open your browser on `http://localhost:1420/` to interact with Quack Quack. Any edits you make to the code will be live reloaded 🚀

Make sure your VSCode is using the workspace TypeScript versionkn. To do this click on the `{}` icon at the bottom right of your editor with a TS file open, click select version, and use the workspace version. This will enable GraphQLSP and will generate files with GQL documents for your queries automagically.

If you change the GraphQL schema you will want to run code generation:

```
pnpm exec graphql-code-generator
```
