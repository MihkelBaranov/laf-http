/// <reference types="node" />
import { IncomingMessage, ServerResponse } from "http";
/**
 * Response interface
 *
 * @export
 * @interface Response
 * @extends {ServerResponse}
 */
export interface Response extends ServerResponse {
    /**
     *
     *
     * @param {any} [status]
     * @param {any} [message]
     *
     * @memberOf Response
     */
    return(status?: any, message?: any): void;
}
/**
 * Request interface
 *
 * @export
 * @interface Request
 * @extends {IncomingMessage}
 */
export interface Request extends IncomingMessage {
    /**
     * Query object
     *
     * @type {*}
     * @memberOf Request
     */
    query: any;
    /**
     * Parameters object
     *
     * @type {*}
     * @memberOf Request
     */
    params: any;
    /**
     * Parsed url
     *
     * @type {*}
     * @memberOf Request
     */
    parsed: any;
    /**
     * Route object
     *
     * @type {*}
     * @memberOf Request
     */
    route: any;
}
/**
 * LAF-HTTP
 * Simple express like http library for rest api services
 *
 * @export
 * @class Http
 */
export declare class Http {
    /**
     * Store global middleware
     *
     * @private
     * @type {*}
     * @memberOf Http
     */
    private _middleware;
    /**
     * Store registered routes
     *
     * @private
     * @type {Array<any>}
     * @memberOf Http
     */
    private _routes;
    /**
     * Pass through middleware
     *
     * @private
     * @type {boolean}
     * @memberOf Http
     */
    private _next;
    /**
     * Get request handler
     * @readonly
     * @type {*}
     * @memberOf Http
     */
    readonly handler: any;
    /**
     * Pass through middleware
     *
     * @memberOf Http
     */
    next(): void;
    /**
     * Request handler
     *
     * @param {Request} req
     * @param {Response} res
     * @returns
     *
     * @memberOf Http
     */
    request(req: Request, res: Response): void;
    /**
     * Register global middleware
     *
     * @param {any} middleware
     *
     * @memberOf Http
     */
    use(middleware: any): void;
    /**
     * Register routes
     *
     * @param {any} routes
     *
     * @memberOf Http
     */
    register(routes: any): void;
    /**
     * Start server
     *
     * @param {number} port
     *
     * @memberOf Http
     */
    listen(port: number): void;
    /**
     * Remove trailing slash
     *
     * @private
     * @param {any} path
     * @returns {string}
     *
     * @memberOf Http
     */
    private slashed(path);
    /**
     * Find route
     *
     * @private
     * @param {Request} req
     * @returns
     *
     * @memberOf Http
     */
    private _route(req);
    /**
     * Return wrapper for req.return
     *
     * @private
     * @param {Response} res
     * @returns
     *
     * @memberOf Http
     */
    private _return(res);
}
