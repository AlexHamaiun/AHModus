import {randomUUID} from 'node:crypto';
import type {IncomingMessage, ServerResponse} from 'node:http';

import type {Options} from 'pino-http';

import type {LogLevel} from '../../config/types';
import {HttpLogEventCode} from './enums';

const RequestIdHeader = 'x-request-id';
const RequestIdPattern = /^[a-zA-Z0-9._-]{1,128}$/u;

function createPinoHttpOptions(logLevel: LogLevel): Options {
  return {
    level: logLevel,
    genReqId: (request, response) => {
      const requestId = getRequestId(request.headers[RequestIdHeader]);

      response.setHeader(RequestIdHeader, requestId);

      return requestId;
    },
    customLogLevel: (_request, response, error) => {
      if (error !== undefined || response.statusCode >= 500) {
        return 'error';
      }

      if (response.statusCode >= 400) {
        return 'warn';
      }

      return 'info';
    },
    customReceivedMessage: () => `[${HttpLogEventCode.RequestReceived}] HTTP request received`,
    customReceivedObject: () => ({eventCode: HttpLogEventCode.RequestReceived}),
    customSuccessMessage: (_request, response) => {
      const eventCode = getHttpSuccessEventCode(response.statusCode);
      const message =
        response.statusCode >= 400 ? 'HTTP request rejected' : 'HTTP request completed';

      return `[${eventCode}] ${message}`;
    },
    customSuccessObject: (_request, response, loggableObject: object) => ({
      ...loggableObject,
      eventCode: getHttpSuccessEventCode(response.statusCode),
    }),
    customErrorMessage: () => `[${HttpLogEventCode.RequestFailed}] HTTP request failed`,
    customErrorObject: (_request, _response, _error, loggableObject: object) => ({
      ...loggableObject,
      eventCode: HttpLogEventCode.RequestFailed,
    }),
    customAttributeKeys: {
      err: 'error',
      req: 'request',
      res: 'response',
    },
    customProps: (request) => ({requestId: request.id}),
    serializers: {
      request: (request: IncomingMessage) => ({
        id: request.id,
        method: request.method,
        path: getRequestPath(request.url),
      }),
      response: (response: ServerResponse) => ({statusCode: response.statusCode}),
    },
  };
}

function getHttpSuccessEventCode(statusCode: number): HttpLogEventCode {
  return statusCode >= 400 ? HttpLogEventCode.RequestRejected : HttpLogEventCode.RequestCompleted;
}

function getRequestId(headerValue: string | string[] | undefined): string {
  if (typeof headerValue === 'string' && RequestIdPattern.test(headerValue)) {
    return headerValue;
  }

  return randomUUID();
}

function getRequestPath(url: string | undefined): string {
  if (url === undefined) {
    return '/';
  }

  const [path] = url.split('?');

  return path ?? '/';
}

export {createPinoHttpOptions};
