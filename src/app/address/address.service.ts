import { forwardRef, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, FindOptionsSelect } from "typeorm";
import { Address } from "../../db/entities/Address";
import { ResponseResult } from "../../types/result.interface";
import { UserInfoService } from "../user_info/user.info.service";

@Injectable()
export class AddressService {
  constructor(
    @InjectRepository(Address) private readonly addressRepo: Repository<Address>,
    @Inject(forwardRef(() => UserInfoService))
    private readonly userInfoService: UserInfoService
  ) {
  }

  /**
   * 创建地址
   * @param address address 实体对象
   */
  async createAddress(address: Address): Promise<ResponseResult> {
    let responseBody = { code: HttpStatus.OK, message: "发布成功" };
    const addressesFind = await this.findManyByUserId(address.user_id);
    if (addressesFind.length >= 20) {
      return {
        code: HttpStatus.BAD_REQUEST,
        message: "最多保存二十个地址"
      };
    }
    // 插入数据时，删除 id，以避免请求体内传入 id
    address.id !== null && address.id !== undefined && delete address.id;
    // 状态
    address.status = 1;
    await this.addressRepo.save(address);
    // 如果是第一个地址，则设置为默认
    if (addressesFind.length === 0) {
      const userInfo = await this.userInfoService.findOneByUserId(address.user_id);
      userInfo.default_address_id = address.id;
      await this.userInfoService.updateInfoByUserId(address.user_id, userInfo);
    }
    return responseBody;
  }

  /**
   * 更新
   *
   * @param address address 实体对象
   */
  async updateAddress(address: Address): Promise<ResponseResult> {
    const addressFind = await this.addressRepo.findOne({ where: { id: address.id } });
    const addressUpdate = Object.assign(addressFind, address);
    await this.addressRepo.update(addressUpdate.id, addressUpdate);
    if (addressUpdate.status)
      return {
        code: HttpStatus.OK,
        message: "更新成功"
      };
  }

  /**
   * 查询所有的处方
   */
  async findAllAddress(): Promise<ResponseResult> {
    const prescriptionsFind = await this.findAll({
      id: true,
      user_id: true,
      province_code: true,
      city_code: true,
      area_code: true,
      detail_text: true,
      all_text: true,
      phone: true,
      name: true,
      tag: true,
      status: true,
      created_at: true,
      updated_at: true
    });
    return {
      code: HttpStatus.OK,
      message: "查询成功",
      data: prescriptionsFind
    };
  }

  /**
   * 查询多个处方
   * @param user_id user_id
   */
  async findManyAddressesByUserId(user_id: string): Promise<ResponseResult> {
    const addressesFind = await this.findManyByUserId(user_id, {
      id: true,
      user_id: true,
      province_code: true,
      city_code: true,
      area_code: true,
      detail_text: true,
      all_text: true,
      phone: true,
      name: true,
      tag: true,
      status: true,
      created_at: true,
      updated_at: true
    });
    return {
      code: HttpStatus.OK,
      message: "查询成功",
      data: addressesFind
    };
  }


  /**
   * 根据 id 查询
   *
   * @param id id
   */
  async findOneAddressById(id: string): Promise<ResponseResult> {
    const addressFind = await this.findOneById(id, {
      id: true,
      user_id: true,
      province_code: true,
      city_code: true,
      area_code: true,
      detail_text: true,
      all_text: true,
      phone: true,
      name: true,
      tag: true,
      status: true,
      created_at: true,
      updated_at: true
    });
    return addressFind ?
      {
        code: HttpStatus.OK,
        message: "查询成功",
        data: addressFind
      } : {
        code: HttpStatus.NOT_FOUND,
        message: "记录不存在"
      };
  }

  /**
   * 根据 id 删除
   *
   * @param id id
   * @param user_id user_id
   */
  async deleteOneAddressById(id: string, user_id: string): Promise<ResponseResult> {
    const addressFind = await this.findOneById(id);
    if (!addressFind) {
      return {
        code: HttpStatus.NOT_FOUND,
        message: "记录不存在"
      };
    }
    await this.addressRepo.remove(addressFind);
    // 更新用户信息
    const addressesFind = await this.findManyByUserId(user_id);
    const userInfo = await this.userInfoService.findOneByUserId(user_id);
    if (userInfo.default_address_id === id && addressesFind.length) {
      // 如果删除的是默认地址，且还有其他地址
      userInfo.default_address_id = addressesFind[0].id;
      await this.userInfoService.updateInfoByUserId(user_id, userInfo);
    }else if (!addressesFind.length){
      // 如果没有地址
      userInfo.default_address_id = null;
      await this.userInfoService.updateInfoByUserId(user_id, userInfo);
    }
    return {
      code: HttpStatus.OK,
      message: "删除成功"
    };
  }

  /**
   * 根据 id 查询单个信息，如果不存在则抛出404异常
   * @param id id
   * @param select select conditions
   */
  public async findOneById(id: string, select?: FindOptionsSelect<Address>): Promise<Address | undefined> {
    return await this.addressRepo.findOne({ where: { id }, select });
  }


  /**
   * 根据用户查询多个处方
   * @param user_id user_id
   * @param select select conditions
   */
  public async findManyByUserId(user_id: string, select?: FindOptionsSelect<Address>): Promise<Address[]> {
    return await this.addressRepo.find({
      where: { user_id },
      order: { created_at: "asc" },
      select
    });
  }

  /**
   * 查询所有处方
   * @param select select conditions
   */
  public async findAll(select?: FindOptionsSelect<Address>): Promise<Address[] | undefined> {
    return await this.addressRepo.find({
      where: { status: 1 },
      order: { created_at: "desc" },
      select
    });
  }

}
