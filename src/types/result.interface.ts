// 定义通用的API接口返回数据类型
export interface ResponseResult {
    code: number;
    message: string;
    data?: any;
}

// 定义分页查询通用的参数类型
export interface PaginationQuery {
    pageNo: number
    pageSize: number
}

// 定义分页查询通用的API接口返回数据类型
export interface ResponsePaginationResult {
    code: number;
    message: string;
    data: {
        pageSize: number,
        pageNo: number,
        totalCount: number,
        totalPage: number,
        data: any[]
    };
}
