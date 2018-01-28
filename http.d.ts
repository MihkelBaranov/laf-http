/// <reference types="node" />
import { IncomingMessage, Server, ServerResponse } from "http";
import "reflect-metadata";
export interface IResponse extends ServerResponse {
    return(status?: any, message?: any): void;
}
export interface IRoute {
    method: number;
    middleware: void[];
    name: string;
    params: object;
    path: string;
    service: any;
}
export interface IRequest extends IncomingMessage {
    query: any;
    body: any;
    payload: any;
    params: any;
    parsed: any;
    route: IRoute;
    files: any;
    next: any;
    response: IResponse;
    request: IRequest;
}
export interface IReturn {
    code: number;
    message: object | string | Buffer;
    headers?: object;
}
export interface INext {
    (data?: {}): any;
}
export declare enum HttpMethodsEnum {
    GET = 0,
    POST = 1,
    PUT = 2,
    DELETE = 3,
    PATCH = 4,
    MIXED = 5,
}
export declare enum Constants {
    INVALID_ROUTE = "Invalid route",
    NO_RESPONSE = "No response",
    JSON_RESPONSE = "application/json",
}
export declare class Http {
    server: Server;
    routes: any[];
    private next;
    private middleware;
    Controller(path?: string): (target: any) => void;
    use(middleware: any): void;
    listen(port: number): void;
    Use(...middlewares: any[]): any;
    Route(method: any, path: any): (target: any, name: string, descriptor: TypedPropertyDescriptor<any>) => void;
    Param(key?: any): (target: any, name: string, index: number) => void;
    Query(key?: any): (target: any, name: string, index: number) => void;
    Body(): (target: any, name: string, index: number) => void;
    Response(): (target: any, name: string, index: number) => void;
    Request(): (target: any, name: string, index: number) => void;
    Queries(): (target: any, name: string, index: number) => void;
    Params(): (target: any, name: string, index: number) => void;
    Get(path: any): (target: any, name: string, descriptor: TypedPropertyDescriptor<any>) => void;
    Post(path: any): (target: any, name: string, descriptor: TypedPropertyDescriptor<any>) => void;
    Put(path: any): (target: any, name: string, descriptor: TypedPropertyDescriptor<any>) => void;
    Patch(path: any): (target: any, name: string, descriptor: TypedPropertyDescriptor<any>) => void;
    Delete(path: any): (target: any, name: string, descriptor: TypedPropertyDescriptor<any>) => void;
    Mixed(path: any): (target: any, name: string, descriptor: TypedPropertyDescriptor<any>) => void;
    autoload(source: any): void;
    private get_arguments(params, req);
    private handle_request(req, res);
    private execute(Middleware, req, res);
    private run(middleware, req, res);
    private slashed(path);
    private find_route(req);
    private _return(res);
    private inject(fn);
}
export declare const app: Http;
export declare const Get: any;
export declare const Put: any;
export declare const Post: any;
export declare const Patch: any;
export declare const Delete: any;
export declare const Use: any;
export declare const Mixed: any;
export declare const Route: any;
export declare const Controller: any;
export declare const Autoload: any;
export declare const Body: any;
export declare const Param: any;
export declare const Params: any;
export declare const Query: any;
export declare const Queries: any;
export declare const Req: any;
export declare const Res: any;
