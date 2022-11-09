import TRTCConfig from "../config/trtc.config";

const TLSSigAPIv2 = require("tls-sig-api-v2");
// var TLSSigAPIv2 = require('./TLSSigAPIv2'); // 源码集成需要使用相对路径


export default function(user_id: string): {sign: string, app_id: string} {
  const TRTCConfigInfo = TRTCConfig();
  console.log('TRTCConfigInfo', TRTCConfigInfo)
  const api = new TLSSigAPIv2.Api(TRTCConfig().AppId, TRTCConfig().Key);
  const genSig = api.genSig(user_id, 7200);
  return {sign: genSig, app_id: TRTCConfigInfo.AppId};
}
