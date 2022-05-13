import { createLogger, format, transports } from 'winston';

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
});