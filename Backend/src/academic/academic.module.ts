import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { AcademicService } from './academic.service';
import { BatchController, OrgController, SubjectController } from './academic.controller';

@Module({
  imports: [UsersModule],
  controllers: [OrgController, BatchController, SubjectController],
  providers: [AcademicService],
  exports: [AcademicService],
})
export class AcademicModule {}
