import { Command } from "../src/command";



describe(('test default command'), () => {
    let cmd: Command
    beforeEach(() => {
        cmd = new Command({
            name: "test",
            version: "1.1.1",
            alias: [],
            type: "main",
            hint: '',
        }, [
            ['a,target', "target desc", "target default value"],
            ['x,run', "run desc", "run default value"]
        ]);
        cmd.default('')
    })

    // ----- set default command or arg --------
    it('run main default command when default command set', () => {
        cmd.sub(['i,in, install <lodash>'], () => {
            console.log('install action run');
        })

        cmd.sub(['a,ax, axxxx <sss>'], () => {
            console.log('axxxx');
        })
        cmd.default('[x|array,pkg!|string, files|array]')
        // cmd.default('[pkg!|array]]')

        cmd.defineAction((a, b) => {
            console.log(a, b);
            expect(a).toEqual({
                '--': [],
                _: [],
                run: 'run default value',
                target: 'target default value',
            });
            expect(b).toEqual({
                files: ['a.js', 'b.js', 'c.js', 'd.js'],
                x: ['xxx'],
                pkg: 'a.ts',
            });
        })

        cmd.argv = ['node', 'app', 'xxx', 'a.ts', 'a.js', 'b.js', 'c.js', 'd.js'];
        cmd.run();
    });

    it('[1] sub default command should work correctly', () => {
        cmd.sub(
            ['i,in, install [pkg!|string, files|array]', 'install"s description'],
            [
                ['flag!', 'recursive desc', false],
                ['r,recursive |boolean', 'recursive desc', false],
                ['r,recursive |boolean', 'recursive desc', false]
            ],
            (a, b) => {
                // a : args , b: [pkg, files]
                console.log(a, b);
                expect(a).toEqual({
                    '--': [],
                    _: [],
                    recursive: true
                })
                expect(b).toEqual({
                    pkg: 'axios',
                    files: ['a.ts', 'a.js', 'b.js', 'c.js', 'd.js']
                })
            })

        cmd.argv = ['node', 'app', '-r'];
        cmd.run();
    });

    it('[2] sub default command should work correctly', () => {
        cmd.sub(
            ['i,in, install [pkg!|string, files|array]', 'install"s description'],
            [
                ['flag!|boolean', 'recursive desc', false],
                ['r,recursive |boolean', 'recursive desc', false],
                ['r,recursive |boolean', 'recursive desc', false]
            ],
            (a, b) => {
                // a : args , b: [pkg, files]
                console.log(a, b);
                expect(a).toEqual({
                    '--': [],
                    _: ['xxx'],
                    flag: true,
                    recursive: true,
                    n: true
                })
                expect(b).toEqual({
                    pkg: 'axios',
                    files: ['f1', 'f2']
                })
            })

        const argv = ['node', 'app', 'i', 'axios', 'f1', 'f2', '-r', '--flag', 'true', '-n', 'xxx'];
        cmd.run(argv);
    });

    it('[3] sub default command should work correctly', () => {
        cmd.sub(
            ['i,in, install [pkg!|string,yu, file]', 'install"s description'],
            [
                ['flag!', 'recursive desc', 'x'],
                ['r,recursive |boolean', 'recursive desc', false],
            ],
            (a, b) => {
                expect(a).toEqual({
                    '--': [],
                    _: ['f2', 'xxx'],
                    recursive: true,
                    flag: 'test',
                    n: true
                })
                expect(b).toEqual({
                    pkg: 'axios',
                    yu: 'x',
                    file: 'f1'
                })
            })

        const argv = ['node', 'app', 'i', 'axios', 'x', 'f1', 'f2', '-r', '--flag', "test", '-n', 'xxx'];
        cmd.run(argv);
    });

    it('[4] when sub command run with boolean flag start, should not work', () => {
        cmd.sub(
            ['i,in, install [pkg!|string, file]', 'install"s description'],
            [
                ['flag|boolean', 'recursive desc', 'x'],
                ['r,recursive |boolean', 'recursive desc', false],
            ],
            (a, b) => {
                // a : args , b: [pkg, files]
                console.log(a, b);
                expect(a).toEqual({
                    '--': [],
                    _: ['f2', 'xxx', 'test'],
                    recursive: true,
                    flag: false,
                    n: true
                })
                expect(b).toEqual({
                    pkg: 'axios',
                    file: 'f1'
                })
            })

        cmd.defineAction((a) => {
            console.log('run action run', a);
        })

        cmd.argv = ['node', 'app', 'in', '-r', 'axios', 'f1', 'f2', '--flag', "test", '-n', 'xxx'];
        cmd.run();
    });
})