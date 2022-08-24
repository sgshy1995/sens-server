import { forwardRef, HttpStatus, Inject, Injectable } from "@nestjs/common";
import {InjectRepository} from '@nestjs/typeorm';
import {Repository, FindOptionsSelect} from 'typeorm';
import {Notification } from "../../db/entities/Notification";
import {ResponseResult} from '../../types/result.interface';
import {UserService} from "../user/user.service";

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification) private readonly notificationRepo: Repository<Notification>,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService
  ) {
  }

  /**
   * 创建
   *
   * @param notification notification 实体对象
   */
  async createNotification(notification: { [T in keyof Notification] : any }): Promise<void> {
    await this.notificationRepo.save(notification)
  }

  /**
   * 创建
   *
   * @param notifications notifications 实体对象
   */
  async createNotifications(notifications: Notification[]): Promise<void> {
    await this.notificationRepo.save(notifications)
  }

  /**
   * 更新
   *
   * @param user_id user_id
   * @param notification notification 实体对象
   */
  async updateInfoByUserId(user_id: string, notification: Notification): Promise<ResponseResult> {
    const notificationFind = await this.notificationRepo.findOne({
      where: {
        user_id
      }
    })
    await this.notificationRepo.update(notificationFind.id, notification)
    return {
      code: HttpStatus.OK,
      message: '更新成功'
    }
  }

  /**
   * 根据 user_id 查询
   *
   * @param user_id user_id
   */
  async findOneNotificationByUserId(user_id: string): Promise<ResponseResult> {
    const infoFind = await this.findOneByUserId(user_id, {
      id: true,
      user_id: true,
      notification_type: true,
      sys_notification_id: true,
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
   * 根据 user_id 查询单个信息，如果不存在则抛出404异常
   * @param user_id user_id
   * @param select select conditions
   */
  public async findOneByUserId(user_id: string, select?: FindOptionsSelect<Notification>): Promise<Notification | undefined> {
    return await this.notificationRepo.findOne({where: {user_id}, select});
  }
}
