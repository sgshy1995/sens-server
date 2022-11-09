const TRTCConfig = () => {
  const {
    TRTC_APP_ID,
    TRTC_KEY
  } = process.env;
  return {
    AppId: TRTC_APP_ID,
    Key: TRTC_KEY
  };
};
export default TRTCConfig;
