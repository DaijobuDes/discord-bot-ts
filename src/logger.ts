// logger.ts
import chalk from 'chalk';

type LogLevel = 'DEBUG' | 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'CRITICAL';

const COLOR_MAP: Record<LogLevel, (text: string) => string> = {
  DEBUG: chalk.cyan,
  INFO: chalk.white,
  SUCCESS: chalk.green,
  WARNING: chalk.yellow,
  ERROR: chalk.red,
  CRITICAL: chalk.bgRed.white,
};

const LEVEL_ORDER: Record<LogLevel, number> = {
  DEBUG: 10,
  INFO: 20,
  SUCCESS: 25,
  WARNING: 30,
  ERROR: 40,
  CRITICAL: 50,
};

export class Logger {
  private showTime: boolean;
  private level: number;

  constructor(showTime = true, level: LogLevel = 'DEBUG') {
    this.showTime = showTime;
    this.level = LEVEL_ORDER[level];
  }

  private format(level: LogLevel, message: string): string {
    const colorFn = COLOR_MAP[level] || chalk.white;
    const timePart = this.showTime
      ? `[${new Date().toISOString().replace('T', ' ').split('.')[0]}] `
      : '';
    const levelChar = level[0];
    return colorFn(`${timePart}[${levelChar}] ${message}`);
  }

  private log(level: LogLevel, message: string, ...args: any[]) {
    if (LEVEL_ORDER[level] < this.level) return;
    console.log(
      this.format(
        level,
        args.length ? message.replace(/%s/g, () => args.shift()) : message
      )
    );
  }

  debug(message: string, ...args: any[]) {
    this.log('DEBUG', message, ...args);
  }

  info(message: string, ...args: any[]) {
    this.log('INFO', message, ...args);
  }

  success(message: string, ...args: any[]) {
    this.log('SUCCESS', message, ...args);
  }

  warning(message: string, ...args: any[]) {
    this.log('WARNING', message, ...args);
  }

  error(message: string, ...args: any[]) {
    this.log('ERROR', message, ...args);
  }

  critical(message: string, ...args: any[]) {
    this.log('CRITICAL', message, ...args);
  }
}

// Export a default instance like in Python
export const log = new Logger(true);
