import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { PainReplyController } from "./pain.reply.controller";
import { PainReply } from "../../db/entities/PainReply";
import { PainReplyService } from "./pain.reply.service";
import { UserModule } from "../user/user.module";
import { PainQuestionModule } from "../pain_question/pain.question.module";
import { PainCommentModule } from "../pain_comment/pain.comment.module";

@Module({
  imports: [TypeOrmModule.forFeature([PainReply]), forwardRef(() => UserModule), forwardRef(() => PainQuestionModule), forwardRef(() => PainCommentModule)],
  controllers: [PainReplyController],
  providers: [PainReplyService],
  exports: [PainReplyService]
})
export class PainReplyModule {
}
