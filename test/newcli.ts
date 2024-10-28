import { version } from 'node:process';
import { cli, setConfig } from '../src';
import { colors } from '../src/colors/picocolors';

const cmd = cli(input, () => {
  console.log({
    error: '',
    unknown: '',
    help: false,
  })
})


cmd.action(() => {

})

cmd.sub(`
Usage: mycli install <...arguments> <command> [...flags]

Arguments:
  in        in's description <number>
  pkg       pks's description [array]
`, () => {

})

cmd.sub({
  name: "sub",
  alias: [],
  arguments: {
    s: {
    }
  },
  options: {
    target: {
      type: 'string',
      alias: [],
      default: '[]',
      choices: [],
      required: false,
    }
  }
},
  (a, b, c) => {
    console.log("axs")
  }
)

console.log(cli(input, () => {

  console.log("main cli runnning")
}));
// console.log(args);
