import { forwardRef, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, FindOptionsSelect, FindOptionsWhere } from "typeorm";
import { PainComment } from "../../db/entities/PainComment";
import { ResponseResult } from "../../types/result.interface";
import { UserService } from "../user/user.service";
import { PainQuestionService } from "../pain_question/pain.question.service";
import { PainReplyService } from "../pain_reply/pain.reply.service";

const moment = require("moment");

@Injectable()
export class PainCommentService {
  constructor(
    @InjectRepository(PainComment) private readonly painCommentRepo: Repository<PainComment>,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    @Inject(forwardRef(() => PainQuestionService))
    private readonly painQuestionService: PainQuestionService,
    @Inject(forwardRef(() => PainReplyService))
    private readonly painReplyService: PainReplyService
  ) {
  }

  /**
   * 创建答复
   * @param user_id user_id 用户id
   * @param painComment painComment 实体对象
   */
  async createPainComment(user_id: string, painComment: PainComment): Promise<ResponseResult> {
    let responseBody = { code: HttpStatus.OK, message: "发布成功" };
    // 插入数据时，删除 id，以避免请求体内传入 id
    painComment.id !== null && painComment.id !== undefined && delete painComment.id;
    // 点赞数量
    painComment.like_num = 0;
    // 点赞id集合
    painComment.like_user_ids && delete painComment.like_user_ids;
    // 发布时间
    painComment.comment_time = new Date();
    // 状态
    painComment.status = 1;
    // 用户id
    painComment.user_id = user_id;
    await this.painCommentRepo.save(painComment);
    // 只要有评论，则答复评论数量+1
    const painReply = await this.painReplyService.findOneById(painComment.reply_id);
    painReply.comment_num += 1;
    await this.painReplyService.updatePainReply(painReply);
    await this.painCommentRepo.save(painComment);
    return responseBody;
  }

  /**
   * 更新
   *
   * @param painComment painComment 实体对象
   */
  async updatePainComment(painComment: PainComment): Promise<ResponseResult> {
    const painCommentFind = await this.painCommentRepo.findOne({ where: { id: painComment.id, status: 1 } });
    const painCommentUpdate = Object.assign(painCommentFind, painComment);
    await this.painCommentRepo.update(painCommentUpdate.id, painCommentUpdate);
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
    const painCommentFind = await this.painCommentRepo.findOne({
      where: {
        id,
        status: 1
      }
    });
    if (!painCommentFind) {
      return {
        code: HttpStatus.NOT_FOUND,
        message: "评论记录无效"
      };
    }
    if (status === 1) {
      painCommentFind.like_num += 1;
      painCommentFind.like_user_ids = painCommentFind.like_user_ids ? painCommentFind.like_user_ids + "," + user_id : user_id;
    } else if (status === 0) {
      painCommentFind.like_num -= 1;
      const like_user_ids_list = painCommentFind.like_user_ids.split(",");
      const find_index = like_user_ids_list.findIndex(item => item === user_id);
      like_user_ids_list.splice(find_index, 1);
      painCommentFind.like_user_ids = like_user_ids_list.join();
    }
    await this.painCommentRepo.update(painCommentFind.id, painCommentFind);
    return {
      code: HttpStatus.OK,
      message: "更新成功"
    };
  }

  /**
   * 查询所有的评论
   */
  async findAllPainComments(): Promise<ResponseResult> {
    const painCommentsFind = await this.findAll({
      id: true,
      user_id: true,
      question_id: true,
      reply_id: true,
      comment_id: true,
      comment_to_user_id: true,
      like_num: true,
      like_user_ids: true,
      comment_content: true,
      comment_time: true,
      status: true,
      created_at: true,
      updated_at: true
    });
    for (let i = 0; i < painCommentsFind.length; i++) {
      const user = await this.userService.findOneById(painCommentsFind[i].user_id);
      painCommentsFind[i].comment_time = moment(painCommentsFind[i].comment_time, "YYYY-MM-DD HH:mm:ss").format("YYYY-MM-DD HH:mm:ss");
      Object.defineProperties(painCommentsFind[i], {
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
        }
      });
      if (painCommentsFind[i].comment_id){
        const to_user = await this.userService.findOneById(painCommentsFind[i].comment_to_user_id);
        Object.defineProperties(painCommentsFind[i], {
          to_name: {
            value: to_user.name,
            configurable: true,
            enumerable: true,
            writable: true
          },
        });
      }
    }
    return {
      code: HttpStatus.OK,
      message: "查询成功",
      data: painCommentsFind
    };
  }

  /**
   * 查询多个的问题
   * @param custom custom find options
   */
  async findManyPainComments(custom: FindOptionsWhere<PainComment>): Promise<ResponseResult> {
    const painCommentsFind = await this.findMany(custom, {
      id: true,
      user_id: true,
      question_id: true,
      reply_id: true,
      comment_id: true,
      comment_to_user_id: true,
      like_num: true,
      like_user_ids: true,
      comment_content: true,
      comment_time: true,
      status: true,
      created_at: true,
      updated_at: true
    });
    for (let i = 0; i < painCommentsFind.length; i++) {
      const user = await this.userService.findOneById(painCommentsFind[i].user_id);
      painCommentsFind[i].comment_time = moment(painCommentsFind[i].comment_time, "YYYY-MM-DD HH:mm:ss").format("YYYY-MM-DD HH:mm:ss");
      Object.defineProperties(painCommentsFind[i], {
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
        }
      });
      if (painCommentsFind[i].comment_id){
        const to_user = await this.userService.findOneById(painCommentsFind[i].comment_to_user_id);
        Object.defineProperties(painCommentsFind[i], {
          to_name: {
            value: to_user.name,
            configurable: true,
            enumerable: true,
            writable: true
          },
        });
      }
    }
    return {
      code: HttpStatus.OK,
      message: "查询成功",
      data: painCommentsFind
    };
  }

  /**
   * 根据 user_id 查询
   *
   * @param user_id user_id
   */
  async findOnePainCommentById(user_id: string): Promise<ResponseResult> {
    const painReplyFind = await this.findOneByUserId(user_id, {
      id: true,
      user_id: true,
      question_id: true,
      reply_id: true,
      comment_id: true,
      comment_to_user_id: true,
      like_num: true,
      like_user_ids: true,
      comment_content: true,
      comment_time: true,
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
  public async findOneByUserId(user_id: string, select?: FindOptionsSelect<PainComment>): Promise<PainComment | undefined> {
    return await this.painCommentRepo.findOne({ where: { user_id }, select });
  }

  /**
   * 根据 id 查询单个信息，如果不存在则抛出404异常
   * @param id id
   * @param select select conditions
   */
  public async findOneById(id: string, select?: FindOptionsSelect<PainComment>): Promise<PainComment | undefined> {
    return await this.painCommentRepo.findOne({ where: { id }, select });
  }

  /**
   * 查询多个答复
   * @param custom custom find conditions
   * @param select select conditions
   */
  public async findMany(custom: FindOptionsWhere<PainComment>, select?: FindOptionsSelect<PainComment>): Promise<PainComment[] | undefined> {
    return await this.painCommentRepo.find({
      where: { ...custom, status: 1 },
      order: { updated_at: "asc" },
      select
    });
  }

  /**
   * 查询所有答复
   * @param select select conditions
   */
  public async findAll(select?: FindOptionsSelect<PainComment>): Promise<PainComment[] | undefined> {
    return await this.painCommentRepo.find({
      where: { status: 1 },
      order: { updated_at: "asc" },
      select
    });
  }

}
