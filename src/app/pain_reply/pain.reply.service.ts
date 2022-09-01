import { forwardRef, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, FindOptionsSelect, FindOptionsWhere } from "typeorm";
import { PainReply } from "../../db/entities/PainReply";
import { ResponseResult } from "../../types/result.interface";
import { UserService } from "../user/user.service";
import { PainQuestionService } from "../pain_question/pain.question.service";
import { PainCommentService } from "../pain_comment/pain.comment.service";

const moment = require("moment");

@Injectable()
export class PainReplyService {
  constructor(
    @InjectRepository(PainReply) private readonly painReplyRepo: Repository<PainReply>,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    @Inject(forwardRef(() => PainQuestionService))
    private readonly painQuestionService: PainQuestionService,
    @Inject(forwardRef(() => PainCommentService))
    private readonly painCommentService: PainCommentService
  ) {
  }

  /**
   * 创建答复
   * @param user_id user_id 用户id
   * @param painReply painReply 实体对象
   */
  async createPainReply(user_id: string, painReply: PainReply): Promise<ResponseResult> {
    let responseBody = { code: HttpStatus.OK, message: "发布成功" };
    // 插入数据时，删除 id，以避免请求体内传入 id
    painReply.id !== null && painReply.id !== undefined && delete painReply.id;
    // 是否专业回答
    painReply.is_major = 0;
    // 点赞数量
    painReply.like_num = 0;
    // 点赞id集合
    painReply.like_user_ids && delete painReply.like_user_ids;
    // 评论数量
    painReply.comment_num = 0;
    // 发布时间
    painReply.reply_time = new Date();
    // 状态
    painReply.status = 1;
    // 用户id
    painReply.user_id = user_id;
    await this.painReplyRepo.save(painReply);
    // 问题答复数量+1
    const painQuestion = await this.painQuestionService.findOneById(painReply.question_id);
    painQuestion.reply_num += 1;
    await this.painQuestionService.updatePainQuestionById(painQuestion.id, painQuestion);
    return responseBody;
  }

  /**
   * 更新
   *
   * @param painReply painReply 实体对象
   */
  async updatePainReply(painReply: PainReply): Promise<ResponseResult> {
    const painReplyFind = await this.painReplyRepo.findOne({ where: { id: painReply.id, status: 1 } });
    const painReplyUpdate = Object.assign(painReplyFind, painReply);
    await this.painReplyRepo.update(painReplyUpdate.id, painReplyUpdate);
    return {
      code: HttpStatus.OK,
      message: "更新成功"
    };
  }

  /**
   * 点赞变更
   *
   * @param id id 答复id
   * @param status status 点赞状态 0 取消 1 点赞
   * @param user_id user_id 点赞操作人的用户id
   */
  async updateLike(id: string, status: number, user_id: string): Promise<ResponseResult> {
    const painReplyFind = await this.painReplyRepo.findOne({
      where: {
        id,
        status: 1
      }
    });
    if (!painReplyFind){
      return {
        code: HttpStatus.NOT_FOUND,
        message: "答复记录无效"
      };
    }
    if (status === 1){
      painReplyFind.like_num += 1
      painReplyFind.like_user_ids = painReplyFind.like_user_ids ? painReplyFind.like_user_ids + ',' + user_id : user_id
    }else if (status === 0){
      painReplyFind.like_num -= 1
      const like_user_ids_list = painReplyFind.like_user_ids.split(',')
      const find_index = like_user_ids_list.findIndex(item=>item===user_id)
      like_user_ids_list.splice(find_index, 1)
      painReplyFind.like_user_ids = like_user_ids_list.join()
    }
    await this.painReplyRepo.update(painReplyFind.id, painReplyFind);
    return {
      code: HttpStatus.OK,
      message: "更新成功"
    };
  }

  /**
   * 查询所有的答复
   */
  async findAllPainReplies(): Promise<ResponseResult> {
    const painReplyFind = await this.findAll({
      id: true,
      user_id: true,
      is_major: true,
      question_id: true,
      like_num: true,
      like_user_ids: true,
      comment_num: true,
      reply_content: true,
      reply_time: true,
      image_data: true,
      status: true,
      created_at: true,
      updated_at: true
    });
    for (let i = 0; i < painReplyFind.length; i++) {
      const user = await this.userService.findOneById(painReplyFind[i].user_id);
      const comments = await this.painCommentService.findMany({reply_id: painReplyFind[i].id})
      painReplyFind[i].reply_time = moment(painReplyFind[i].reply_time, "YYYY-MM-DD HH:mm:ss").format("YYYY-MM-DD HH:mm:ss");
      Object.defineProperties(painReplyFind[i], {
        name: {
          value: user.name,
          configurable: true,
          enumerable: true,
          writable: true
        },
        avatar: {
          value: user.avatar,
          configurable: true,
          enumerable: true,
          writable: true
        },
        authenticate: {
          value: user.authenticate,
          configurable: true,
          enumerable: true,
          writable: true
        },
        identity: {
          value: user.identity,
          configurable: true,
          enumerable: true,
          writable: true
        },
        comments: {
          value: comments,
          configurable: true,
          enumerable: true,
          writable: true
        }
      });
    }
    return {
      code: HttpStatus.OK,
      message: "查询成功",
      data: painReplyFind
    };
  }

