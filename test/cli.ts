import { define, colors } from '../src/index';

const cmd = define({
    name: 'mycli',
    version: '1.1.22',
    description: 'This is a mycli description',
    args: [
        [colors.red('t') + ',target <valuexHint>', `You kan see it ${colors.blue('is')} a description`, 'astronaut'],
        [`m,me, ${colors.blue('mean')}`, 'Is a description'],
        [`l,${colors.blue('list1')} |array`, 'Thisis a desc for list1'],
        ['array1 |array', `${colors.blue('array1')}'s description,so test a long description, LOL, no other meaning`, []],
        ['boolean1 <truetruetruetrue>|boolean', 'Boolean s desc', false],
        ['number1 |number', `I am number1's desc`, 0],
        ['nom-test', `test a long description, LOL, no other meaning`]
    ],
    action(info) {
        console.log(`${colors.bgBlue(colors.white('info!'))}`, info)
    }
})

// cmd.default('i')

// set the render options
// 颜色设置
// 缩进设置
// 背景图设置
// 头部设置（提供选项？）
cmd.set({
    // defaultHelp: false,
    render(i) {
        // You can design it any way you want.
        i = i.replace('mycli', 'xwcli')
        return i.replace('Flags:', 'Options:').replace(`${colors.red('Cli')} is a fast`, 'xwcli is a fast')
    },
    tail: [`(more flags in 'bun install--help', ${colors.underline('bun test --help')}, and ${colors.cyan('bun build --help')})`,
    `\nLearn more about Bun: ${colors.blue('https://bun.sh/docs')}`,
        `               Join our Discord community: https://bun.sh/discord`],
    header: `${colors.red('Cli')} is a fast JavaScript runtime, package manager, bundler, and test runner.`,
})

cmd.examples(
    ['Add a xx from the npm registry',
        'bun add zod',
        'bun add zod@next',
        'bun add zod@3.0.0\n',
        'Add a dev, optional, or peer dependency',
        'bun add -d typescript',
        'bun add --optional lodash',
        'bun add --peer esbuild']
)

// 默认运行 install 命令
// cmd.default('i');

/**
 * Adds a new sub-command to the CLI that installs a package.
 *
 * The sub-command has the following arguments:
 * - `i,in, install <lodash>`: The package to install.
 * - `in | number`: The 'in' description, with a default value of 19.
 * - `in2`: The 'in2' description, with a default value of 'in2's defaultValue'.
 *
 * When the sub-command is executed, it logs the arguments passed to it.
 */
cmd.sub(
    ['i,in, install <lodash,as>'],
    [
        [`${colors.bgYellow('in')} | number`, `in's description`, 19],
        ['in2', `in2's description`, `in2's defaultValue`]
    ],
    (aaa) => {
        console.log(`install+++`, aaa.args);
    })
// .set(
//     {
//         Usage: [
//             'mycli install xxxx',
//             'mycli install <xxx>',
//         ]
//     }
// )


cmd.sub(['un,uninstall <fetchallthemeforloves>', `uninstall's description`], [
    // ['testun', 'description un"', 'defaultValue'],
], async (un) => {
    console.log(`uninstall++++`, un);
})


cmd.run()

