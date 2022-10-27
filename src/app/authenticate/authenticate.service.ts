import { forwardRef, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, FindOptionsSelect, FindOptionsWhere, Like, MoreThanOrEqual } from "typeorm";
import { Authenticate } from "../../db/entities/Authenticate";
import { PaginationQuery, ResponsePaginationResult, ResponseResult } from "../../types/result.interface";
import { UserService } from "../user/user.service";

@Injectable()
export class AuthenticateService {
  constructor(
    @InjectRepository(Authenticate) private readonly authenticateRepo: Repository<Authenticate>,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService
  ) {
  }

  /**
   * 创建认证，待审核
   * @param authenticate authenticate 实体对象
   */
  async createAuthenticate(authenticate: Authenticate): Promise<ResponseResult> {
    let responseBody = { code: HttpStatus.OK, message: "创建成功" };
    const userFind = await this.userService.findOneById(authenticate.user_id);
    if (!userFind) {
      return {
        code: HttpStatus.NOT_FOUND,
        message: "用户不存在"
      };
    }
    const authenticateExistFind = await this.findOneExistByUserId(authenticate.user_id);
    if (authenticateExistFind) {
      return {
        code: HttpStatus.CONFLICT,
        message: "已存在认证信息，请勿重复提交"
      };
    }
    // 插入数据时，删除 id，以避免请求体内传入 id
    authenticate.id !== null && authenticate.id !== undefined && delete authenticate.id;
    // 审核意见
    authenticate.audit_info !== null && authenticate.audit_info !== undefined && delete authenticate.audit_info;
    // 有效期
    authenticate.validity_time !== null && authenticate.validity_time !== undefined && delete authenticate.validity_time;
    // 状态 待审核
    authenticate.status = 2;
    await this.authenticateRepo.save(authenticate);
    userFind.authenticate = 1;
    await this.userService.updateUser(userFind.id, userFind);
    return responseBody;
  }

  /**
   * 更新
   *
   * @param authenticate authenticate 实体对象
   */
  async updateAuthenticate(authenticate: Authenticate): Promise<ResponseResult> {
    const authenticateFind = await this.authenticateRepo.findOne({
      where: {
        id: authenticate.id
      }
    });
    if (!authenticateFind) {
      return {
        code: HttpStatus.NOT_FOUND,
        message: "认证主体不存在"
      };
    }
    const authenticateUpdate = Object.assign(authenticateFind, authenticate);
    await this.authenticateRepo.update(authenticateUpdate.id, authenticateUpdate);
    if (authenticateUpdate.status === 2){
      const userFind = await this.userService.findOneById(authenticate.user_id);
      userFind.authenticate = 1;
      await this.userService.updateUser(userFind.id, userFind);
    }
    return {
      code: HttpStatus.OK,
      message: "更新成功"
    };
  }

  /**
   * 审核认证
   *
   * @param id id
   * @param status 审核状态 3 通过 1 驳回
   * @param audit_info 审核意见
   * @param validity_time 有效期
   */
  async auditAuthenticateById(id: string, status: number, audit_info: string, validity_time: string): Promise<ResponseResult> {
    const authenticateFind = await this.authenticateRepo.findOne({
      where: {
        id
      }
    });
    if (!authenticateFind) {
      return {
        code: HttpStatus.NOT_FOUND,
        message: "认证主体不存在"
      };
    }
    if (status !== 3 && status !== 1) {
      return {
        code: HttpStatus.BAD_REQUEST,
        message: "审核状态错误"
      };
    }
    const userFind = await this.userService.findOneById(authenticateFind.user_id);
    if (status === 3) {
      // 审核通过
      userFind.authenticate = 2;
      userFind.identity = 1;
      authenticateFind.validity_time = new Date(validity_time);
    } else {
      // 审核驳回
      userFind.authenticate = 0;
      userFind.identity = 0;
    }
    authenticateFind.status = status;
    authenticateFind.audit_info = audit_info;
    await this.authenticateRepo.update(authenticateFind.id, authenticateFind);
    await this.userService.updateUser(authenticateFind.user_id, userFind);
    return {
      code: HttpStatus.OK,
      message: "更新成功"
    };
  }

