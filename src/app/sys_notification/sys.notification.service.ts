import { forwardRef, HttpStatus, Inject, Injectable } from "@nestjs/common";
import {InjectRepository} from '@nestjs/typeorm';
import {Repository, FindOptionsSelect} from 'typeorm';
import {SysNotification} from "../../db/entities/SysNotification";
import {ResponseResult} from '../../types/result.interface';
import {UserService} from "../user/user.service";

@Injectable()
export class SysNotificationService {
  constructor(
    @InjectRepository(SysNotification) private readonly sysNotificationRepo: Repository<SysNotification>,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService
  ) {
  }

  /**
   * 创建
   *
   * @param sysNotification sysNotification 实体对象
   */
  async createSysNotification(sysNotification: { [T in keyof SysNotification] : any }): Promise<void> {
    await this.sysNotificationRepo.save(sysNotification)
  }

  /**
   * 更新
   *
   * @param id id
   * @param sysNotification sysNotification 实体对象
   */
  async updateSysNotificationById(id: string, sysNotification: SysNotification): Promise<ResponseResult> {
    const sysNotificationFind = await this.sysNotificationRepo.findOne({
      where: {
        id
      }
    })
    await this.sysNotificationRepo.update(sysNotificationFind.id, sysNotification)
    return {
      code: HttpStatus.OK,
      message: '更新成功'
    }
  }

  /**
   * 根据 id 查询
   *
   * @param id id
   */
  async findOneSysNotificationById(id: string): Promise<ResponseResult> {
    const infoFind = await this.findOneById(id, {
      id: true,
      title: true,
      content: true,
      publish_time: true,
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
   * 根据 id 查询单个信息，如果不存在则抛出404异常
   * @param id id
   * @param select select conditions
   */
  public async findOneById(id: string, select?: FindOptionsSelect<SysNotification>): Promise<SysNotification | undefined> {
    return await this.sysNotificationRepo.findOne({where: {id, status: 1}, select});
  }

  /**
   * 查询所有预置通知
   * @param select select conditions
   */
  public async findManyByPreset(select?: FindOptionsSelect<SysNotification>): Promise<SysNotification[]> {
    return await this.sysNotificationRepo.find({where: {preset: 1, status: 1}, select, order: { created_at: 'desc' }});
  }
}
