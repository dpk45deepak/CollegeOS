import { SetMetadata } from '@nestjs/common';

export const SKIP_ENVELOPE = 'skipEnvelope';
/** Opt a handler out of the standard { success, data } wrapper (e.g. health checks). */
export const SkipEnvelope = () => SetMetadata(SKIP_ENVELOPE, true);
