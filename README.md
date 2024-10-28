<p align="center">
<a href="https://github.com/uxiew/xwcmd" target="_blank">
<img src="https://cdn.jsdelivr.net/gh/uxiew/xwcmd@main/xwcmd.svg" alt="Slidev" height="250" width="250"/>
</a>
</p>

<p align="center">
Prioritize the output display of the CLI, then everything becomes easier.🐈
</p>

# xwcmd

Opinionated, Simple and Efficient CLI Builder. happy to Use.

- Use output help info to define CLI, more customizable.
(**Note: Provide your own output help information**)
- Chaining Method Call.
- Easy subcommand-based CLIs: `app server`, `app fetch`, etc.
- Fully POSIX-compliant flags (including short & long versions)
- Support multi-level subcommands, theoretically can be unlimited subcommand nesting


[WIP]  Refactoring!!! Look for simpler, more efficient ways

## Usage

Install:

```sh
npm install --save xwcmd   # need >0.1.2
```

Use example:
```ts
import { cli } from 'xwcmd'

let input = `
  This is a mycli description. (version: 1.1.22)

  Usage: mycli <...arguments> <command> [...flags]

  Arguments:
    in        in's description <number>
    pkg       pks's description [array]

  Commands:
    install       lodash, axios, react
    uninstall     uninstall's description

    For more info, run any command with the --help flag.

  Flags:
    -t, --target  <delay>                  You kan see it is a description (default: "astronaut") <string>
    -m, --mean   [xxxxa]                   Is a description
    -l, --list1                            Thisis a desc for list1  [string]
        --array1                           array1's description,so test a long description, LOL, no other meaning (default: [])   [string]
    -b, --boolean1                         Boolean s desc (default: false)  [boolean]
        --number1                          I am number1's desc (default: 0)   [number]
        --nom-test                         test a long d阿萨斯escription, LOL, no other meaning <boolean>

  Examples:
    Add a xx from the npm registry
    bun add zod
    bun add zod@next
    bun add zod@3.0.0
`;

cli(input, ()=>{
  console.log('action running!')
})

cli.on()
```

more usages see [test/cli.ts](./test/cli.ts)

## API

Your CLI project can be changed based on the above template.

### `cli(input:string, action: Function)`

Create the main Command. reference above example.

### `setConfig(options)`

Set the global configuration of all commands.

## Command's Methods

### `sub(input: string, action:(a, b)=>{})`
Add a sub-command.

```ts
cmd.sub(
  input: string,
  (args, { pkg }) => {
    console.log(`install+++`, args, pkg);
  }
);
```

like `cli` method


### `call(cmdName:string, argv: any[])`

Invoke any registered subcommand.

```
 cmd.call('any_subcommand', ['default_arg_value', '--flag', 'flag_value'])
```

### `version(ver?:string)`

set the version info or display it.

### `help(output?:string)`

set the help info or display it.

### `on()`
Finally we have to call it.

## TODO

- [x] more test
- [x] globalSet?
- [ ] env?

## any problem?

Issue or PR is welcome. ❤️

## Acknowledgements

[mrozio13pl/ofi](https://github.com/mrozio13pl/ofi)

[alexeyraspopov/picocolors](https://gitub.com/alexeyraspopov/picocolors)
