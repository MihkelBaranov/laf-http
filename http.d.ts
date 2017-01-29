/// <reference types="node" />
import { IncomingMessage, ServerResponse } from "http";
export interface Response extends ServerResponse {
    return(status?: any, message?: any): void;
}
export interface Request extends IncomingMessage {
    query: any;
    params: any;
    parsed: any;
    route: any;
}
export declare class Http {
    private _middleware;
    private _httpMethods;
    private _routes;
    private _next;
    readonly handler: any;
    next(): void;
    request(req: Request, res: Response): void;
    use(middleware: any): void;
    register(routes: any): void;
    listen(port: number): void;
    private _split(path);
    private _route(req);
    private _return(res);
}
