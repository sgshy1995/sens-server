import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { AuthenticateController } from "./authenticate.controller";
import { Authenticate } from "../../db/entities/Authenticate";
import { AuthenticateService } from "./authenticate.service";
import { UserModule } from "../user/user.module";

@Module({
  imports: [TypeOrmModule.forFeature([Authenticate]), forwardRef(() => UserModule)],
  controllers: [AuthenticateController],
  providers: [AuthenticateService],
  exports: [AuthenticateService]
})
export class AuthenticateModule {
}
