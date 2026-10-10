import { externalChannels } from './notification-policy';

describe('notification policy', () => {
  it('uses WhatsApp only for parents on opted-in events', () => {
    expect(externalChannels('FeeDue', true)).toContain('WHATSAPP');
    expect(externalChannels('FeeDue', false)).not.toContain('WHATSAPP');
    expect(externalChannels('ExamScheduled', true)).not.toContain('WHATSAPP');
  });
  it('sends nothing external for unknown or low-signal types', () => {
    expect(externalChannels('NewMessage', false)).toEqual([]);
  });
});
