import { Module } from '@nestjs/common';
import { AnalyticsCoreModule } from '../analytics/analytics-core.module';
import { AttendanceModule } from '../attendance/attendance.module';
import { ReportsController } from './reports.controller';
import { ReportProcessor, ReportsService } from './reports.service';

@Module({
  imports: [AttendanceModule, AnalyticsCoreModule],
  controllers: [ReportsController],
  providers: [ReportsService, ReportProcessor],
})
export class ReportsModule {}
