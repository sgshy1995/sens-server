import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { EquipmentModelController } from "./equipment.model.controller";
import { EquipmentModel } from "../../db/entities/EquipmentModel";
import { EquipmentModelService } from "./equipment.model.service";
import { EquipmentModule } from "../equipment/equipment.module";
import { EquipmentChartModule } from "../equipment_chart/equipment.chart.module";

@Module({
  imports: [TypeOrmModule.forFeature([EquipmentModel]), forwardRef(() => EquipmentModule), forwardRef(() => EquipmentChartModule)],
  controllers: [EquipmentModelController],
  providers: [EquipmentModelService],
  exports: [EquipmentModelService]
})
export class EquipmentModelModule {
}
