import { Module } from '@nestjs/common';
import { AnalyticsCoreModule } from '../analytics/analytics-core.module';
import { AssignmentsModule } from '../assignments/assignments.module';
import { AttendanceModule } from '../attendance/attendance.module';
import { ComplaintsModule } from '../complaints/complaints.module';
import { ExaminationsModule } from '../examinations/examinations.module';
import { FeesModule } from '../fees/fees.module';
import { PlacementsModule } from '../placements/placements.module';
import { ScholarshipsModule } from '../scholarships/scholarships.module';
import { StudentsModule } from '../students/students.module';
import { TimetableModule } from '../timetable/timetable.module';
import { AdvisorService } from './advisor/advisor.service';
import { AiAdminController } from './ai-admin.controller';
import { AiPipelineModule } from './ai-pipeline.module';
import { DeterministicResponder } from './agents/deterministic';
import { CollegeKnowledgeAgent } from './agents/knowledge-agent';
import { Supervisor } from './agents/supervisor';
import {
  AcademicAssistantAgent,
  AttendanceAdvisorAgent,
  GrievanceAgent,
  PlacementAgent,
  ScholarshipAgent,
} from './agents/tool-agent';
import { ToolLoop } from './agents/tool-loop';
import { AiChatGateway } from './chat/chat.gateway';
import { ChatController } from './chat/chat.controller';
import { ChatService } from './chat/chat.service';
import { RagAnswerService } from './rag/rag-answer.service';
import { RagController } from './rag/rag.controller';
import { RetrievalService } from './rag/retrieval.service';
import { CampusTools } from './tools/campus-tools';
import { ComplaintDraftService } from './tools/complaint-draft.service';
import { StudentResolver } from './tools/student-resolver';
import { StudentTools } from './tools/student-tools';
import { ToolRegistry } from './tools/tool-registry';

@Module({
  imports: [
    AiPipelineModule,
    StudentsModule,
    AttendanceModule,
    TimetableModule,
    ExaminationsModule,
    AssignmentsModule,
    FeesModule,
    ScholarshipsModule,
    PlacementsModule,
    ComplaintsModule,
    AnalyticsCoreModule,
  ],
  controllers: [RagController, ChatController, AiAdminController],
  providers: [
    RetrievalService,
    RagAnswerService,
    StudentResolver,
    StudentTools,
    CampusTools,
    ToolRegistry,
    ComplaintDraftService,
    ToolLoop,
    DeterministicResponder,
    AcademicAssistantAgent,
    AttendanceAdvisorAgent,
    ScholarshipAgent,
    PlacementAgent,
    GrievanceAgent,
    CollegeKnowledgeAgent,
    Supervisor,
    ChatService,
    AdvisorService,
    AiChatGateway,
  ],
  exports: [RagAnswerService, RetrievalService, ToolRegistry, ChatService],
})
export class AiModule {}
