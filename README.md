<img style="width:100%; height:200px" src="https://cdn.jsdelivr.net/gh/uxiew/xwcli@main/xwcli.svg"/>

# xwcli

Opinionated, Simple and Efficient CLI Builder. But more flexible style, happy to Use.

## Usage

Install:

```sh
npm install --save xwcli
```

using it:

```ts
#!/usr/bin/env node
import { define, colors } from 'xwcli';

import { define, colors } from '../src/index';

// describe('test cli base', () => {
const cmd = define({
  name: 'mycli',
  version: '1.1.22-canary.96+df33f2b2a',
  args: [
    [
      colors.red('t') + ',target <valueHint>',
      `You kan see it ${colors.blue('is')} a description`,
      'astronaut'
    ],
    [[`m,me, ${colors.blue('mean')}`, 'Is a description'], true],
    [`${colors.blue('list1')} |array`, 'Thisis a desc for list1'],
    [
      'a,array1 |array',
      `${colors.blue(
        'array1'
      )}'s description,so test a long description, LOL, no other meaning`,
      []
    ],
    ['boolean1 |boolean', 'Boolean s desc', false],
    ['number1 |number', `I am number1's desc`, 0]
  ],
  action(info) {
    console.log(`${colors.bgBlue(colors.white('info!'))}`, info);
  }
});

// set the render options
// 颜色设置
// 缩进设置
// 背景图设置
// 头部设置（提供选项？）
cmd.set({
  render(i) {
    // You can design it any way you want.
    i = i.replace('mycli', 'xwcli');
    return i
      .replace('Flags:', 'Options:')
      .replace(`${colors.red('Cli')} is a fast`, 'xwcli is a fast');
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
xwcli is a fast JavaScript runtime, package manager, bundler, and test runner.

  Usage: xwcli [Flags] [command]

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

xwcli supports several commands for managing different tasks:

### type

### `define(options)`

Create the main Command.

`options`:
meta, args, action

args could have those data type: `string`, `number`, `boolean`, `array`, default: `string`.

### `sub(subCommandMeta, args, action)`

define sub-command

### `set(options)`

Set configuration options

### `default()`

Default command execution

> If you run your Program without a Command and without specifying a default command, your Program will exit with a No command specified error.

```ts
// set `i` as the default command (`i` is a sub command alias name)
cmd.default('i');
```

### examples

### `run()`

last moust call `run` method to run the cli.

### `version()`

Display version information

### `help()`

Display help information

## TODO

- [ ] more test
- [ ] better TypeScript support.
- [ ] support more colors (see `bun`).
- [ ] value hint.
- [ ] choices.

## any problem?

Issue or PR is welcome. ❤️

## Acknowledgements

[mrozio13pl/ofi](https://github.com/mrozio13pl/ofi)

[alexeyraspopov/picocolors](https://gitub.com/alexeyraspopov/picocolors)
