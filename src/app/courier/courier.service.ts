import { forwardRef, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, FindOptionsSelect } from "typeorm";
import { Courier } from "../../db/entities/Courier";
import { ResponseResult } from "../../types/result.interface";
import { EquipmentOrderService } from "../equipment_order/equipment.order.service";
import courierConfig from "../../config/courier.config";
import * as https from "https";
import * as fs from "fs";
import * as path from "path";

@Injectable()
export class CourierService {
  constructor(
    @InjectRepository(Courier) private readonly courierRepo: Repository<Courier>,
    @Inject(forwardRef(() => EquipmentOrderService))
    private readonly equipmentOrderService: EquipmentOrderService
  ) {
  }

  /**
   * 保存物流信息
   * @param courier courier 实体对象
   */
  async createCourier(courier: Courier): Promise<ResponseResult> {
    let responseBody = { code: HttpStatus.OK, message: "保存成功" };
    // 插入数据时，删除 id，以避免请求体内传入 id
    courier.id !== null && courier.id !== undefined && delete courier.id;
    await this.courierRepo.save(courier);
    return responseBody;
  }

  /**
   * 更新
   *
   * @param courier courier 实体对象
   */
  async updateCourier(courier: Courier): Promise<ResponseResult> {
    const courierFind = await this.courierRepo.findOne({ where: { id: courier.id } });
    const courierUpdate = Object.assign(courierFind, courier);
    await this.courierRepo.update(courierUpdate.id, courierUpdate);
    return {
      code: HttpStatus.OK,
      message: "更新成功"
    };
  }

  /**
   * 查询所有的处方
   */
  async findAllCouriers(): Promise<ResponseResult> {
    const couriersFind = await this.findAll({
      id: true,
      courier_number: true,
      courier_content: true,
      status: true,
      created_at: true,
      updated_at: true
    });
    return {
      code: HttpStatus.OK,
      message: "查询成功",
      data: couriersFind
    };
  }

  /**
   * 根据 id 查询
   *
   * @param id id
   */
  async findOneCourierById(id: string): Promise<ResponseResult> {
    const courierFind = await this.findOneById(id, {
      id: true,
      courier_number: true,
      courier_content: true,
      status: true,
      created_at: true,
      updated_at: true
    });
    return courierFind ?
      {
        code: HttpStatus.OK,
        message: "查询成功",
        data: courierFind
      } : {
        code: HttpStatus.NOT_FOUND,
        message: "记录不存在"
      };
  }

  /**
   * 根据物流单号查询
   *
   * @param courier_number 物流单号
   */
  async findOneCourierByCourierNumber(courier_number: string): Promise<ResponseResult> {
    const courierFind = await this.findOneByCourierNumber(courier_number, {
      id: true,
      courier_number: true,
      courier_content: true,
      status: true,
      created_at: true,
      updated_at: true
    });
    return courierFind ?
      {
        code: HttpStatus.OK,
        message: "查询成功",
        data: courierFind
      } : {
        code: HttpStatus.NOT_FOUND,
        message: "记录不存在"
      };
  }

  /**
   * 根据 id 删除
   *
   * @param id id
   */
  async deleteOneCourierById(id: string): Promise<ResponseResult> {
    const courierFind = await this.findOneById(id, {
      id: true,
      courier_number: true,
      courier_content: true,
      status: true,
      created_at: true,
      updated_at: true
    });
    if (!courierFind) {
      return {
        code: HttpStatus.NOT_FOUND,
        message: "记录不存在"
      };
    }
    await this.courierRepo.remove(courierFind);
    return {
      code: HttpStatus.OK,
      message: "删除成功"
    };
  }

  /**
   * 查询物流信息
   * @param courier_number 物流单号
   * @param courier_company 物流公司
   */
  public async getCourierInfo(courier_number: string, courier_company: string): Promise<ResponseResult> {
    return new Promise((resolve, reject) => {
      const signer = require(path.resolve(__dirname, "../../static/signer"));
      const sig = new signer.Signer();
      sig.Key = courierConfig().AppKey;
      sig.Secret = courierConfig().AppSecret;
      const r = new signer.HttpRequest("GET", courierConfig().AppUrl);
      r.headers = { "x-stage": "RELEASE" };
      r.query = {
        no: courier_number,
        type: courier_company === "other" ? "" : courier_company
      };
      const opt = sig.Sign(r);
      const req = https.request(opt, function(res) {
        res.on("data", function(chunk) {
          resolve({
            code: HttpStatus.OK,
            message: "查询成功",
            data: JSON.parse(chunk.toString())
          });
        });
      });
      req.on("error", function(err) {
        reject({
          code: HttpStatus.BAD_REQUEST,
          message: err.message
        });
      });
      req.end();
    });

  }

  /**
   * 查询物流公司列表信息
   * @param courier_company 物流公司 模糊查询
   */
  public async getCourierCompanyList(courier_company: string): Promise<ResponseResult> {
    const data: { name: string, type: string }[] = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../../static/CourierCompany.json"), "utf8"));
    const result = data.filter(item => item.name.indexOf(courier_company) > -1);
    //const result: {name: string, type: string}[] = require('../../static/CourierCompany.json')
    return {
      code: HttpStatus.OK,
      message: "查询成功",
      data: result
    };
  }

  /**
   * 根据 id 查询单个信息，如果不存在则抛出404异常
   * @param id id
   * @param select select conditions
   */
  public async findOneById(id: string, select?: FindOptionsSelect<Courier>): Promise<Courier | undefined> {
    return await this.courierRepo.findOne({ where: { id }, select });
  }

  /**
   * 根据物流单号查询单个信息，如果不存在则抛出404异常
   * @param courier_number 物流单号
   * @param select select conditions
   */
  public async findOneByCourierNumber(courier_number: string, select?: FindOptionsSelect<Courier>): Promise<Courier | undefined> {
    return await this.courierRepo.findOne({ where: { courier_number }, select });
  }

  /**
   * 查询所有处方
   * @param select select conditions
   */
  public async findAll(select?: FindOptionsSelect<Courier>): Promise<Courier[] | undefined> {
    return await this.courierRepo.find({
      order: { updated_at: "asc" },
      select
    });
  }

}
