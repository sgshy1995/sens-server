import { forwardRef, HttpStatus, Inject, Injectable } from "@nestjs/common";
import {InjectRepository} from '@nestjs/typeorm';
import {Repository, FindOptionsSelect} from 'typeorm';
import {UserInfo} from '../../db/entities/UserInfo';
import {ResponseResult} from '../../types/result.interface';
import {UserService} from "../user/user.service";

@Injectable()
export class UserInfoService {
  constructor(
    @InjectRepository(UserInfo) private readonly userInfoRepo: Repository<UserInfo>,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService
  ) {
  }

  /**
   * 创建
   *
   * @param info Info 实体对象
   */
  async createInfo(info: { [T in keyof UserInfo] : any }): Promise<void> {
    await this.userInfoRepo.save(info)
  }

  /**
   * 更新
   *
   * @param user_id user_id
   * @param info Info 实体对象
   */
  async updateInfoByUserId(user_id: string, info: UserInfo): Promise<ResponseResult> {
    const infoFind = await this.userInfoRepo.findOne({
      where: {
        user_id
      }
    })
    await this.userInfoRepo.update(infoFind.id, info)
    return {
      code: HttpStatus.OK,
      message: '更新成功'
    }
  }

  /**
   * 账户充值
   *
   * @param user_id user_id
   * @param balance balance 金额
   */
  async addBalanceByUserId(user_id: string, balance: string): Promise<ResponseResult> {
    const infoFind = await this.userInfoRepo.findOne({
      where: {
        user_id
      }
    })
    infoFind.balance = (Number(infoFind.balance) + Number(balance)).toFixed(2)
    await this.userInfoRepo.update(infoFind.id, infoFind)
    return {
      code: HttpStatus.OK,
      message: '账户充值成功'
    }
  }

  /**
   * 根据 user_id 查询
   *
   * @param user_id user_id
   */
  async findOneInfoById(user_id: string): Promise<ResponseResult> {
    const infoFind = await this.findOneByUserId(user_id, {
      id: true,
      user_id: true,
      integral: true,
      balance: true,
      age: true,
      injury_history: true,
      injury_recent: true,
      discharge_abstract: true,
      image_data: true,
      status: true
    });
    return infoFind ?
      {
        code: HttpStatus.OK,
        message: '查询成功',
        data: infoFind
      } : {
        code: HttpStatus.NOT_FOUND,
        message: '记录不存在'
      };
  }

  /**
   * 根据 user_id 查询单个信息，如果不存在则抛出404异常
   * @param user_id user_id
   * @param select select conditions
   */
  public async findOneByUserId(user_id: string, select?: FindOptionsSelect<UserInfo>): Promise<UserInfo | undefined> {
    return await this.userInfoRepo.findOne({where: {user_id}, select});
  }

}
