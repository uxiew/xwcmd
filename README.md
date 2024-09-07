# xwcli

<svg style="margin:0 auto;display:block;width:200px;height:200px" viewBox="0 0 160 160" version="1.1">
  <g id="root" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
  <rect fill="transparent" x="0" y="0" width="160" height="160"></rect><circle fill="#70acb1" cx="80" cy="80" r="70"></circle><g id="Group" transform="translate(24.000000, 59.000000)"><rect id="Rectangle-17" x="0" y="2" width="112" height="18"></rect><text font-size="18" font-weight="700" letter-spacing=".81" fill="#59606d" data-text-alignment="C" font-style="normal"><tspan x="26.254165649414062" y="17">XWCLI</tspan></text></g>
  <rect x="68" y="84" width="24" height="24" display="none" fill="#59606d"></rect>
  <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 50 50" version="1.1" fill="#59606d" x="68" y="84" width="24" height="24"><g id="surface1"><path style=" " d="M 2.84375 3 C 1.273438 3 0 4.273438 0 5.84375 L 0 10 L 50 10 L 50 5.84375 C 50 4.273438 48.726563 3 47.15625 3 Z M 0 12 L 0 46 C 0 46.554688 0.449219 47 1 47 L 49 47 C 49.554688 47 50 46.554688 50 46 L 50 12 Z M 15.09375 19.96875 C 15.351563 19.972656 15.589844 20.050781 15.78125 20.25 L 22.40625 27.0625 L 15.625 33.6875 C 15.429688 33.875 15.191406 33.96875 14.9375 33.96875 C 14.675781 33.96875 14.414063 33.855469 14.21875 33.65625 C 13.832031 33.261719 13.824219 32.636719 14.21875 32.25 L 19.59375 27.03125 L 14.375 21.65625 C 13.988281 21.261719 13.980469 20.636719 14.375 20.25 C 14.574219 20.054688 14.835938 19.964844 15.09375 19.96875 Z M 23 32 L 36 32 C 36.554688 32 37 32.445313 37 33 C 37 33.554688 36.554688 34 36 34 L 23 34 C 22.449219 34 22 33.554688 22 33 C 22 32.445313 22.449219 32 23 32 Z "></path></g>
  </svg>
  </g>
</svg>

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

## type

default: string. optional: `string`, `number`, `boolean`, `array`

## API

### `define(subCommandName)`

Create the main CLI wrapper.

### `default`

> If you run your Program without a Command and without specifying a default command, your Program will exit with a No command specified error.

```ts
// set `i` as the default command (`i` is a sub command alias name)
cmd.default('i');
```

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
