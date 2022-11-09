import { forwardRef, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, FindOptionsSelect } from "typeorm";
import { Room } from "../../db/entities/Room";
import { ResponseResult } from "../../types/result.interface";
import { BookService } from "../book/book.service";
import { UserService } from "../user/user.service";
import Chance = require("chance");

const chance = new Chance();

import GenerateTestUserSig from "../../utils/GenerateTestUserSig";
import TRTCConfig from "../../config/trtc.config";

@Injectable()
export class RoomService {
  constructor(
    @InjectRepository(Room) private readonly roomRepo: Repository<Room>,
    @Inject(forwardRef(() => BookService))
    private readonly bookService: BookService,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService
  ) {
  }

  /**
   * 创建房间
   * @param room Room 实体对象
   */
  async createRoom(room: Room): Promise<ResponseResult> {
    let responseBody = { code: HttpStatus.OK, message: "创建成功" };
    // 房间号
    room.room_no = chance.integer({
      min: 10000000,
      max: 99999999
    }).toString();
    // 插入数据时，删除 id，以避免请求体内传入 id
    room.id !== null && room.id !== undefined && delete room.id;
    // 状态
    room.status = 1;
    await this.roomRepo.save(room);
    return responseBody;
  }

  /**
   * 进入房间
   * @param id Room Id
   * @param role 角色 lecturer | patient
   * @param user_id 用户id
   */
  async enterRoom(id: string, role: string, user_id: string): Promise<ResponseResult> {
    const roomFind = await this.findOneSuccessById(id);
    if (!roomFind) {
      return {
        code: HttpStatus.NOT_FOUND,
        message: "房间信息无效或已过期"
      };
    }
    if (role !== "lecturer" && role !== "patient") {
      return {
        code: HttpStatus.BAD_REQUEST,
        message: "用户角色错误"
      };
    }
    if ((role === "lecturer" && roomFind.lecturer_user_id === user_id) || (role === "patient" && roomFind.patient_user_id === user_id)) {
      const result = GenerateTestUserSig(user_id);
      const userFind = await this.userService.findOneById(user_id, {
        id: true,
        name: true,
        gender: true,
        avatar: true,
        phone: true,
        identity: true,
        authenticate: true,
        if_lecture_auth: true
      })
      return {
        code: HttpStatus.OK,
        message: "成功生成SIGN",
        data: {
          user: userFind,
          sign: result.sign,
          app_id: Number(result.app_id)
        }
      }
    }else{
      return {
        code: HttpStatus.BAD_REQUEST,
        message: "用户信息不匹配"
      };
    }
  }

  /**
   * 更新
   *
   * @param room Room 实体对象
   */
  async update(room: Room): Promise<ResponseResult> {
    const roomFind = await this.findOneById(room.id);
    if (!roomFind) {
      return {
        code: HttpStatus.NOT_FOUND,
        message: "预约记录不存在"
      };
    }
    const roomUpdate = Object.assign(roomFind, room);
    await this.roomRepo.update(roomUpdate.id, roomUpdate);
    return {
      code: HttpStatus.OK,
      message: "更新成功"
    };
  }

  /**
   * 根据 id 查询
   *
   * @param id id
   */
  async findOneRoomById(id: string): Promise<ResponseResult> {
    const roomFind = await this.findOneById(id, {
      id: true,
      room_no: true,
      lecturer_user_id: true,
      patient_user_id: true,
      book_id: true,
      lecturer_time_id: true,
      patient_course_id: true,
      book_start_time: true,
      book_end_time: true,
      status: true,
      created_at: true,
      updated_at: true
    });
    return roomFind ?
      {
        code: HttpStatus.OK,
        message: "查询成功",
        data: roomFind
      } : {
        code: HttpStatus.NOT_FOUND,
        message: "记录不存在"
      };
  }

  /**
   * 根据 lecturer_user_id 查询
   *
   * @param lecturer_user_id lecturer_user_id
   */
  async findOneRoomByLecturerUserId(lecturer_user_id: string): Promise<ResponseResult> {
    const roomFind = await this.findOneByLecturerUserId(lecturer_user_id, {
      id: true,
      room_no: true,
      lecturer_user_id: true,
      patient_user_id: true,
      book_id: true,
      lecturer_time_id: true,
      patient_course_id: true,
      book_start_time: true,
      book_end_time: true,
      status: true,
      created_at: true,
      updated_at: true
    });
    return roomFind ?
      {
        code: HttpStatus.OK,
        message: "查询成功",
        data: roomFind
      } : {
        code: HttpStatus.NOT_FOUND,
        message: "记录不存在"
      };
  }

