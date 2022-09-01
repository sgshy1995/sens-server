import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { PainQuestionController } from "./pain.question.controller";
import { PainQuestion } from "../../db/entities/PainQuestion";
import { PainQuestionService } from "./pain.question.service";
import { UserModule } from "../user/user.module";
import { PainReplyModule } from "../pain_reply/pain.reply.module";
import { PainCommentModule } from "../pain_comment/pain.comment.module";

@Module({
  imports: [TypeOrmModule.forFeature([PainQuestion]), forwardRef(() => UserModule), forwardRef(() => PainReplyModule), forwardRef(() => PainCommentModule)],
  controllers: [PainQuestionController],
  providers: [PainQuestionService],
  exports: [PainQuestionService]
})
export class PainQuestionModule {
}
