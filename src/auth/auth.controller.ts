import {
    Query,
    Controller,
    Get,
    Res, HttpStatus, UseGuards
} from "@nestjs/common";
import {AuthService} from './auth.service';
import {Response} from 'express';
import { TokenGuard } from "../guards/token.guard";
import { AuthGuard } from "@nestjs/passport";

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService
    ) {
    }

    @Get('capture')
    async getCapture(@Query() device_id_info: {device_id: string}, @Res({passthrough: true}) response: Response): Promise<Response | void | Record<string, any>> {
        const res = await this.authService.generateCapture(device_id_info.device_id);
        if (res && typeof res === 'object'){
            // @ts-ignore
            response.status(res.code);
        }else{
            response.status(HttpStatus.OK);
            response.type('svg')
        }
        return res;
    }

    @Get('capture_phone')
    async getCapturePhoneRegister(@Query() device_id_info: {device_id: string, phone: string, capture: string, if_re_send?: boolean}, @Res({passthrough: true}) response: Response): Promise<Response | void | Record<string, any>> {
        console.log('device_id_info', device_id_info)
        const res = await this.authService.generateCapturePhone(device_id_info.device_id, device_id_info.phone, device_id_info.capture, device_id_info.if_re_send);
        response.status(res.code);
        return res;
    }

    @UseGuards(new TokenGuard()) // 使用 token redis 验证
    @UseGuards(AuthGuard('jwt')) // 使用 'JWT' 进行验证
    @Get('new/capture_phone')
    async getCapturePhoneChange(@Query() change_info: {device_id: string, phone: string, username: string}, @Res({passthrough: true}) response: Response): Promise<Response | void | Record<string, any>> {
        console.log('change_info', change_info)
        const res = await this.authService.generateNewCapturePhone(change_info.device_id, change_info.phone, change_info.username);
        response.status(res.code);
        return res;
    }
}