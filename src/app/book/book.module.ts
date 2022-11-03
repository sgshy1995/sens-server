import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { BookController } from "./book.controller";
import { Book } from "../../db/entities/Book";
import { BookService } from "./book.service";
import { UserModule } from "../user/user.module";
import { LiveCourseModule } from "../live_course/live.course.module";
import { LecturerTimeModule } from "../lecturer_time/lecturer.time.module";
import { PatientCourseModule } from "../patient_course/patient.course.module";

@Module({
  imports: [TypeOrmModule.forFeature([Book]), forwardRef(() => UserModule), forwardRef(() => LiveCourseModule), forwardRef(() => LecturerTimeModule), forwardRef(() => PatientCourseModule)],
  controllers: [BookController],
  providers: [BookService],
  exports: [BookService]
})
export class BookModule {
}
