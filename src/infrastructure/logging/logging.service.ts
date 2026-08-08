import {Injectable} from '@nestjs/common';
import {InjectPinoLogger, PinoLogger} from 'nestjs-pino';

import type {LogAttributes, LogEventCode} from './types';

interface ILoggingService {
  debug(eventCode: LogEventCode, message: string, attributes?: LogAttributes): void;
  error(eventCode: LogEventCode, message: string, attributes?: LogAttributes): void;
  fatal(eventCode: LogEventCode, message: string, attributes?: LogAttributes): void;
  info(eventCode: LogEventCode, message: string, attributes?: LogAttributes): void;
  warn(eventCode: LogEventCode, message: string, attributes?: LogAttributes): void;
}

@Injectable()
class LoggingService implements ILoggingService {
  constructor(@InjectPinoLogger(LoggingService.name) private readonly logger: PinoLogger) {}

  debug(eventCode: LogEventCode, message: string, attributes: LogAttributes = {}): void {
    this.logger.debug({...attributes, eventCode}, `[${eventCode}] ${message}`);
  }

  error(eventCode: LogEventCode, message: string, attributes: LogAttributes = {}): void {
    this.logger.error({...attributes, eventCode}, `[${eventCode}] ${message}`);
  }

  fatal(eventCode: LogEventCode, message: string, attributes: LogAttributes = {}): void {
    this.logger.fatal({...attributes, eventCode}, `[${eventCode}] ${message}`);
  }

  info(eventCode: LogEventCode, message: string, attributes: LogAttributes = {}): void {
    this.logger.info({...attributes, eventCode}, `[${eventCode}] ${message}`);
  }

  warn(eventCode: LogEventCode, message: string, attributes: LogAttributes = {}): void {
    this.logger.warn({...attributes, eventCode}, `[${eventCode}] ${message}`);
  }
}

export {type ILoggingService, LoggingService};
