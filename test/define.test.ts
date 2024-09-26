
import { define, parseArgs } from '../src';
import { colors } from '../src/colors/picocolors';


describe('cli/define test', () => {


  it('`define` should work as expected', () => {
    const a = define({
      name: 'test',
      version: '1.1.1',
      description: 'a cli desc',
      args: [],
      action: () => {
        console.log('test action run');
      }
    })
    expect(a.meta).toEqual({
      name: 'test',
      version: '1.1.1',
      type: 'main',
      description: 'a cli desc',
      default: '',
      hint: '',
      alias: [],
      parent: null
    })
  })

  it('`parseArgs` should work', () => {
    const argv = ['node', 'app', '-m']
    const options = parseArgs(argv.concat(['Xee', '--no-boolean']), [
      [colors.red('t') + ',target <valuexHint>', `You kan see it ${colors.blue('is')} a description`, 'astronaut'],
      [`m,me, ${colors.blue('mean')}`, 'Is a description'],
      [`l,${colors.blue('...list1')}`, 'Thisis a desc for list1'],
      ['...array1', `${colors.blue('array1')}'s description,so test a long description, LOL, no other meaning`, []],
      ['b,!boolean <hint this is a true>', 'Boolean s desc', true],
      ['-number1', `I am number1's desc`, 0],
      ['nom-test', `test a long description, LOL, no other meaning`]
    ])
    expect(options).toEqual({
      "boolean": false,
      "number1": 0,
      "array1": [],
      "_": [
      ],
      "mean": "Xee",
      "target": "astronaut",
    })

    const defaultOptions = parseArgs(argv, [
      ['n,name', 'name desc', 'will']
    ])
    expect(defaultOptions).toEqual({ name: 'will', m: true, _: [] })
  })
})
