const databaseConfig = () => {
    const {
        DATABASE_HOST,
        DATABASE_PORT,
        DATABASE_TYPE,
        DATABASE_USERNAME,
        DATABASE_PASSWORD,
        DATABASE_NAME
    } = process.env;
    return {
        host: DATABASE_HOST,
        database: DATABASE_NAME,
        port: parseInt(DATABASE_PORT, 10) || 3306,
        type: DATABASE_TYPE,
        username: DATABASE_USERNAME,
        password: DATABASE_PASSWORD
    };
};

export default databaseConfig;