  /**
   * 查询多个认证，带分页
   * @param custom custom find options
   * @param query custom find query
   */
  async findManyAuthenticates(custom: FindOptionsWhere<Authenticate>, query: PaginationQuery): Promise<ResponsePaginationResult> {
    const [authenticatesFind, totalCount] = await this.findMany(custom, query, {
      id: true,
      user_id: true,
      name: true,
      phone: true,
      gender: true,
      organization: true,
      identity_card_front: true,
      identity_card_back: true,
      practicing_certificate: true,
      employee_card: true,
      fcc: true,
      audit_info: true,
      validity_time: true,
      status: true,
      created_at: true,
      updated_at: true
    });
    for (let i = 0; i < authenticatesFind.length; i++) {
      const userFind = await this.userService.findOneById(authenticatesFind[i].user_id);
      Object.defineProperty(authenticatesFind[i], "user_info", {
        value: userFind,
        enumerable: true,
        configurable: true,
        writable: true
      });
    }
    return {
      code: HttpStatus.OK,
      message: "查询成功",
      data: {
        data: authenticatesFind,
        pageSize: query.pageSize,
        pageNo: query.pageNo,
        totalCount: totalCount,
        totalPage: Math.ceil(totalCount / query.pageSize)
      }
    };
  }

  /**
   * 根据 id 查询
   *
   * @param id id
   */
  async findOneAuthenticateById(id: string): Promise<ResponseResult> {
    const authenticateFind = await this.findOneById(id, {
      id: true,
      user_id: true,
      name: true,
      phone: true,
      gender: true,
      organization: true,
      identity_card_front: true,
      identity_card_back: true,
      practicing_certificate: true,
      employee_card: true,
      fcc: true,
      audit_info: true,
      validity_time: true,
      status: true,
      created_at: true,
      updated_at: true
    });
    if (!authenticateFind) {
      return {
        code: HttpStatus.NOT_FOUND,
        message: "记录不存在"
      };
    }
    const userFind = await this.userService.findOneById(authenticateFind.user_id);
    Object.defineProperty(authenticateFind, "user_info", {
      value: userFind,
      enumerable: true,
      configurable: true,
      writable: true
    });
    return {
      code: HttpStatus.OK,
      message: "查询成功",
      data: authenticateFind
    };
  }

  /**
   * 根据 user_id 查询
   *
   * @param user_id user_id
   */
  async findOneAuthenticateByUserId(user_id: string): Promise<ResponseResult> {
    const authenticateFind = await this.findOneByUserId(user_id, {
      id: true,
      user_id: true,
      name: true,
      phone: true,
      gender: true,
      organization: true,
      identity_card_front: true,
      identity_card_back: true,
      practicing_certificate: true,
      employee_card: true,
      fcc: true,
      audit_info: true,
      validity_time: true,
      status: true,
      created_at: true,
      updated_at: true
    });
    return {
      code: HttpStatus.OK,
      message: "查询成功",
      data: authenticateFind
    }
  }

  /**
   * 根据 id 查询单个信息，如果不存在则抛出404异常
   * @param id id
   * @param select select conditions
   */
  public async findOneById(id: string, select?: FindOptionsSelect<Authenticate>): Promise<Authenticate | undefined> {
    return await this.authenticateRepo.findOne({ where: { id }, select });
  }

  /**
   * 根据 user_id 查询单个已存在信息，如果不存在则抛出404异常
   * @param user_id id
   * @param select select conditions
   */
  public async findOneExistByUserId(user_id: string, select?: FindOptionsSelect<Authenticate>): Promise<Authenticate | undefined> {
    return await this.authenticateRepo.findOne({ where: { user_id, status: MoreThanOrEqual(2) }, select });
  }

  /**
   * 根据 user_id 查询单个信息，如果不存在则抛出404异常
   * @param user_id id
   * @param select select conditions
   */
  public async findOneByUserId(user_id: string, select?: FindOptionsSelect<Authenticate>): Promise<Authenticate | undefined> {
    return await this.authenticateRepo.findOne({ where: { user_id }, select });
  }

  /**
   * 查询多个认证，带分页
   * @param custom custom find conditions
   * @param query custom find query
   * @param select select conditions
   */
  public async findMany(custom: FindOptionsWhere<Authenticate>, query: PaginationQuery, select?: FindOptionsSelect<Authenticate>): Promise<[Authenticate[], number]> {
    const take = query.pageSize || 10;
    const page = query.pageNo || 1;
    const skip = (page - 1) * take;
    if (custom.name) {
      custom.name = Like(`%${custom.name}%`);
    }
    if (custom.phone) {
      custom.phone = Like(`%${custom.phone}%`);
    }
    if (custom.organization) {
      custom.organization = Like(`%${custom.organization}%`);
    }
    return await this.authenticateRepo.findAndCount({
      where: { ...custom },
      order: { updated_at: "desc" },
      take,
      skip,
      select
    });
  }

}
