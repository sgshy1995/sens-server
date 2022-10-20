import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { CourierController } from "./courier.controller";
import { Courier } from "../../db/entities/Courier";
import { CourierService } from "./courier.service";
import { EquipmentOrderModule } from "../equipment_order/equipment.order.module";

@Module({
  imports: [TypeOrmModule.forFeature([Courier]), forwardRef(() => EquipmentOrderModule)],
  controllers: [CourierController],
  providers: [CourierService],
  exports: [CourierService]
})
export class CourierModule {
}
