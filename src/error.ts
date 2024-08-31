import { colors } from './colors/picocolors'

export class CmdError extends Error {

    constructor(message: string) {
        super()
        this.name = '[XWCMD]'
        this.message = message
    }
}

export function log(type = '', ...message: any[]) {
    console.log(colors.cyan('[XWCMD]: ' + type) + ' '), message.forEach((m) => console.log(m))
}