import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { EquipmentChartController } from "./equipment.chart.controller";
import { EquipmentChart } from "../../db/entities/EquipmentChart";
import { EquipmentChartService } from "./equipment.chart.service";
import { EquipmentModule } from "../equipment/equipment.module";
import { EquipmentModelModule } from "../equipment_model/equipment.model.module";

@Module({
  imports: [TypeOrmModule.forFeature([EquipmentChart]), forwardRef(() => EquipmentModule), forwardRef(() => EquipmentModelModule)],
  controllers: [EquipmentChartController],
  providers: [EquipmentChartService],
  exports: [EquipmentChartService]
})
export class EquipmentChartModule {
}
