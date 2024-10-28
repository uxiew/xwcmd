
import { colors } from '../src/colors/picocolors';
import { parse } from '../src/argv/parser'
import { parseCli } from '../src/parser';
import { CLIStr } from './demo';

describe('cli/define test', () => {
  it('`mir` equal `parse` should work as expected', () => {
    const opts = {
      number: ['size'],
      string: ['foo', 'name', 'surname', 'my-numbers'],
      boolean: ['dice', 'friendly'],
      array: ['list',],
      alias: { foo: ['f'] },
      default: { surname: 'obama', list: [], size: 10 }
    }

    // const flags = ['-f', 'bar', '--no-case', '-abc', '--test-case', '--test-case', '--zoom', '--', 'xxxx']
    const flags = ['--list', 'a', 'b', 'c', '--size', '--foo', '-N', 'hi', 'there', '--my-numbers=1,2,3', '-fas', '--', 'x']
    const a = parse(flags);
    //=> { _:[], foo:'bar' }
    //=> { _:['bar'], foo:true, baz:'hello', bat:42 }
    const b = parse(flags, opts)

    expect(a).toEqual({
      list: 'a',
      _: ['b', 'c', 'hi', 'there', 'x'],
      N: true,
      "my-numbers": "1,2,3",
      myNumbers: "1,2,3",
      foo: undefined,
      size: undefined,
      f: true,
      a: true,
      s: true,
    })
    expect(b).toEqual({
      surname: 'obama',
      list: ['a', 'b', 'c'],
      size: undefined,
      foo: '',
      // N: true,
      myNumbers: "1,2,3",
      'my-numbers': "1,2,3",
      _: ['hi', 'there', 'x'],
      // f: true,
      // a: true,
      // s: true,
    })
  })


  it('`parseCli` worked or not', () => {
    const res = parseCli(CLIStr)
    expect(res).toEqual({
      meta: {
        name: 'mycli',
        version: '1.1.22',
        type: 'main'
      },
      args: {
        error: false,
        _: [
          "in",
          "pkg",
        ],
        default: {
          in: 'ah'
        },
        array: [
          "pkg",
        ],
        number: [
          "in",
        ],
        required: [
          'in'
        ],
      },
      cmds: [{
        name: 'install',
        alias: ['i']
      }, {
        name: 'uninstall',
        alias: ['u', 'un']
      }],
      opts: {
        error: false,
        default: {
          target: 'astronaut',
          array1: ['xx', 'sd'],
          boolean1: false,
          number1: 0,
        },
        required: [
          "target",
          "nom-test",
        ],
        alias: {
          target: ['t', 'y'],
          mean: ['m'],
          list1: ['l'],
          boolean1: ['b'],
        },
        choices: {
          list1: ['c1', 'c2', 'c3']
        },
        string: [
          "target",
          "mean",
          "list1",
        ],
        array: [
          "array1",
        ],
        boolean: [
          "boolean1",
          "nom-test",
        ],
        number: [
          'number1',
        ],
      },
    })
  })

})
