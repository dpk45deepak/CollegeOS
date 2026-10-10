import { Module } from '@nestjs/common';
import { AttendanceModule } from '../attendance/attendance.module';
import { ScholarshipsController } from './scholarships.controller';
import { ScholarshipsService } from './scholarships.service';

@Module({
  imports: [AttendanceModule],
  controllers: [ScholarshipsController],
  providers: [ScholarshipsService],
  exports: [ScholarshipsService],
})
export class ScholarshipsModule {}
