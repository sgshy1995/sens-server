const courierConfig = () => {
  const {
    COURIER_SERVICE_APP_KEY,
    COURIER_SERVICE_APP_SECRET,
    COURIER_SERVICE_APP_URL
  } = process.env;
  return {
    AppKey: COURIER_SERVICE_APP_KEY,
    AppSecret: COURIER_SERVICE_APP_SECRET,
    AppUrl: COURIER_SERVICE_APP_URL
  };
};
export default courierConfig;
