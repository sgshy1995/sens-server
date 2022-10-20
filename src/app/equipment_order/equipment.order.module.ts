import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { EquipmentOrderController } from "./equipment.order.controller";
import { EquipmentOrder } from "../../db/entities/EquipmentOrder";
import { EquipmentOrderService } from "./equipment.order.service";
import { EquipmentModule } from "../equipment/equipment.module";
import { EquipmentModelModule } from "../equipment_model/equipment.model.module";
import { UserInfoModule } from "../user_info/user.info.module";
import { UserModule } from "../user/user.module";
import { CourierModule } from "../courier/courier.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([EquipmentOrder]),
    forwardRef(() => EquipmentModule),
    forwardRef(() => EquipmentModelModule),
    forwardRef(() => UserInfoModule),
    forwardRef(() => UserModule),
    forwardRef(() => CourierModule)
  ],
  controllers: [EquipmentOrderController],
  providers: [EquipmentOrderService],
  exports: [EquipmentOrderService]
})
export class EquipmentOrderModule {
}
