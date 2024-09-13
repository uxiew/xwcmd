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

using it:

```ts
#!/usr/bin/env node
import { define, colors } from 'xwcmd';

// describe('test cli base', () => {
const cmd = define({
  name: 'mycli',
  version: '1.0.1',
  args: [
    [
      colors.red('t') + ',target <valueHint>',
      `it ${colors.blue('is')} a description`,
      'astronaut'
    ],
    [
      [
        `m,me, ${colors.blue('mean')}`,
        'Is a mean description with `true` default value'
      ],
      true
    ],
    [`${colors.blue('files')} |array`, 'This is a desc for files']
  ],
  action(info) {
    console.log(`${colors.bgBlue(colors.white('info!'))}`, info);
  }
});

// set the render options
cmd.set({
  render(i) {
    // You can design it any way you want.
    i = i.replace('mycli', 'xwcmd');
    return i
      .replace('Flags:', 'Options:')
      .replace(`${colors.red('Cli')} is a fast`, 'xwcmd is a fast');
  },
  group: {
    // "Commands": ['t,todo, todo <lodash>', `todo's description`],
    // "Flags": ['q,quit', `quit's description`],
  },
  tail: [
    `(more flags in 'bun install--help', ${colors.underline(
      'bun test --help'
    )}, and ${colors.cyan('bun build --help')})`,
    `\nLearn more about Bun: ${colors.blue('https://bun.sh/docs')}`,
    `               Join our Discord community: https://bun.sh/discord`
  ],
  header: `${colors.red(
    'Cli'
  )} is a fast JavaScript runtime, package manager, bundler, and test runner.`
});

// 默认运行 install 命令
cmd.default('i');

cmd
  .sub(
    ['i,in, install <lodash>'],
    [
      [colors.bgYellow('in'), `in's description`, `in's defaultValue`],
      ['in2', `in2's description`, `in2's defaultValue`]
    ],
    (aaa) => {
      console.log(`install`, aaa);
    }
  )
  .set({
    group: {
      Examples: 'some examples'
    }
  });

cmd.sub(
  ['un,uninstall', `uninstall's description`],
  [
    // ['testun', 'description un"', 'defaultValue'],
  ],
  async (un) => {
    console.log(`uninstall`, un);
  }
);

cmd.run();
```

The following output with colors：

```sh
xwcmd is a fast JavaScript runtime, package manager, bundler, and test runner.

  Usage: xwcmd [Flags] [command]

  Commands:
    install
    uninstall                 uninstall's description

  Options:
         -t, --target         You kan see it is a description (default: "astronaut")
    -m, -me, --mean           Is a description
             --list1          Thisis a desc for list1
             --array1         array1's description,so test a long description, LOL, no other meaning (default: [])
             --boolean1       Boolean s desc (default: false)
             --number1        I am number1's desc (default: 0)
         -h, --help           Print this help menu

(more flags in 'bun install--help', bun test --help, and bun build --help)

Learn more about Bun: https://bun.sh/docs
               Join our Discord community: https://bun.sh/discord
```

## API

process argv parser base on [ofi](https://github.com/mrozio13pl/ofi).

### `define(options)`

Create the main Command. the `options` is a object, reference above example.

#### `options.args`

Let me explain, for examples:

```ts
import { colors } from 'xwcmd'
...
 [`f,${colors.blue('files')} <value_hint> |array`, 'This is a description for files flag' , []]
```

The first parameter is a flag and it's aliases (this example is `-f`,`---files`), the second is this flag's description, and the third is the default value (this example is `[]`).

`colors.blue()` function from [alexeyraspopov/picocolors](https://gitub.com/alexeyraspopov/picocolors), so you can use multicolor in your cli. Like highlighting some hints, or arg

`<value_hint>` is a hint for the value, define by `<>` parentheses. like description for the value.

The `|` is a separator for the data type, `array` means the value is an array.
The type of arg is defined by `| <datatype>` format, `<datatype>` could have those data type: `string`, `number`, `boolean`, `array`, default: `string`.

The type is automatically converted for you, you can also specify the default value.

#### `options.action`

The action function is called when the command is executed.

#### `options.name`

The name of the command.

#### `options.version`

The version of the command.

### `sub(subCommandMeta, args, action)`

Add a new sub-command to the CLI.

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

for

```ts
// set `execute` as the default command (`x` is a sub command alias name)
cmd.default('[x,execute [pkg!|array]]');
```

### `examples()`

Display examples information

### `run()`

last moust call `run` method to run the cli.

### `version()`

Display version information

### `help()`

Display help information

## TODO

- [x] more test
- [x] value hint.
- [x] choices.
- [ ] support more colors (see `bun`).

## any problem?

Issue or PR is welcome. ❤️

## Acknowledgements

[mrozio13pl/ofi](https://github.com/mrozio13pl/ofi)

[alexeyraspopov/picocolors](https://gitub.com/alexeyraspopov/picocolors)
