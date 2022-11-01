import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { LecturerTimeController } from "./lecturer.time.controller";
import { LecturerTime } from "../../db/entities/LecturerTime";
import { LecturerTimeService } from "./lecturer.time.service";
import { UserModule } from "../user/user.module";
import { LiveCourseModule } from "../live_course/live.course.module";

@Module({
  imports: [TypeOrmModule.forFeature([LecturerTime]), forwardRef(() => UserModule), forwardRef(() => LiveCourseModule)],
  controllers: [LecturerTimeController],
  providers: [LecturerTimeService],
  exports: [LecturerTimeService]
})
export class LecturerTimeModule {
}
