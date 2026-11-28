import { AppConfigService } from '../../config/app-config.service';
import { OutboundNotification, PushChannel, Recipient } from './channels';

describe('PushChannel', () => {
  const originalFetch = global.fetch;
  const origAppId = process.env.PUSH_APP_ID;
  const origApiUrl = process.env.PUSH_API_URL;

  const recipient: Recipient = {
    id: 'user-1',
    email: 'student@college.edu',
    phone: null,
    pushTokens: ['tok-1', 'tok-2'],
    isParent: false,
  };

  const notification: OutboundNotification = {
    id: 'notif-1',
    type: 'ATTENDANCE',
    title: 'Low Attendance Warning',
    body: 'Your attendance fell below 75%',
    data: { route: '/student/attendance' },
  };

  afterEach(() => {
    global.fetch = originalFetch;
    if (origAppId === undefined) delete process.env.PUSH_APP_ID;
    else process.env.PUSH_APP_ID = origAppId;
    if (origApiUrl === undefined) delete process.env.PUSH_API_URL;
    else process.env.PUSH_API_URL = origApiUrl;
    jest.restoreAllMocks();
  });

  it('no-ops without external call when recipient has no push tokens or provider key is unset', async () => {
    const fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;

    const unconfigured = new PushChannel({ get: () => undefined } as unknown as AppConfigService);
    await unconfigured.send(recipient, notification);
    expect(fetchMock).not.toHaveBeenCalled();

    const configured = new PushChannel({ get: () => 'key-123' } as unknown as AppConfigService);
    await configured.send({ ...recipient, pushTokens: [] }, notification);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('dispatches via OneSignal when PUSH_APP_ID and PUSH_PROVIDER_KEY are set', async () => {
    process.env.PUSH_APP_ID = 'os-app-99';
    delete process.env.PUSH_API_URL;
    const fetchMock = jest.fn().mockResolvedValue({ ok: true });
    global.fetch = fetchMock as unknown as typeof fetch;

    const channel = new PushChannel({ get: () => 'os-rest-key' } as unknown as AppConfigService);
    await channel.send(recipient, notification);

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.onesignal.com/notifications',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ authorization: 'Key os-rest-key' }),
      }),
    );
    const parsedBody = JSON.parse((fetchMock.mock.calls[0][1] as { body: string }).body);
    expect(parsedBody).toMatchObject({
      app_id: 'os-app-99',
      include_subscription_ids: ['tok-1', 'tok-2'],
      headings: { en: notification.title },
      contents: { en: notification.body },
    });
  });

  it('dispatches via FCM legacy/custom HTTP endpoint when PUSH_APP_ID is absent', async () => {
    delete process.env.PUSH_APP_ID;
    process.env.PUSH_API_URL = 'https://push.example.test/send';
    const fetchMock = jest.fn().mockResolvedValue({ ok: true });
    global.fetch = fetchMock as unknown as typeof fetch;

    const channel = new PushChannel({ get: () => 'fcm-server-key' } as unknown as AppConfigService);
    await channel.send(recipient, notification);

    expect(fetchMock).toHaveBeenCalledWith(
      'https://push.example.test/send',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ authorization: 'key=fcm-server-key' }),
      }),
    );
  });

  it('throws on non-OK provider HTTP status so BullMQ can retry', async () => {
    delete process.env.PUSH_APP_ID;
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 503 }) as unknown as typeof fetch;

    const channel = new PushChannel({ get: () => 'fcm-server-key' } as unknown as AppConfigService);
    await expect(channel.send(recipient, notification)).rejects.toThrow('Push gateway responded 503');
  });
});
