import { Command } from "../src/command";

const getCmd = () => new Command({
  name: "test",
  version: "1.1.1",
  alias: [],
  type: "main",
  hint: '',
}, [
  ['a,target', "target desc", "target default value"],
  ['x,run', "run desc", "run default value"]
]);

export { getCmd }
