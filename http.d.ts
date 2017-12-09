/// <reference types="node" />
import { IncomingMessage, ServerResponse } from "http";
import 'reflect-metadata';
export interface Response extends ServerResponse {
    return(status?: any, message?: any): void;
}
export interface Request extends IncomingMessage {
    query: any;
    body: any;
    payload: any;
    params: any;
    parsed: any;
    route: any;
    files: any;
    next: any;
    response: Response;
    request: Request;
}
export interface Return {
    code: number;
    message: any;
}
export interface Next {
    (data?: {}): any;
}
export declare class Http {
    server: any;
    _routes: Array<any>;
    private _next;
    private middleware;
    constructor();
    private get_arguments(params, req);
    private handle_request(req, res);
    private execute(Middleware, req, res);
    private run(middleware, req, res);
    use(middleware: any): void;
    listen(port: number): void;
    private slashed(path);
    private find_route(req);
    private _return(res);
    private inject(fn);
    Controller(path?: string): (target: any) => void;
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
    autoload(source: any): void;
}
export declare const app: Http;
export declare const Get: any;
export declare const Put: any;
export declare const Post: any;
export declare const Patch: any;
export declare const Delete: any;
export declare const Use: any;
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
