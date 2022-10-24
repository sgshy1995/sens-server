import { forwardRef, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, FindOptionsSelect, FindOptionsWhere, Like } from "typeorm";
import { PainQuestion } from "../../db/entities/PainQuestion";
import { ResponseResult } from "../../types/result.interface";
import { UserService } from "../user/user.service";
import { PainReplyService } from "../pain_reply/pain.reply.service";
import { PainCommentService } from "../pain_comment/pain.comment.service";

const moment = require("moment");

@Injectable()
export class PainQuestionService {
  constructor(
    @InjectRepository(PainQuestion) private readonly painQuestionRepo: Repository<PainQuestion>,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    @Inject(forwardRef(() => PainReplyService))
    private readonly painReplyService: PainReplyService,
    @Inject(forwardRef(() => PainCommentService))
    private readonly painCommentService: PainCommentService
  ) {
  }

  /**
   * 创建问题
   * @param user_id user_id 用户id
   * @param painQuestion painQuestion 实体对象
   */
  async createPainQuestion(user_id: string, painQuestion: PainQuestion): Promise<ResponseResult> {
    let responseBody = { code: HttpStatus.OK, message: "发布成功" };
    // 插入数据时，删除 id，以避免请求体内传入 id
    painQuestion.id !== null && painQuestion.id !== undefined && delete painQuestion.id;
    // 答复数量
    painQuestion.reply_num = 0;
    // 收藏数量
    painQuestion.collect_num = 0;
    // 收藏id集合
    painQuestion.collect_user_ids && delete painQuestion.collect_user_ids;
    // 发布时间
    painQuestion.question_time = new Date();
    // 是否匿名
    painQuestion.anonymity = painQuestion.anonymity ? 1 : 0;
    // 是否有专业回答
    painQuestion.has_major = 0;
    // 状态
    painQuestion.status = 1;
    // 用户id
    painQuestion.user_id = user_id;
    await this.painQuestionRepo.save(painQuestion);
    return responseBody;
  }

  /**
   * 收藏变更
   *
   * @param id id 问题id
   * @param status status 收藏状态 0 取消 1 收藏
   * @param user_id user_id 收藏操作人的用户id
   */
  async updateCollect(id: string, status: number, user_id: string): Promise<ResponseResult> {
    const painQuestionFind = await this.painQuestionRepo.findOne({
      where: {
        id,
        status: 1
      }
    });
    if (!painQuestionFind) {
      return {
        code: HttpStatus.NOT_FOUND,
        message: "问题记录无效"
      };
    }
    if (status === 1) {
      painQuestionFind.collect_num += 1;
      painQuestionFind.collect_user_ids = painQuestionFind.collect_user_ids ? painQuestionFind.collect_user_ids + "," + user_id : user_id;
    } else if (status === 0) {
      painQuestionFind.collect_num -= 1;
      const collect_user_ids_list = painQuestionFind.collect_user_ids.split(",");
      const find_index = collect_user_ids_list.findIndex(item => item === user_id);
      collect_user_ids_list.splice(find_index, 1);
      painQuestionFind.collect_user_ids = collect_user_ids_list.join();
    }
    await this.painQuestionRepo.update(painQuestionFind.id, painQuestionFind);
    return {
      code: HttpStatus.OK,
      message: "更新成功"
    };
  }

  /**
   * 更新
   *
   * @param user_id user_id
   * @param painQuestion painQuestion 实体对象
   */
  async updatePainQuestionByUserId(user_id: string, painQuestion: PainQuestion): Promise<ResponseResult> {
    const painQuestionFind = await this.painQuestionRepo.findOne({
      where: {
        user_id
      }
    });
    await this.painQuestionRepo.update(painQuestionFind.id, painQuestion);
    return {
      code: HttpStatus.OK,
      message: "更新成功"
    };
  }

  /**
   * 根据id更新
   *
   * @param id id
   * @param painQuestion painQuestion 实体对象
   */
  async updatePainQuestionById(id: string, painQuestion: PainQuestion): Promise<ResponseResult> {
    const painQuestionFind = await this.painQuestionRepo.findOne({
      where: {
        id
      }
    });
    const painQuestionUpdate = Object.assign(painQuestionFind, painQuestion);
    await this.painQuestionRepo.update(id, painQuestionUpdate);
    return {
      code: HttpStatus.OK,
      message: "更新成功"
    };
  }

