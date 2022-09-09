import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { PrescriptionController } from "./prescription.controller";
import { Prescription } from "../../db/entities/Prescription";
import { PrescriptionService } from "./prescription.service";
import { UserModule } from "../user/user.module";

@Module({
  imports: [TypeOrmModule.forFeature([Prescription]), forwardRef(() => UserModule)],
  controllers: [PrescriptionController],
  providers: [PrescriptionService],
  exports: [PrescriptionService]
})
export class PrescriptionModule {
}
