import {HttpStatus, Injectable} from '@nestjs/common';
import {UserService} from '../app/user/user.service';
import {JwtService} from '@nestjs/jwt';
import {User} from '../db/entities/User';
import {ResponseResult} from '../types/result.interface';
import {RedisInstance} from '../db/redis/redis';
import RedisConfig from '../config/redis.config';
import * as svgCaptcha from 'svg-captcha';

@Injectable()
export class AuthService {
    constructor(private readonly usersService: UserService, private readonly jwtService: JwtService) {
    }

    // 生成 capture 并记录到redis中
    async generateCapture(device_id: string): Promise<String | ResponseResult> {
        // 实例化 redis
        if (!device_id){
            return {
                code: HttpStatus.BAD_REQUEST,
                message: '参数错误'
            }
        }
        const redis = await RedisInstance.initRedis('auth.capture', 0);
        const captcha = svgCaptcha.create({
            size: 4,
            ignoreChars: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
            color: false,
            fontSize: 60,
            noise: 2
        });
        await redis.setex(device_id, 300, captcha.text);
        return `data:image/svg+xml;base64,${Buffer.from(captcha.data).toString('base64')}`;
    }

    // capture 验证
    async validateCapture(device_id: string, capture: string): Promise<ResponseResult | undefined> {
        // 实例化 redis
        const redis = await RedisInstance.initRedis('auth.capture', 0);
        const cache = await redis.get(device_id);
        if (!device_id || !capture){
            return {
                code: HttpStatus.BAD_REQUEST,
                message: '参数错误'
            };
        }else if (!cache) {
            return {
                code: HttpStatus.NOT_FOUND,
                message: '验证码不存在'
            };
        } else if (cache.toLowerCase() !== capture.toLowerCase()) {
            return {
                code: HttpStatus.BAD_REQUEST,
                message: '验证码错误'
            };
        } else {
            return undefined;
        }
    }

    // 生成 phone 并记录到redis中
    async generateCapturePhone(device_id: string, phone: string, capture: string, if_re_send: boolean): Promise<ResponseResult> {
        const responseBody = {
            code: HttpStatus.CREATED,
            message: '已发送'
        }
        // 实例化 redis
        if (!device_id || !phone || !capture){
            return {
                code: HttpStatus.BAD_REQUEST,
                message: '参数错误'
            }
        }
        // 验证普通验证码
        if (!if_re_send){
            const validateCaptureResult = await this.validateCapture(device_id, capture)
            if (validateCaptureResult) return validateCaptureResult
        }


        const redis = await RedisInstance.initRedis('auth.capture.phone', 0);
        const cache = await redis.get(`phone~${device_id}~${phone}`);
        if (cache) {
            return {
                code: HttpStatus.CONFLICT,
                message: '验证码仍在有效期'
            };
        }
        const captcha = svgCaptcha.create({
            size: 6,
            ignoreChars: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
            color: false,
            fontSize: 60,
            noise: 2
        });
        let errMsg = ''
        function sendPhoneCapture(code: string) {
            return new Promise((resolve, reject) => {
                setTimeout(()=>{
                    resolve(code)
                },1000)
            })
        }
        try {
            await sendPhoneCapture(captcha.text)
        }catch (e) {
            errMsg = e
        }
        if (!errMsg){
            await redis.setex(`phone~${device_id}~${phone}`, 300, captcha.text);
            await redis.setex(`phone~simulation~${phone}`, 300, captcha.text);
        }else{
            responseBody.code = HttpStatus.BAD_REQUEST
            responseBody.message = '短信服务器错误'
        }
        return responseBody;
    }

    // 用于修改手机号，生成 phone 并记录到redis中
    async generateNewCapturePhone(device_id: string, phone: string, username: string): Promise<ResponseResult> {
        const responseBody = {
            code: HttpStatus.CREATED,
            message: '已发送'
        }
        // 实例化 redis
        if (!device_id || !phone || !username){
            return {
                code: HttpStatus.BAD_REQUEST,
                message: '参数错误'
            }
        }

        // 验证该手机号是否已被注册
        const userFind = await this.usersService.findOneByAny({phone: phone})
        if (userFind) {
            return {
                code: HttpStatus.BAD_REQUEST,
                message: '该手机号已注册'
            }
        }

        // redis操作
        const redis = await RedisInstance.initRedis('auth.capture.phone', 0);
        const cache = await redis.get(`phone~${username}~${device_id}~${phone}`);
        if (cache) {
            return {
                code: HttpStatus.CONFLICT,
                message: '验证码仍在有效期'
            };
        }
        const captcha = svgCaptcha.create({
            size: 6,
            ignoreChars: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
            color: false,
            fontSize: 60,
            noise: 2
        });
        let errMsg = ''
        function sendPhoneCapture(code: string) {
            return new Promise((resolve, reject) => {
                setTimeout(()=>{
                    resolve(code)
                },1000)
            })
        }
        try {
            await sendPhoneCapture(captcha.text)
        }catch (e) {
            errMsg = e
        }
        if (!errMsg){
            await redis.setex(`phone~${username}~${device_id}~${phone}`, 300, captcha.text);
        }else{
            responseBody.code = HttpStatus.BAD_REQUEST
            responseBody.message = '短信服务器错误'
        }
        return responseBody;
    }

