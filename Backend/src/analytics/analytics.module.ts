import { Module } from '@nestjs/common';
import { AssignmentsModule } from '../assignments/assignments.module';
import { AttendanceModule } from '../attendance/attendance.module';
import { ComplaintsModule } from '../complaints/complaints.module';
import { FeesModule } from '../fees/fees.module';
import { ScholarshipsModule } from '../scholarships/scholarships.module';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsCoreModule } from './analytics-core.module';
import { AnalyticsService } from './analytics.service';
import { AnalyticsProcessor, SchedulerService } from './scheduler';

@Module({
  imports: [AnalyticsCoreModule, AttendanceModule, AssignmentsModule, ComplaintsModule, FeesModule, ScholarshipsModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, SchedulerService, AnalyticsProcessor],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
