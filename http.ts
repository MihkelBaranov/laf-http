import { IncomingMessage, ServerResponse, Server, createServer } from "http";
import { parse } from "url";
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
    return(status?, message?): void;
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
     * Body object
     * 
     * @type {*}
     * @memberOf Request
     */
    body: any;

    /**
     * Payload object
     * 
     * @type {*}
     * @memberOf Request
     */
    payload: any;

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

export interface Next {
    (error?: string): void;
}

/**
 * LAF-HTTP
 * Simple express like http library for rest api services
 * 
 * @export
 * @class Http
 */
export class Http {
    /**
     * Store global middleware
     * 
     * @private
     * @type {*}
     * @memberOf Http
     */
    private _middleware: any = [];
    /**
     * Store registered routes
     * 
     * @private
     * @type {Array<any>}
     * @memberOf Http
     */
    private _routes: Array<any> = [];
    /**
     * Pass through middleware
     * 
     * @private
     * @type {boolean}
     * @memberOf Http
     */
    private _next: boolean = false;

    /**
    * Server instance
    * 
    * @public
    * @type {any}
    * @memberOf Http
    */
    public server: any;
    /**
     * Get request handler
     * @readonly
     * @type {*}
     * @memberOf Http
     */

    get handler(): any {
        return this._handler.bind(this);
    }


    /**
     * Handler
     * 
     * @param {Request} req
     * @param {Response} res
     * @returns
     * 
     * @memberOf Http
     */
    public async _handler(req: Request, res: Response) {

        if (req.url === "/favicon.ico") {
            return;
        }

        req.params = {};
        req.parsed = parse(req.url, true);
        req.query = req.parsed.query;

        res.return = this._return(res);
        this._next = true;
        if (this._middleware.length > 0) {
            /**
             * Execute middleware functions
             * 
             * @param {any} f
             * @returns
             */
            let middleware = await Promise.all(this._middleware.map(async f => {
                this._next = false;
                if ((typeof (f) === "function")) {
                    return await this.execute(f, req, res);
                }
            }));
        }

        if (!this._next) {
            return;
        }

        // Find route
        req.route = this._route(req);

        if (req.route) {
            if (req.route.middleware && this._next) {
                this._next = false;
                if (typeof (req.route.middleware) === "function") {
                    await req.route.middleware(req, res, async () => {
                        this._next = true;
                    });
                }
            }

            if (!this._next) {
                return;
            }

            req.route.service(req, res);
        } else {
            res.return(500, "Invalid Route");
        }
    }

    /**
     * 
     * 
     * @private
     * @param {any} f
     * @param {Request} req
     * @param {Response} res
     * @returns {Promise<string>}
     * 
     * @memberOf Http
     */
    private execute(f, req: Request, res: Response): Promise<string> {
        return new Promise((resolve, reject) => {
            f(req, res, () => {
                this._next = true;
                return resolve("Next called");
            });
        })
    }

    /**
     * Register global middleware
     * 
     * @param {any} middleware
     * 
     * @memberOf Http
     */
    public use(middleware) {
        this._middleware.push(middleware);
    }

    /**
     * Register routes
     * 
     * @param {any} routes
     * 
     * @memberOf Http
     */
    public register(routes) {
        for (let route of routes) {
            this._routes.push(route);
        }
    }

    /**
     * Start server
     * 
     * @param {number} port
     * 
     * @memberOf Http
     */
    public listen(port: number) {
        this.server = createServer(this.handler).listen(port);
    }

    /**
     * Remove trailing slash
     * 
     * @private
     * @param {any} path
     * @returns {string}
     * 
     * @memberOf Http
     */
    private slashed(path): string {
        return path.endsWith("/") ? path.slice(0, -1) : path;
    }


    /**
     * Find route
     * 
     * @private
     * @param {Request} req
     * @returns
     * 
     * @memberOf Http
     */
    private _route(req: Request): Object {
        return this._routes.find(route => {
            let path = this.slashed(route.path);
            let regex = new RegExp(path.replace(/:[^\s/]+/g, "([^/\]+)"));
            let matches = this.slashed(req.url.split("?")[0]).match(regex);
            let params = path.match(/:[^\s/]+/g);
            console.log(params);

            if (matches && matches[0] === matches["input"] && route.method === req.method) {
                for (let k in params) {
                    req.params[params[k].slice(1)] = decodeURI(matches[parseInt(k) + 1]);
                }

                return route;
            }
        });
    }

    /**
     * Return wrapper for req.return
     * 
     * @private
     * @param {Response} res
     * @returns
     * 
     * @memberOf Http
     */
    private _return(res: Response): any {
        return (status = 200, message) => {
            switch (typeof message) {
                case "object":
                    res.writeHead(status, { "Content-Type": "application/json" });
                    res.write(JSON.stringify(message));
                    break;
                default:
                    res.writeHead(status, { "Content-Type": "text/plain" });
                    res.write(message);
            }
            return res.end();
        };
    }
}