import { HttpStatus, Injectable, Logger } from "@nestjs/common";
import { Cron, Interval } from "@nestjs/schedule";
import { RoomService } from "../app/room/room.service";
import { BookService } from "../app/book/book.service";
import { PatientCourseService } from "../app/patient_course/patient.course.service";
import { LecturerTimeService } from "../app/lecturer_time/lecturer.time.service";
import { Room } from "../db/entities/Room";

@Injectable()
export class RoomTaskServiceService {
  private readonly logger = new Logger(RoomTaskServiceService.name);

  constructor(
    private readonly roomService: RoomService,
    private readonly bookService: BookService,
    private readonly patientCourseService: PatientCourseService,
    private readonly lecturerTimeService: LecturerTimeService
  ) {
  }

  // TODO 改成 每分钟的0秒
  @Cron("0 * * * * *")
  async handleCheckBookRoomInterval() {
    this.logger.debug("该方法将在0秒标记处每分钟运行一次");
    const booksAll = await this.bookService.findAll();
    for (let i = 0; i < booksAll.length; i++) {
      // 15分钟以内的预约需要创建房间 900000
      if (booksAll[i].book_start_time.getTime() >= new Date().getTime() && booksAll[i].book_start_time.getTime() - new Date().getTime() <= 5400000) {
        const roomHistory = await this.roomService.findOneSuccessByBookId(booksAll[i].id);
        if (!roomHistory) {
          const room = new Room();
          room.book_id = booksAll[i].id;
          // 讲师用户id
          room.lecturer_user_id = booksAll[i].booked_user_id;
          // 患者用户id
          room.patient_user_id = booksAll[i].user_id;
          // 预约时间表id
          room.lecturer_time_id = booksAll[i].lecturer_time_id;
          // 预约患者课程id
          room.patient_course_id = booksAll[i].patient_course_id;
          // 预约开始时间
          room.book_start_time = booksAll[i].book_start_time;
          // 预约结束时间
          room.book_end_time = booksAll[i].book_end_time;
          // 保存
          const saveBookResult = await this.roomService.createRoom(room);
          if (saveBookResult.code !== HttpStatus.OK) {
            this.logger.error(saveBookResult.message);
          } else {
            this.logger.debug(`创建房间 ${room.id} 房间号 ${room.room_no}`);
          }
        }
      } else if (new Date().getTime() >= booksAll[i].book_end_time.getTime() && new Date().getTime() - booksAll[i].book_end_time.getTime() >= 1500000) {
        // 已经超过结束时间25分钟后的直播间，如依然存在（没有手动关闭），则需要清除
        const roomHistory = await this.roomService.findOneSuccessByBookId(booksAll[i].id);
        if (roomHistory) {
          const roomHistoryId = roomHistory.id;
          const roomHistoryRoomNo = roomHistory.room_no;
          const deleteRoomResult = await this.roomService.deleteOneRoomTemporaryById(roomHistory.id);
          if (deleteRoomResult.code !== HttpStatus.OK) {
            this.logger.error(deleteRoomResult.message);
          } else {
            // 删除房间成功
            this.logger.debug(`删除房间 ${roomHistoryId} 房间号 ${roomHistoryRoomNo}`);
            // 修改预约的状态为已完成
            booksAll[i].status = 2;
            const updateBookResult = await this.bookService.update(booksAll[i]);
            if (updateBookResult.code !== HttpStatus.OK) {
              this.logger.error(updateBookResult.message);
            } else {
              // 修改预约成功
              // 修改患者的课程记录
              const patientCourse = await this.patientCourseService.findOneById(booksAll[i].patient_course_id);
              patientCourse.learn_num += 1;
              // 如果课程学完，标记为已完成
              if (patientCourse.learn_num === patientCourse.course_live_num) {
                patientCourse.status = 2;
              }
              const patientCourseUpdateResult = await this.patientCourseService.updatePatientCourse(patientCourse);
              if (patientCourseUpdateResult.code !== HttpStatus.OK) {
                this.logger.error(patientCourseUpdateResult.message);
              }else {
                // 修改讲师时间的记录
                const lecturerTimeFind = await this.lecturerTimeService.findOneById(booksAll[i].lecturer_time_id)
                lecturerTimeFind.status = 2
                const lecturerTimeUpdateResult = await this.lecturerTimeService.update(lecturerTimeFind)
                if (lecturerTimeUpdateResult.code !== HttpStatus.OK) {
                  this.logger.error(lecturerTimeUpdateResult.message);
                }
              }
            }
          }
        }
      }
    }
    //this.logger.debug("房间检查");
  }
}
