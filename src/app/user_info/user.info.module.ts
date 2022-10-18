import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { UserInfoController } from "./user.info.controller";
import { UserInfo } from "../../db/entities/UserInfo";
import { UserInfoService } from "./user.info.service";
import { UserModule } from "../user/user.module";
import { CourseOrderModule } from "../course_order/course.order.module";
import { CourseChartModule } from "../course_chart/course.chart.module";
import { EquipmentOrderModule } from "../equipment_order/equipment.order.module";
import { EquipmentChartModule } from "../equipment_chart/equipment.chart.module";
import { TopUpOrderModule } from "../top_up_order/top.up.order.module";
import { AddressModule } from "../address/address.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([UserInfo]),
    forwardRef(() => UserModule),
    forwardRef(() => CourseOrderModule),
    forwardRef(() => EquipmentOrderModule),
    forwardRef(() => TopUpOrderModule),
    forwardRef(() => CourseChartModule),
    forwardRef(() => EquipmentChartModule),
    forwardRef(() => AddressModule)
  ],
  controllers: [UserInfoController],
  providers: [UserInfoService],
  exports: [UserInfoService]
})
export class UserInfoModule {
}
