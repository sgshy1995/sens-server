import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { RoomController } from "./room.controller";
import { Room } from "../../db/entities/Room";
import { RoomService } from "./room.service";
import { BookModule } from "../book/book.module";
import { UserModule } from "../user/user.module";

@Module({
  imports: [TypeOrmModule.forFeature([Room]), forwardRef(() => BookModule), forwardRef(() => UserModule)],
  controllers: [RoomController],
  providers: [RoomService],
  exports: [RoomService]
})
export class RoomModule {
}
