import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { TopUpOrderController } from "./top.up.order.controller";
import { TopUpOrder } from "../../db/entities/TopUpOrder";
import { TopUpOrderService } from "./top.up.order.service";
import { UserInfoModule } from "../user_info/user.info.module";

@Module({
  imports: [TypeOrmModule.forFeature([TopUpOrder]), forwardRef(() => UserInfoModule)],
  controllers: [TopUpOrderController],
  providers: [TopUpOrderService],
  exports: [TopUpOrderService]
})
export class TopUpOrderModule {
}