    // capture_phone 验证
    async validateCapturePhone(device_id: string, phone: string, capture_phone: string): Promise<ResponseResult | undefined> {
        console.log('device_id', device_id)
        console.log('phone', phone)
        console.log('capture_phone', capture_phone)
        // 实例化 redis
        const redis = await RedisInstance.initRedis('auth.capture.phone', 0);
        const cache = await redis.get(`phone~${device_id}~${phone}`);
        console.log('cache', cache)
        if (!device_id || !phone || !capture_phone){
            return {
                code: HttpStatus.BAD_REQUEST,
                message: '短信参数错误'
            };
        }else if (!cache) {
            return {
                code: HttpStatus.NOT_FOUND,
                message: '短信验证码无效'
            };
        } else if (cache.toLowerCase() !== capture_phone.toLowerCase()) {
            return {
                code: HttpStatus.BAD_REQUEST,
                message: '短信验证码错误'
            };
        } else {
            await redis.del(`phone~${device_id}~${phone}`);
            return undefined;
        }
    }

    // 修改手机号的 capture_phone 验证
    async validateNewCapturePhone(device_id: string, phone: string, username: string, capture_phone: string): Promise<ResponseResult | undefined> {
        console.log('device_id', device_id)
        console.log('phone', phone)
        console.log('username', username)
        console.log('capture_phone', capture_phone)
        console.log(`phone~${username}~${device_id}~${phone}`)
        // 实例化 redis
        const redis = await RedisInstance.initRedis('auth.capture.phone', 0);
        const cache = await redis.get(`phone~${username}~${device_id}~${phone}`);
        console.log('cache', cache)
        if (!device_id || !phone || !username || !capture_phone){
            return {
                code: HttpStatus.BAD_REQUEST,
                message: '短信参数错误'
            };
        }else if (!cache) {
            return {
                code: HttpStatus.NOT_FOUND,
                message: '短信验证码无效'
            };
        } else if (cache.toLowerCase() !== capture_phone.toLowerCase()) {
            return {
                code: HttpStatus.BAD_REQUEST,
                message: '短信验证码错误'
            };
        } else {
            await redis.del(`phone~${username}~${device_id}~${phone}`);
            return undefined;
        }
    }

    // capture_phone 模拟验证
    async validateSimulationCapturePhone(phone: string): Promise<ResponseResult | undefined> {
        console.log('phone', phone)
        // 实例化 redis
        const redis = await RedisInstance.initRedis('auth.capture.phone', 0);
        const cache = await redis.get(`phone~simulation~${phone}`);
        console.log('cache', cache)
        if (!phone){
            return {
                code: HttpStatus.BAD_REQUEST,
                message: '短信参数错误'
            };
        }else if (!cache) {
            return {
                code: HttpStatus.NOT_FOUND,
                message: '短信验证码不存在'
            };
        } else {
            return {
                code: HttpStatus.OK,
                message: '查询成功',
                data: cache
            };
        }
    }

    // JWT验证 - Step 2: 校验用户信息-手机号
    async validateUserByPhone(phone: string): Promise<{ code: number, user: User | null }> {
        let user = await this.usersService.findOneByPhone(phone);
        console.log('JWT验证 - Step 2: 校验用户信息 -- 手机号登录', user);
        if (!user) {
            user = new User()
            user.phone = phone
            await this.usersService.createUser(user);
            user = await this.usersService.findOneByPhone(phone);
        }
        return {
            code: 1,
            user
        };
    }

    // JWT验证 - Step 3: 处理 jwt 签证
    async certificate(user: User): Promise<ResponseResult> {
        const payload = {username: user.username, sub: user.id, name: user.name, phone: user.phone};
        console.log('JWT验证 - Step 3: 处理 jwt 签证');
        console.log('payload', payload);
        try {
            const token = this.jwtService.sign(payload);
            // 实例化 redis
            const redis = await RedisInstance.initRedis('auth.certificate', 0);
            // 将用户信息和 token 存入 redis，并设置失效时间，语法：[key, seconds, value]
            await redis.setex(`TOKEN-${user.username}`, 2592000, `${token}`);
            return {
                code: HttpStatus.OK,
                data: {
                    token,
                },
                message: `登录成功`,
            };
        } catch (error) {
            console.log('error', error);
            return {
                code: HttpStatus.BAD_REQUEST,
                message: '账号或密码错误',
            };
        }
    }

    // JWT 注销签证
    async dropJwt(user: User): Promise<ResponseResult> {
        const redis = await RedisInstance.initRedis('TokenGuard.canActivate', RedisConfig().db);
        const key = `TOKEN-${user.username}`;
        const cache = await redis.get(key);
        if (cache) {
            await redis.del(key);
        }
        return {
            code: HttpStatus.OK,
            message: `注销成功`
        };
    }
}
