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
import { define, colors } from 'xwcli';

const cmd = define({
  name: 'mycli',
  version: '1.1.22-canary.96+df33f2b2a',
  args: [
    [
      colors.red('t') + ',target <啊啊啊, 啊啊>',
      `you kan see it ${colors.blue('is')} a description`,
      'milf'
    ],
    [[`m,me, ${colors.blue('mean')}`, 'Is a description'], true],
    [`${colors.blue('list1')} |array`, 'thisis a desc for list1'],
    [
      'array1 |array',
      `${colors.blue(
        'array1'
      )}'s description,so test a long description, LOL, no other meaning`,
      []
    ],
    ['boolean1 |boolean', 'boolean s desc', false],
    ['number1 |number', `i am number1's desc`, 0]
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
    i = i.replace('mycmd', 'mycmd2');
    return i
      .replace('Flags:', 'Options:')
      .replace(`${colors.red('Bun')} is a fast`, 'XBun is a fast');
  },
  group: {
    Examples: ['Examples...']
  },
  tail: [
    `(more flags in 'bun install--help', ${colors.underline(
      'bun test --help'
    )}, and ${colors.cyan('bun build --help')})`,
    `\nLearn more about Bun: ${colors.blue('https://bun.sh/docs')}`,
    `               Join our Discord community: https://bun.sh/discord`
  ],
  header: `${colors.red(
    'Bun'
  )} is a fast JavaScript runtime, package manager, bundler, and test runner.`
});

// 默认运行 install 命令
cmd.default('i');

cmd.sub(
  ['i, install <lodash>'],
  [
    [colors.bgYellow('in'), `in's description`, `in's defaultValue`],
    ['in2', `in2's description`, `in2's defaultValue`]
  ],
  (aaa) => {
    console.log(`install`, aaa);
  }
);
cmd.sub(
  ['un,uninstall', `uninstall's description`],
  [
    // ['testun', 'description un"', 'defaultValue'],
  ],
  async (un) => {
    console.log(`uninstall`, un);
  }
);

// run the cli, in the end
cmd.run();
```

The following output：

```sh
XBun is a fast JavaScript runtime, package manager, bundler, and test runner.

  Usage: mycli [Flags] [command]

  Options:
         -t, --target         you kan see it is a description (default: "milf")
    -m, -me, --mean           Is a description
             --list1          thisis a desc for list1
             --array1         array1's description,so test a long description, LOL, no other meaning (default: [])
             --boolean1       boolean s desc (default: false)
             --number1        i am number1's desc (default: 0)

  Examples:
    Examples...

(more flags in 'bun install--help', bun test --help, and bun build --help)

Learn more about Bun: https://bun.sh/docs
               Join our Discord community: https://bun.sh/discord
```

## type

default: string. optional: `string`, `number`, `boolean`, `array`

## TODO

- [ ] support more colors (see `bun`)
- [ ] support choices.
- [ ] support more test

## any problem?

Issue or PR is welcome. ❤️

## Acknowledgements

[mrozio13pl/ofi](https://github.com/mrozio13pl/ofi)

[alexeyraspopov/picocolors](https://gitub.com/alexeyraspopov/picocolors)