  /**
   * 根据 patient_user_id 查询
   *
   * @param patient_user_id patient_user_id
   */
  async findOneRoomByPatientUserId(patient_user_id: string): Promise<ResponseResult> {
    const roomFind = await this.findOneByPatientUserId(patient_user_id, {
      id: true,
      room_no: true,
      lecturer_user_id: true,
      patient_user_id: true,
      book_id: true,
      lecturer_time_id: true,
      patient_course_id: true,
      book_start_time: true,
      book_end_time: true,
      status: true,
      created_at: true,
      updated_at: true
    });
    return roomFind ?
      {
        code: HttpStatus.OK,
        message: "查询成功",
        data: roomFind
      } : {
        code: HttpStatus.NOT_FOUND,
        message: "记录不存在"
      };
  }

  /**
   * 根据 id 短暂删除, 删除房间
   *
   * @param id id
   */
  async deleteOneRoomTemporaryById(id: string): Promise<ResponseResult> {
    const roomFind = await this.findOneById(id);
    if (!roomFind) {
      return {
        code: HttpStatus.NOT_FOUND,
        message: "记录不存在"
      };
    }
    roomFind.status = 0;
    await this.roomRepo.update(roomFind.id, roomFind);
    return {
      code: HttpStatus.OK,
      message: "已删除房间"
    };
  }

  /**
   * 根据 id 删除, 删除房间
   *
   * @param id id
   */
  async deleteOneRoomById(id: string): Promise<ResponseResult> {
    const roomFind = await this.findOneById(id);
    if (!roomFind) {
      return {
        code: HttpStatus.NOT_FOUND,
        message: "记录不存在"
      };
    }
    await this.roomRepo.remove(roomFind);
    return {
      code: HttpStatus.OK,
      message: "已删除房间"
    };
  }

  /**
   * 根据 id 查询单个信息，如果不存在则抛出404异常
   * @param id id
   * @param select select conditions
   */
  public async findOneSuccessById(id: string, select?: FindOptionsSelect<Room>): Promise<Room | undefined> {
    return await this.roomRepo.findOne({ where: { id, status: 1 }, select });
  }

  /**
   * 根据 id 查询单个信息，如果不存在则抛出404异常
   * @param id id
   * @param select select conditions
   */
  public async findOneById(id: string, select?: FindOptionsSelect<Room>): Promise<Room | undefined> {
    return await this.roomRepo.findOne({ where: { id }, select });
  }

  /**
   * 根据 id 查询单个信息，如果不存在则抛出404异常
   * @param book_id id
   * @param select select conditions
   */
  public async findOneSuccessByBookId(book_id: string, select?: FindOptionsSelect<Room>): Promise<Room | undefined> {
    return await this.roomRepo.findOne({ where: { book_id, status: 1 }, select });
  }

  /**
   * 根据 book_id 查询单个信息，如果不存在则抛出404异常
   * @param book_id id
   * @param select select conditions
   */
  public async findOneByBookId(book_id: string, select?: FindOptionsSelect<Room>): Promise<Room | undefined> {
    return await this.roomRepo.findOne({ where: { book_id }, select });
  }

  /**
   * 根据 lecturer_user_id 查询单个信息，如果不存在则抛出404异常
   * @param lecturer_user_id lecturer_user_id
   * @param select select conditions
   */
  public async findOneByLecturerUserId(lecturer_user_id: string, select?: FindOptionsSelect<Room>): Promise<Room | undefined> {
    return await this.roomRepo.findOne({ where: { lecturer_user_id }, select });
  }

  /**
   * 根据 patient_user_id 查询单个信息，如果不存在则抛出404异常
   * @param patient_user_id lecturer_user_id
   * @param select select conditions
   */
  public async findOneByPatientUserId(patient_user_id: string, select?: FindOptionsSelect<Room>): Promise<Room | undefined> {
    return await this.roomRepo.findOne({ where: { patient_user_id }, select });
  }

  /**
   * 查询所有房间
   * @param select select conditions
   */
  public async findAll(select?: FindOptionsSelect<Room>): Promise<Room[] | undefined> {
    return await this.roomRepo.find({
      where: { status: 1 },
      order: { created_at: "desc" },
      select
    });
  }

}
