import { Module } from '@nestjs/common';
import { AssignmentsModule } from '../assignments/assignments.module';
import { AttendanceModule } from '../attendance/attendance.module';
import { PerformanceService } from './performance.service';
import { RiskService } from './risk.service';

@Module({
  imports: [AttendanceModule, AssignmentsModule],
  providers: [PerformanceService, RiskService],
  exports: [PerformanceService, RiskService],
})
export class AnalyticsCoreModule {}
