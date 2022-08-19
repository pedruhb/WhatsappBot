import P from "pino";

export const logger = P({ level: 'info', transport: { target: 'pino-pretty', options: { colorize: true, colorize: true, levelFirst: true, translateTime: 'dd/mm/yyyy, h:MM:ss TT' } }, })