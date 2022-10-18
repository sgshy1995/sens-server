import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { EquipmentModelController } from "./equipment.model.controller";
import { EquipmentModel } from "../../db/entities/EquipmentModel";
import { EquipmentModelService } from "./equipment.model.service";
import { EquipmentModule } from "../equipment/equipment.module";
import { EquipmentChartModule } from "../equipment_chart/equipment.chart.module";
import { EquipmentOrderModule } from "../equipment_order/equipment.order.module";

@Module({
  imports: [TypeOrmModule.forFeature([EquipmentModel]), forwardRef(() => EquipmentModule), forwardRef(() => EquipmentChartModule), forwardRef(() => EquipmentOrderModule)],
  controllers: [EquipmentModelController],
  providers: [EquipmentModelService],
  exports: [EquipmentModelService]
})
export class EquipmentModelModule {
}