  /**
   * 查询所有的问题
   */
  async findAllPainQuestions(): Promise<ResponseResult> {
    const painQuestionFind = await this.findAll({
      id: true,
      user_id: true,
      pain_type: true,
      description: true,
      injury_history: true,
      question_time: true,
      reply_num: true,
      collect_num: true,
      collect_user_ids: true,
      has_major: true,
      anonymity: true,
      image_data: true,
      status: true,
      created_at: true,
      updated_at: true
    });
    for (let i = 0; i < painQuestionFind.length; i++) {
      const user = await this.userService.findOneById(painQuestionFind[i].user_id);
      painQuestionFind[i].question_time = moment(painQuestionFind[i].question_time, "YYYY-MM-DD HH:mm:ss").format("YYYY-MM-DD HH:mm:ss");
      Object.defineProperties(painQuestionFind[i], {
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
    }
    return {
      code: HttpStatus.OK,
      message: "查询成功",
      data: painQuestionFind
    };
  }

  /**
   * 查询多个的问题
   * @param custom custom find options
   * @param keyword keyword option
   */
  async findManyPainQuestions(custom: FindOptionsWhere<PainQuestion>, keyword?: string): Promise<ResponseResult> {
    const painQuestionFind = await this.findMany(custom, keyword, {
      id: true,
      user_id: true,
      pain_type: true,
      description: true,
      injury_history: true,
      question_time: true,
      reply_num: true,
      collect_num: true,
      collect_user_ids: true,
      has_major: true,
      anonymity: true,
      image_data: true,
      status: true,
      created_at: true,
      updated_at: true
    });
    for (let i = 0; i < painQuestionFind.length; i++) {
      const user = await this.userService.findOneById(painQuestionFind[i].user_id);
      painQuestionFind[i].question_time = moment(painQuestionFind[i].question_time, "YYYY-MM-DD HH:mm:ss").format("YYYY-MM-DD HH:mm:ss");
      Object.defineProperties(painQuestionFind[i], {
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
    }
    return {
      code: HttpStatus.OK,
      message: "查询成功",
      data: painQuestionFind
    };
  }

  /**
   * 根据 id 查询
   *
   * @param id id
   */
  async findOnePainQuestionById(id: string): Promise<ResponseResult> {
    const painQuestionFind = await this.findOneById(id, {
      id: true,
      user_id: true,
      pain_type: true,
      description: true,
      injury_history: true,
      question_time: true,
      reply_num: true,
      collect_num: true,
      collect_user_ids: true,
      has_major: true,
      anonymity: true,
      image_data: true,
      status: true,
      created_at: true,
      updated_at: true
    });
    if (painQuestionFind) painQuestionFind.question_time = moment(painQuestionFind.question_time, "YYYY-MM-DD HH:mm:ss").format("YYYY-MM-DD HH:mm:ss");
    return painQuestionFind ?
      {
        code: HttpStatus.OK,
        message: "查询成功",
        data: painQuestionFind
      } : {
        code: HttpStatus.NOT_FOUND,
        message: "记录不存在"
      };
  }

  /**
   * 根据 id 查询单个信息，如果不存在则抛出404异常
   * @param id id
   * @param select select conditions
   */
  public async findOneById(id: string, select?: FindOptionsSelect<PainQuestion>): Promise<PainQuestion | undefined> {
    return await this.painQuestionRepo.findOne({ where: { id }, select });
  }

  /**
   * 查询多个问题
   * @param custom custom find conditions
   * @param keyword keyword condition
   * @param select select conditions
   */
  public async findMany(custom: FindOptionsWhere<PainQuestion>, keyword?: string, select?: FindOptionsSelect<PainQuestion>): Promise<PainQuestion[] | undefined> {
    if (keyword) {
      custom.hasOwnProperty("description") && delete custom.description;
      custom.hasOwnProperty("pain_type") && delete custom.pain_type;
    }
    if (custom.collect_user_ids) {
      custom.collect_user_ids = Like(`%${custom.collect_user_ids}%`);
    }
    return await this.painQuestionRepo.createQueryBuilder("pain_question")
      .where(custom)
      .having("pain_question.description LIKE :description", { description: `%${keyword}%` })
      .orHaving("pain_question.pain_type LIKE :pain_type", { pain_type: `%${keyword}%` })
      .select()
      .orderBy("pain_question.updated_at", "DESC")
      .getMany();
  }

  /**
   * 查询所有问题
   * @param select select conditions
   */
  public async findAll(select?: FindOptionsSelect<PainQuestion>): Promise<PainQuestion[] | undefined> {
    return await this.painQuestionRepo.find({ where: { status: 1 }, order: { updated_at: "desc" }, select });
  }

}
