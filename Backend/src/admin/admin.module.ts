import { Module } from '@nestjs/common';
import { AuditController } from '../audit/audit.controller';
import { AdminController } from './admin.controller';

@Module({ controllers: [AdminController, AuditController] })
export class AdminModule {}
