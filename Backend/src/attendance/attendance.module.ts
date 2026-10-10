import { Module } from '@nestjs/common';
import { AttendanceAnalyticsService } from './attendance-analytics.service';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';

@Module({
  controllers: [AttendanceController],
  providers: [AttendanceService, AttendanceAnalyticsService],
  exports: [AttendanceService, AttendanceAnalyticsService],
})
export class AttendanceModule {}
