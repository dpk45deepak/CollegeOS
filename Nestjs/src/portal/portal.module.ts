import { Module } from '@nestjs/common';
import { AnalyticsCoreModule } from '../analytics/analytics-core.module';
import { AssignmentsModule } from '../assignments/assignments.module';
import { AttendanceModule } from '../attendance/attendance.module';
import { CampusModule } from '../campus/campus.module';
import { ComplaintsModule } from '../complaints/complaints.module';
import { ExaminationsModule } from '../examinations/examinations.module';
import { FeesModule } from '../fees/fees.module';
import { PlacementsModule } from '../placements/placements.module';
import { ScholarshipsModule } from '../scholarships/scholarships.module';
import { TimetableModule } from '../timetable/timetable.module';
import { PortalController } from './portal.controller';
import { PortalService } from './portal.service';

@Module({
  imports: [
    AttendanceModule,
    AssignmentsModule,
    TimetableModule,
    ExaminationsModule,
    FeesModule,
    ScholarshipsModule,
    PlacementsModule,
    ComplaintsModule,
    CampusModule,
    AnalyticsCoreModule,
  ],
  controllers: [PortalController],
  providers: [PortalService],
})
export class PortalModule {}
