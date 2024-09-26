import { define } from '../dist/index';
import { colors } from '../dist/colors/picocolors';

const cmd = define({
  name: 'mycli',
  version: '1.1.22',
  description: 'This is a mycli description',
  args: [
    [colors.red('t') + ',target <valuexHint>', `You kan see it ${colors.blue('is')} a description`, 'astronaut'],
    [`m,me, ${colors.blue('mean')}`, 'Is a description'],
    [`l,${colors.blue('...list1')}`, 'Thisis a desc for list1'],
    ['...array1', `${colors.blue('array1')}'s description,so test a long description, LOL, no other meaning`, []],
    ['b,!boolean1 <hint this is a true>', 'Boolean s desc', false],
    ['-number1', `I am number1's desc`, 0],
    ['nom-test', `test a long description, LOL, no other meaning`]
  ],
  action(argv, info) {
    console.log(`${colors.bgBlue(colors.white('info!'))}`, cmd.options, argv, info)
  }
})

// set the render options
cmd.set({
  unk: () => { },
  error: () => { },
  tail: [`(more flags in 'bun install --help', ${colors.underline('bun test --help')}, and ${colors.cyan('bun build --help')})`,
  `\nLearn more about Bun: ${colors.blue('https://bun.sh/docs')}`,
    `               Join our Discord community: https://bun.sh/discord`],
  header: `${colors.red('Cli')} is a fast JavaScript runtime, package manager, bundler, and test runner.`,
})

cmd.examples([
  'Add a xx from the npm registry',
  'bun add zod',
  'bun add zod@next',
  'bun add zod@3.0.0\n',
  'Add a dev, optional, or peer dependency',
  'bun add -d typescript',
  'bun add --optional lodash',
  'bun add --peer esbuild'
])

// 默认运行 install 命令
cmd.default('[...pkg!, !boolean!, -ss!]');

cmd.sub(
  ['i,in, install [pkg] <lodash, axios, react>'],
  [
    [`${colors.bgYellow('-in')} `, `in's description`, 19],
    ['in2', `in2's description`, `in2's defaultValue`],
    ['r,!recursive ', `in2's description`, `in2's defaultValue`]
  ],
  (args, pkg) => {
    console.log(`install+++`, args, pkg);
  }
);


cmd.sub(['un,uninstall <fetchallthemeforloves>', `uninstall's description`], [
  // ['testun', 'description un"', 'defaultValue'],
], async (un) => {
  console.log(`uninstall++++`, un);
})


cmd.run()
