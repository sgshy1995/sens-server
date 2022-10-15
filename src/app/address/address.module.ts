import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { AddressController } from "./address.controller";
import { Address } from "../../db/entities/Address";
import { AddressService } from "./address.service";
import { UserInfoModule } from "../user_info/user.info.module";

@Module({
  imports: [TypeOrmModule.forFeature([Address]), forwardRef(() => UserInfoModule)],
  controllers: [AddressController],
  providers: [AddressService],
  exports: [AddressService]
})
export class AddressModule {
}
