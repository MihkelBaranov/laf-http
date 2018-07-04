/// <reference types="node" />
import { IncomingMessage, Server, ServerResponse } from "http";
import "reflect-metadata";
export interface IResponse extends ServerResponse {
    return(status?: number, message?: Object): void;
}
export interface IParam {
    index?: number;
    name?: string;
    fn: Function;
}
export interface IRoute {
    method: number;
    middleware: Function[];
    name: string;
    params: IParam[];
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
    (data?: object): Function;
}
export declare enum HttpMethodsEnum {
    GET = 0,
    POST = 1,
    PUT = 2,
    DELETE = 3,
    PATCH = 4,
    MIXED = 5
}
export declare enum Constants {
    INVALID_ROUTE = "Invalid route",
    NO_RESPONSE = "No response",
    JSON_RESPONSE = "application/json",
    ROUTE_DATA = "route:data"
}
export declare class Http {
    server: Server;
    routes: any[];
    private next;
    private middleware;
    Controller(path?: string): (target: Function) => void;
    use(middleware: Function): void;
    listen(port: number): void;
    Use(...middlewares: any[]): any;
    Route(method: number, path: string): (target: any, name: string, descriptor: TypedPropertyDescriptor<any>) => void;
    Param(key?: string): (target: Function, name: string, index: number) => void;
    Query(key?: string): (target: Function, name: string, index: number) => void;
    Body(key?: string): (target: Function, name: string, index: number) => void;
    Response(): (target: Function, name: string, index: number) => void;
    Request(): (target: Function, name: string, index: number) => void;
    Get(path: string): (target: any, name: string, descriptor: TypedPropertyDescriptor<any>) => void;
    Post(path: string): (target: any, name: string, descriptor: TypedPropertyDescriptor<any>) => void;
    Put(path: string): (target: any, name: string, descriptor: TypedPropertyDescriptor<any>) => void;
    Patch(path: string): (target: any, name: string, descriptor: TypedPropertyDescriptor<any>) => void;
    Delete(path: string): (target: any, name: string, descriptor: TypedPropertyDescriptor<any>) => void;
    Mixed(path: string): (target: any, name: string, descriptor: TypedPropertyDescriptor<any>) => void;
    autoload(source: string): void;
    private getArguments;
    private handleRequest;
    private execute;
    private run;
    private slashed;
    private findRoute;
    private _return;
    private inject;
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
export declare const Query: any;
export declare const Req: any;
export declare const Res: any;
export declare const Queries: any;
export declare const Params: any;
