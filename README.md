# xwcli

Opinionated, Simple and Efficient CLI Builder. But more flexible style, happy to Use.

## Usage

Install:

```
npm install --save xwcli
```

using it:

```ts
#!/usr/bin/env node
import { define } from 'xwcli';

const cmd = await define({
  name: 'mycmd',
  version: '1.0.0',
  args: [
    ['-t,--target', 'Bundle target, "es20XX" or "esnext"']
  ],
  action(info)  {

  }
})

// 默认运行 install 命令
cmd.default('install');

cmd.footer(`
Learn more about Bun:            https://bun.sh/docs
Join our Discord community:      https://bun.sh/discord
Hint: Use `xdw <command> --help` for more information about a command.
`)

cmd.sub([
     ['install,i', 'install dependencies','default'],
     args: [
        ['-v,--view', 'description"', 'defaultValue']
    ],
    ],
    ({ args, })=>{

}).sub([
    ['uninstall,u', 'xxsadasds']
    ], async({ args })=>{

})

cmd.run();


/*
    /Projects
   xdw
  Usage: xdw [Flags] [command]

  Commands:
    help     Display help (version: 1.1.0)

  Flags:
    --help
        Output usage information
    -h, --help
        Output usage information
    -i, --info
        get epub file basic info (default: smart case)

    -M, --ma         convert the epub file to markdown format with autocorrect
    -m, --md         convert the epub file to markdown format
    -S, --sections   get epub file sections
    -s, --structure  get epub file structure
    -u, --unzip      unzip epub file

  Examples:
    Add a dependency from the npm registry
    bun add zod
    bun add zod@next
    bun add zod@3.0.0

    Add a dev, optional, or peer dependency
    bun add -d typescript
    bun add --optional lodash
    bun add --peer esbuild

(more flags in bun install --help, bun test --help, and bun build --help)

Learn more about Bun:            https://bun.sh/docs
Join our Discord community:      https://bun.sh/discord
Hint: Use `xdw <command> --help` for more information about a command.
*/

```

## type

default: string. optional: `string`, `number`, `boolean`, `array`

## TODO

- [ ] support more colors (see `bun`)
- [ ] support choices.

## any problem?

Issue or PR is welcome. ❤️

## Acknowledgements

[mrozio13pl/ofi](https://github.com/mrozio13pl/ofi)

[alexeyraspopov/picocolors](https://gitub.com/alexeyraspopov/picocolors)
