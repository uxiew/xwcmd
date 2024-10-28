import { CLI } from "../src/CLI";

const getCmd = () => new CLI(`
  this is a test cli ,name is mycli(ver: 1.1.2)
    Usage: mycli [options]

    Commands:
      rm               lodash, axios, react
      i, install         lodash, axios, react
      a,uninstall      uninstall's description

      ssss
    Options:
      -m, --mean   [xxxxa]   Is a description [string]
      -t, --timeout <delay>  timeout in seconds (default: one minute)
      -d, --drink <size>     drink cup size (choices: "small", "medium", "large")
      -p, --port <number>    port number (env: PORT)
      --donate [amount]      optional donation in dollars (preset: "20")
      --disable-server       disables the server
      --free-drink           small drink included free
      -h, --help             display help for command
`);

export { getCmd }


export const CLIStr = `
  This is a mycli description. (version: 1.1.22)

  Usage: mycli <...arguments> <command> [...flags]

  Arguments:
    in        in's description (default: "ah") <number>
    pkg       pks's description [array]

  Commands:
    i,    install         lodash, axios, react
    u,un,uninstall      uninstall's description
  ;;

    For more info, run any command with the --help flag.

  Flags:
    -t,-y, --target  <delay>               You kan see it is a description (default: "astronaut") <string>
    -m, --mean   [xxxxa]                   Is a description
    -l, --list1                            Thisis a desc for list1.(choices:["c1","c2","c3"]) [string]
        --array1                           array1's description,so test a long description, LOL, no other meaning (default: ["xx","sd"])   [array]
    -b, --boolean1                         Boolean s desc (default: false)  [boolean]
        --number1                          I am number1's desc (default: 0)   [number]
        --nom-test                         test a long d阿萨斯escription, LOL, no other meaning <boolean>

  Examples:
    Add a xx from the npm registry
    bun add zod
    bun add zod@next
    bun add zod@3.0.0
  `
export const subCLIStr = `
  This is a sub cli description.
  Usage: mycli add <...arguments> [...flags]
  Alias: mycli a

  Arguments:
    in        in's description <number>
    pkg       pks's description [array]

  Commands:
    install       lodash, axios, react
    uninstall     uninstall's description

    For more info, run any command with the --help flag.

  Flags:
    -t, --target  <delay>                  You kan see it is a description (default: "astronaut") <string>
    -m, --mean   [xxxxa]                   Is a description
    -l, --list1                            Thisis a desc for list1  [string]
        --array1                           array1's description,so test a long description, LOL, no other meaning (default: [])   [string]
    -b, --boolean1                         Boolean s desc (default: false)  [boolean]
        --number1                          I am number1's desc (default: 0)   [number]
        --nom-test                         test a long d阿萨斯escription, LOL, no other meaning <boolean>

  Examples:
    Add a xx from the npm registry
    bun add zod
    bun add zod@next
    bun add zod@3.0.0
`;
