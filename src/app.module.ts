import { Module, MiddlewareConsumer, RequestMethod } from "@nestjs/common";
import { APP_INTERCEPTOR, APP_FILTER } from "@nestjs/core";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule } from "@nestjs/config";
import { PathMiddleware } from "./middleware/path.middleware";

// 全局错误处理
import { ErrorsInterceptor } from "./common/errors.interceptor";

// 环境判断
const isProd = process.env.NODE_ENV === "production";

// 数据库配置

import databaseConfig from "./config/database.config";

// JWT配置
import jwtConfig from "./config/jwt.config";

// Redis配置
import redisConfig from "./config/redis.config";

// Mail配置
import mailConfig from "./config/mail.config";

// Courier配置
import courierConfig from "./config/courier.config";

// 引入 modules
import { UserModule } from "./app/user/user.module";
import { StatusFilter } from "./common/errors.filter";
import { AuthModule } from "./auth/auth.module";
import { UserController } from "./app/user/user.controller";
import { UserInfoModule } from "./app/user_info/user.info.module";
import { SysNotificationModule } from "./app/sys_notification/sys.notification.module";
import { NotificationModule } from "./app/notification/notification.module";
import { PainQuestionModule } from "./app/pain_question/pain.question.module";
import { PainReplyModule } from "./app/pain_reply/pain.reply.module";
import { PainCommentModule } from "./app/pain_comment/pain.comment.module";
import { PrescriptionModule } from "./app/prescription/prescription.module";
import { LiveCourseModule } from "./app/live_course/live.course.module";
import { VideoCourseModule } from "./app/video_course/video.course.module";
import { CourseInVideoModule } from "./app/course_in_video/course.in.video.module";
import { EquipmentModule } from "./app/equipment/equipment.module";
import { EquipmentModelModule } from "./app/equipment_model/equipment.model.module";
import { CourseChartModule } from "./app/course_chart/course.chart.module";
import { EquipmentChartModule } from "./app/equipment_chart/equipment.chart.module";
import { CourseOrderModule } from "./app/course_order/course.order.module";
import { TopUpOrderModule } from "./app/top_up_order/top.up.order.module";
import { AddressModule } from "./app/address/address.module";
import { EquipmentOrderModule } from "./app/equipment_order/equipment.order.module";
import { CourierModule } from "./app/courier/courier.module";
import { AuthenticateModule } from "./app/authenticate/authenticate.module";
import { LecturerTimeModule } from "./app/lecturer_time/lecturer.time.module";
import { PatientCourseModule } from "./app/patient_course/patient.course.module";
import { BookModule } from "./app/book/book.module";

@Module({
  imports: [
    // .env config
    // TODO 自定义的配置文件，必须再load，不然无法读取
    ConfigModule.forRoot({
      envFilePath: isProd ? ".env.production" : ".env.development",
      isGlobal: true,
      load: [databaseConfig, jwtConfig, redisConfig, mailConfig, courierConfig]
    }),
    // typeorm 连接数据库
    TypeOrmModule.forRoot({
      ...databaseConfig(),
      entities: [],
      synchronize: false,
      autoLoadEntities: true,
      timezone: "Z"
    }),
    // modules
    UserModule,
    AuthModule,
    UserInfoModule,
    SysNotificationModule,
    NotificationModule,
    PainQuestionModule,
    PainReplyModule,
    PainCommentModule,
    PrescriptionModule,
    LiveCourseModule,
    VideoCourseModule,
    CourseInVideoModule,
    EquipmentModule,
    EquipmentModelModule,
    CourseChartModule,
    EquipmentChartModule,
    CourseOrderModule,
    EquipmentOrderModule,
    TopUpOrderModule,
    AddressModule,
    CourierModule,
    AuthenticateModule,
    LecturerTimeModule,
    PatientCourseModule,
    BookModule
  ],
  controllers: [AppController, UserController],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ErrorsInterceptor
    },
    {
      provide: APP_FILTER,
      useClass: StatusFilter
    },
    AppService
  ]
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(PathMiddleware)
      .forRoutes(
        { path: "user/upload_avatar", method: RequestMethod.POST },
        { path: "user/upload_background", method: RequestMethod.POST },
        { path: "user_info/upload/data", method: RequestMethod.POST },
        { path: "pain_question/upload/data", method: RequestMethod.POST },
        { path: "pain_reply/upload/data", method: RequestMethod.POST },
        { path: "prescription/upload/video", method: RequestMethod.POST },
        { path: "prescription/upload/cover", method: RequestMethod.POST },
        { path: "live_course/upload/cover", method: RequestMethod.POST },
        { path: "video_course/upload/cover", method: RequestMethod.POST },
        { path: "course_in_video/upload/cover", method: RequestMethod.POST },
        { path: "course_in_video/upload/video", method: RequestMethod.POST },
        { path: "equipment/upload/cover", method: RequestMethod.POST },
        { path: "equipment/upload/long_figure", method: RequestMethod.POST },
        { path: "equipment_model/upload/multi_figure", method: RequestMethod.POST },
        { path: "authenticate/upload/identity_card_front", method: RequestMethod.POST },
        { path: "authenticate/upload/identity_card_back", method: RequestMethod.POST },
        { path: "authenticate/upload/practicing_certificate", method: RequestMethod.POST },
        { path: "authenticate/upload/employee_card", method: RequestMethod.POST }
      );
  }
}
