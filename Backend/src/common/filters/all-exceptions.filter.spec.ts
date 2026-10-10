import { ArgumentsHost, BadRequestException, ForbiddenException } from '@nestjs/common';
import { AppConfigService } from '../../config/app-config.service';
import { AllExceptionsFilter } from './all-exceptions.filter';

function run(exception: unknown, isProduction: boolean) {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const host = {
    switchToHttp: () => ({
      getResponse: () => ({ status }),
      getRequest: () => ({ id: 'req-12345678', url: '/api/v1/x' }),
    }),
  } as unknown as ArgumentsHost;
  new AllExceptionsFilter({ isProduction } as AppConfigService).catch(exception, host);
  return { status: status.mock.calls[0][0] as number, body: json.mock.calls[0][0] };
}

describe('AllExceptionsFilter', () => {
  it('maps validation errors to VALIDATION_ERROR', () => {
    const { status, body } = run(new BadRequestException(['email must be an email']), true);
    expect(status).toBe(400);
    expect(body).toMatchObject({ success: false, errorCode: 'VALIDATION_ERROR', requestId: 'req-12345678' });
  });

  it('maps 403 to FORBIDDEN', () => {
    expect(run(new ForbiddenException(), true).body.errorCode).toBe('FORBIDDEN');
  });

  it('maps Prisma unique violations to 409', () => {
    const e = Object.assign(new Error('x'), { code: 'P2002', clientVersion: '5.22.0' });
    const { status, body } = run(e, true);
    expect(status).toBe(409);
    expect(body.errorCode).toBe('CONFLICT');
  });

  it('hides internal error details in production', () => {
    const { status, body } = run(new Error('connection string postgres://secret'), true);
    expect(status).toBe(500);
    expect(body.message).toBe('Internal server error');
    expect(JSON.stringify(body)).not.toContain('secret');
  });

  it('shows the message outside production', () => {
    expect(run(new Error('boom'), false).body.message).toBe('boom');
  });
});
