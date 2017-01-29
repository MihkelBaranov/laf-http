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
     * Get request handler
     * @readonly
     * @type {*}
     * @memberOf Http
     */
    get handler(): any {
        return this.request.bind(this);
    }

    /**
     * Pass through middleware
     * 
     * @memberOf Http
     */
    public next() {
        this._next = true;
    }

    /**
     * Request handler
     * 
     * @param {Request} req
     * @param {Response} res
     * @returns
     * 
     * @memberOf Http
     */
    public request(req: Request, res: Response) {
        req.params = {};
        req.parsed = parse(req.url, true);
        req.query = req.parsed.query;
        req.route = this._route(req);
        res.return = this._return(res);
        this._next = true;

        for (let middleware of this._middleware) {
            if (this._next) {
                this._next = false;
                middleware(req, res, this.next.bind(this));
            } else {
                return;
            }
        }

        if (req.route) {
            if (req.route.middleware && this._next) {
                this._next = false;
                req.route.middleware(req, res, this.next.bind(this));
            }

            if (!this._next) {
                return;
            }

            req.route.service(req, res);
            res.end();
        } else {
            res.return(500, "Invalid Route");
        }

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
        createServer(this.handler).listen(port);
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
    private _route(req: Request) {
        return this._routes.find(route => {
            let regex = new RegExp(this.slashed(route.path).replace(/:[^\s/]+/g, "([\\w-]+)"));

            let matches = this.slashed(req.url).match(regex);

            if (matches && matches[0] === matches["input"]) {
                let params = route.path.match(/:([a-z]+)/gi).map(e => e.replace(":", ""));
                for (let k in params) {
                    req.params[params[k]] = matches[parseInt(k) + 1];
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
    private _return(res: Response) {
        return (status = 200, message) => {
            switch (typeof message) {
                case "object":
                    res.writeHead(status, "Content-Type", "application/json");
                    res.write(JSON.stringify(message));
                    break;
                default:
                    res.writeHead(status, "Content-Type", "text/plain");
                    res.write(message);
            }
            return res.end();
        };
    }
}