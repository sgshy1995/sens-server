import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { EquipmentController } from "./equipment.controller";
import { Equipment } from "../../db/entities/Equipment";
import { EquipmentService } from "./equipment.service";
import { EquipmentModelModule } from "../equipment_model/equipment.model.module";
import { EquipmentChartModule } from "../equipment_chart/equipment.chart.module";

@Module({
  imports: [TypeOrmModule.forFeature([Equipment]), forwardRef(() => EquipmentModelModule), forwardRef(() => EquipmentChartModule)],
  controllers: [EquipmentController],
  providers: [EquipmentService],
  exports: [EquipmentService]
})
export class EquipmentModule {
}
