import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { PainCommentController } from "./pain.comment.controller";
import { PainComment } from "../../db/entities/PainComment";
import { PainCommentService } from "./pain.comment.service";
import { UserModule } from "../user/user.module";
import { PainQuestionModule } from "../pain_question/pain.question.module";
import { PainReplyModule } from "../pain_reply/pain.reply.module";

@Module({
  imports: [TypeOrmModule.forFeature([PainComment]), forwardRef(() => UserModule), forwardRef(() => PainQuestionModule), forwardRef(() => PainReplyModule)],
  controllers: [PainCommentController],
  providers: [PainCommentService],
  exports: [PainCommentService]
})
export class PainCommentModule {
}
