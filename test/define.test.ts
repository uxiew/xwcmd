
import { define, parseArgs } from '../src';


describe('cli/define test', () => {


    it('`define` should work as expected', () => {
        const a = define({
            name: 'test',
            version: '1.1.1',
            args: [
                ["a,aa,assertion <name>", "default"],
                ["b,bb,benchmark <name>", "default"],
            ],
            action: () => {
                console.log('test action run');
            }
        })
        expect(a.meta).toEqual({
            type: 'main',
            name: 'test',
            version: '1.1.1',
            description: '',
            hint: '',
            alias: [],
            parent: null
        })
    })

    it('parseArgs should work,when no value provided or provided ', () => {
        const argv = ['node', 'app', '-n']
        const options = parseArgs(argv.concat('Xee'), [
            ['n,name', 'name desc', 'will']
        ])
        const defaultOptions = parseArgs(argv, [
            ['n,name', 'name desc', 'will']
        ])
        expect(options).toEqual({ name: 'Xee', _: ['node', 'app'] })
        expect(defaultOptions).toEqual({ name: 'will', _: ['node', 'app'] })
    })
})