import { colors } from './colors/picocolors'
import { Meta } from './types'
import { print } from './utils'

export class CmdError extends Error {

    constructor(message: string) {
        super()
        this.name = '[XWCMD]'
        this.message = message
    }
}

export function log(type = '', ...message: any[]) {
    print(colors.cyan('[XWCMD]: ' + type) + ' '), message.forEach((m) => print(m))
}


export function error(meta: Meta, message: string) {
    console.error(colors.red(meta.name + `: ${message} For help, run command with '--help'.`))
}