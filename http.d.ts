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
    next: any;
}
export interface Next {
    (data?: {}): any;
}
export declare class Http {
    server: any;
    _routes: Array<any>;
    private _next;
    private global_middleware;
    constructor();
    private _handler(req, res);
    private execute(f, req, res);
    use(middleware: any): void;
    listen(port: number): void;
    private slashed(path);
    private _route(req);
    private _return(res);
    Controller(path?: string): (target: any) => void;
    Use(...middlewares: any[]): any;
    Route(method: any, path: any): (target: any, name: string, descriptor: TypedPropertyDescriptor<any>) => void;
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
