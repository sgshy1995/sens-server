import {HttpStatus, Injectable} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {FindOptionsSelect, FindOptionsWhere, getRepository, Repository} from 'typeorm';
import {User} from '../../db/entities/User';
import {ResponseResult} from '../../types/result.interface';
import {isEmail, isMobile, isNickname, isPassword, isUsername} from '../../utils/validate';
import {encryptPassword, makeSalt} from '../../utils/cryptogram';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,  // 使用泛型注入对应类型的存储库实例
  ) {
  }

  /**
   * 创建
   *
   * @param user User 实体对象
   */
  async createUser(user: User): Promise<ResponseResult> {
    /**
     * 创建新的实体实例，并将此对象的所有实体属性复制到新实体中。 请注意，它仅复制实体模型中存在的属性。
     */
    let responseBody = {code: HttpStatus.OK, message: '创建成功'};

    // 是否有重复的用户名
    const userInfoExistUsername = await this.userRepo.findOne({
      where: {
        username: user.username
      }
    });
    if (userInfoExistUsername) {
      responseBody.code = HttpStatus.CONFLICT;
      responseBody.message = '用户名已存在';
      return responseBody;
    }

    // 手机号
    const userInfoExistEmail = await this.userRepo.findOne({
      where: {
        phone: user.phone
      }
    });
    if (!isMobile(user.phone)){
      responseBody.code = HttpStatus.BAD_REQUEST;
      responseBody.message = '请输入正确格式的手机号';
      return responseBody;
    }
    if (userInfoExistEmail) {
      responseBody.code = HttpStatus.CONFLICT;
      responseBody.message = '手机号已注册';
      return responseBody;
    }

    // 处理密码
    const salt = makeSalt(); // 制作密码盐
    user.password = encryptPassword(user.password, salt);  // 加密密码
    user.salt = salt;
    // 插入数据时，删除 id，以避免请求体内传入 id
    user.id !== null && user.id !== undefined && delete user.id;
    // 初始化 user
    // status
    user.status = 1;

    responseBody.code = HttpStatus.CREATED;
    responseBody.message = '注册成功';

    await this.userRepo.save(user);

    return responseBody;
  }

  /**
   * 删除
   *
   * @param id ID
   */
  async deleteUser(id: string): Promise<void> {
    await this.findOneById(id);
    await this.userRepo.delete(id);
  }

  /**
   * 更新
   *
   * @param id ID
   * @param user User 实体对象
   */
  async updateUser(id: string, user: User): Promise<ResponseResult> {
    let responseBody = {code: HttpStatus.OK, message: '更新成功'};
    if (!id){
      responseBody.code = HttpStatus.BAD_REQUEST;
      responseBody.message = '用户ID不能为空';
      return responseBody;
    }
    let userFind = await this.findOneById(id);
    if (!userFind){
      responseBody.code = HttpStatus.BAD_REQUEST;
      responseBody.message = '用户不存在';
      return responseBody;
    }
    // 更新数据时，删除 id，以避免请求体内传入 id
    user.id !== null && user.id !== undefined && delete user.id;
    // 校验 phone
    if (user.hasOwnProperty('phone')){
      if (!user.phone){
        responseBody.code = HttpStatus.BAD_REQUEST;
        responseBody.message = '手机号不能为空';
        return responseBody;
      }
      if (!isMobile(user.phone)){
        responseBody.code = HttpStatus.BAD_REQUEST;
        responseBody.message = '请输入正确格式的手机号';
        return responseBody;
      }
      const userPhoneExist =  await this.findOneByAny({phone: user.phone});
      if (user.phone && userPhoneExist){
        responseBody.code = HttpStatus.CONFLICT;
        responseBody.message = '手机号已被注册';
        return responseBody;
      }
    }
    userFind = Object.assign(userFind, user)
    await this.userRepo.update(id, userFind);
    return responseBody;
  }

  /**
   * 更新
   *
   * @param id ID
   * @param user User 实体对象
   */
  async update(id: number, user: User): Promise<ResponseResult> {
    let responseBody = {code: HttpStatus.OK, message: '更新成功'};
    await this.userRepo.update(id, user);
    return responseBody;
  }

  /**
   * 根据ID查询
   *
   * @param id ID
   */
  async findOneUserById(id: string): Promise<ResponseResult> {
    const userFind = await this.findOneById(id, {
      username: true,
      name: true,
      wx_nickname: true,
      wx_unionid: true,
      avatar: true,
      phone: true,
      id: true,
      gender: true,
      authenticate: true,
      identity: true,
      status: true,
      recent_login_time: true,
      created_at: true,
      updated_at: true,
    });
    return userFind ?
      {
        code: HttpStatus.OK,
        message: '查询成功',
        data: userFind
      } : {
        code: HttpStatus.NOT_FOUND,
        message: '用户不存在'
      };
  }

  /**
   * 根据 username 查询
   *
   * @param username 根据 username 查询
   */
  async findOneUserByUsername(username: string): Promise<ResponseResult> {
    const userFind = await this.findOneByUsername(username, {
      username: true,
      name: true,
      wx_nickname: true,
      wx_unionid: true,
      avatar: true,
      phone: true,
      id: true,
      gender: true,
      authenticate: true,
      identity: true,
      status: true,
      recent_login_time: true,
      created_at: true,
      updated_at: true,
    });
    return userFind ?
      {
        code: HttpStatus.OK,
        message: '查询成功',
        data: userFind
      } : {
        code: HttpStatus.NOT_FOUND,
        message: '用户不存在'
      };
  }

  /**
   * 根据 ID 查询单个信息，如果不存在则抛出404异常
   * @param id ID
   * @param select select conditions
   */
  public async findOneById(id: string, select?: FindOptionsSelect<User>): Promise<User | undefined> {
    return await this.userRepo.findOne({where: {id}, select});
  }

  /**
   * 根据 phone 查询单个信息，如果不存在则抛出404异常
   * @param phone phone
   * @param select select conditions
   */
  public async findOneByPhone(phone: string, select?: FindOptionsSelect<User>): Promise<User | undefined> {
    return await this.userRepo.findOne({where: {phone}, select});
  }

  /**
   * 根据 ids 查询单个信息，如果不存在则抛出404异常
   * @param ids ids
   * @param select select conditions
   */
  public async findManyByIds(ids: number[], select?: FindOptionsSelect<User>): Promise<User[] | undefined> {
    return await getRepository(User)
      .createQueryBuilder('user')
      .select(['user.id', 'user.username', 'user.avatar', 'user.name'])
      .where('user.id IN (:...ids)', {ids})
      .orderBy('user.id')
      .getMany();
  }

  /**
   * 根据 username 查询单个信息，如果不存在则抛出404异常
   * @param username username
   @param select select conditions
   */
  public async findOneByUsername(username: string, select?: FindOptionsSelect<User>): Promise<User | undefined> {
    return await this.userRepo.findOne({where: {username, status: 1}, select});
  }

  /**
   * 根据 custom 查询单个信息，如果不存在则抛出404异常
   * @param custom any
   @param select select conditions
   */
  public async findOneByAny(custom: FindOptionsWhere<User>, select?: FindOptionsSelect<User>): Promise<User | undefined> {
    return await this.userRepo.findOne({where: custom, select});
  }
}
