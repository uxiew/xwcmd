<img style="width:100vw;height:200px" src="https://cdn.jsdelivr.net/gh/uxiew/xwcmd@main/xwcmd.svg"/>

# xwcmd

Opinionated, Simple and Efficient CLI Builder. But more flexible style, happy to Use.

- Customize some style styles and outputs
- Just a few simple character definitions
- Support multi-level subcommands, theoretically can be unlimited subcommand nesting

## Usage

Install:

```sh
npm install --save xwcmd
```

usage see [test/cli.js](./test/cli.js)

## API

### `define(options)`

Create the main Command. the `options` is a object, reference above example.

#### `options.args`

Let me explain, for examples:

```ts
import { colors } from 'xwcmd'
...
 [`f,${colors.blue('...files')} <value_hint>`, 'This is a description for files flag' , []]
```

The first parameter is a flag and it's aliases (this example is `-f`,`---files`), the second is this flag's description, and the third is the default value (this example is `[]`).

`colors.blue()` function from [alexeyraspopov/picocolors](https://gitub.com/alexeyraspopov/picocolors), so you can use multicolor in your cli. Like highlighting some hints, or arg

`<value_hint>` is a hint for the value, define by `<>` parentheses. like description for the value.

The `...` is a separator for the data type, `...` means the value is an array.
The type of arg is defined by prefacing it with a specific character，such as `-`,'!','...', default: `string`.
`-` means `number` type.
`!` means `boolean` type.
`...` means `array` type.

The type is automatically converted for you, you can also specify the default value.

#### `options.action`

The action function is called when the command is executed.

#### `options.name`

The name of the command.

#### `options.version`

The version of the command.

### `sub(subCommandMeta, args, action)`
Add a sub-command.

```ts
cmd.sub(
  ['i,in, install [pkg] <lodash, axios, react>'],
  [
    [`${colors.bgYellow('in')} | number`, `in's description`, 19],
    ['in2', `in2's description`, `in2's defaultValue`]
  ],
  (args, { pkg }) => {
    console.log(`install+++`, args, pkg);
  }
);
```

The first parameter `subCommandMeta` is an array of strings that describe the sub-command. like a item defined in `args`

The second parameter `args` is an array of flags and their options. it's the same as the `args` parameter in the `define` method.

The third parameter `action` is a function that is called when the sub-command is executed.

`subCommandMeta`

### `set(options: Settings)`

Set configuration options

### `default(cmdDefaultParam: string)`

Default command parameters.

```ts
cmd.default('[...pkg!]');
```

### `call(name:string, argv: any[])`

Invoke any registered subcommand.

```
 cmd.call('any_subcommand', ['default_arg_value', '--flag', 'flag_value'])
```

### `examples()`

Display examples information

### `version()`

Display version information

### `help()`

Display help information

### `run()`
Finally we need to call it

## TODO

- [x] more test
- [x] value hint.
- [ ] globalSet?
- [ ] env?
- [ ] choices.
- [ ] remove row layout?.

## any problem?

Issue or PR is welcome. ❤️

## Acknowledgements

[mrozio13pl/ofi](https://github.com/mrozio13pl/ofi)

[alexeyraspopov/picocolors](https://gitub.com/alexeyraspopov/picocolors)