  /**
   * 查询多个的问题
   * @param custom custom find options
   */
  async findManyPainReplies(custom: FindOptionsWhere<PainReply>): Promise<ResponseResult> {
    const painReplyFind = await this.findMany(custom, {
      id: true,
      user_id: true,
      is_major: true,
      question_id: true,
      like_num: true,
      like_user_ids: true,
      comment_num: true,
      reply_content: true,
      reply_time: true,
      image_data: true,
      status: true,
      created_at: true,
      updated_at: true
    });
    for (let i = 0; i < painReplyFind.length; i++) {
      const user = await this.userService.findOneById(painReplyFind[i].user_id);
      const comments = await this.painCommentService.findManyPainComments({reply_id: painReplyFind[i].id})
      painReplyFind[i].reply_time = moment(painReplyFind[i].reply_time, "YYYY-MM-DD HH:mm:ss").format("YYYY-MM-DD HH:mm:ss");
      Object.defineProperties(painReplyFind[i], {
        name: {
          value: user.name,
          configurable: true,
          enumerable: true,
          writable: true
        },
        avatar: {
          value: user.avatar,
          configurable: true,
          enumerable: true,
          writable: true
        },
        authenticate: {
          value: user.authenticate,
          configurable: true,
          enumerable: true,
          writable: true
        },
        identity: {
          value: user.identity,
          configurable: true,
          enumerable: true,
          writable: true
        },
        comments: {
          value: comments.data,
          configurable: true,
          enumerable: true,
          writable: true
        }
      });
    }
    return {
      code: HttpStatus.OK,
      message: "查询成功",
      data: painReplyFind
    };
  }

  /**
   * 根据 user_id 查询
   *
   * @param user_id user_id
   */
  async findOnePainReplyById(user_id: string): Promise<ResponseResult> {
    const painReplyFind = await this.findOneByUserId(user_id, {
      id: true,
      user_id: true,
      is_major: true,
      question_id: true,
      like_num: true,
      like_user_ids: true,
      comment_num: true,
      reply_content: true,
      reply_time: true,
      image_data: true,
      status: true,
      created_at: true,
      updated_at: true
    });
    return painReplyFind ?
      {
        code: HttpStatus.OK,
        message: "查询成功",
        data: painReplyFind
      } : {
        code: HttpStatus.NOT_FOUND,
        message: "记录不存在"
      };
  }

  /**
   * 根据 user_id 查询单个信息，如果不存在则抛出404异常
   * @param user_id user_id
   * @param select select conditions
   */
  public async findOneByUserId(user_id: string, select?: FindOptionsSelect<PainReply>): Promise<PainReply | undefined> {
    return await this.painReplyRepo.findOne({ where: { user_id }, select });
  }

  /**
   * 根据 id 查询单个信息，如果不存在则抛出404异常
   * @param id id
   * @param select select conditions
   */
  public async findOneById(id: string, select?: FindOptionsSelect<PainReply>): Promise<PainReply | undefined> {
    return await this.painReplyRepo.findOne({ where: { id }, select });
  }

  /**
   * 查询多个答复
   * @param custom custom find conditions
   * @param select select conditions
   */
  public async findMany(custom: FindOptionsWhere<PainReply>, select?: FindOptionsSelect<PainReply>): Promise<PainReply[] | undefined> {
    const painReplies = await this.painReplyRepo.find({
      where: { ...custom, status: 1 },
      order: { updated_at: "desc" },
      select
    });
    return painReplies.sort((a, b) => b.is_major - a.is_major);
  }

  /**
   * 查询所有答复
   * @param select select conditions
   */
  public async findAll(select?: FindOptionsSelect<PainReply>): Promise<PainReply[] | undefined> {
    const painReplies = await this.painReplyRepo.find({ where: { status: 1 }, order: { updated_at: "desc" }, select });
    return painReplies.sort((a, b) => b.is_major - a.is_major);
  }

}
