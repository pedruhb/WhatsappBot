/*import { createLogger, format, transports } from 'winston';

export const logger = createLogger({
    level: 'info',
    format: format.combine(
        format.colorize(),
        format.padLevels(),
        format.simple()
    ),
    transports: [
        new transports.File({ filename: '/logs/error.log', level: 'error' }),
        new transports.Console()
    ]
});*/

import P from "pino";

export const logger = P({ level: 'info', prettyPrint: { colorize: true, levelFirst: true, translateTime: 'dd/mm/yyyy, h:MM:ss TT', }, transport: { target: 'pino-pretty', options: { colorize: true } }, })