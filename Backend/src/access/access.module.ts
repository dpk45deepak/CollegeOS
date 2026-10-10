import { Global, Module } from '@nestjs/common';
import { AccessService } from './access.service';
import { OwnershipService } from './ownership.service';

@Global()
@Module({ providers: [AccessService, OwnershipService], exports: [AccessService, OwnershipService] })
export class AccessModule {}
