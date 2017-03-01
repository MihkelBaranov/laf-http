"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const http_1 = require("http");
const url_1 = require("url");
/**
 * LAF-HTTP
 * Simple express like http library for rest api services
 *
 * @export
 * @class Http
 */
class Http {
    constructor() {
        /**
         * Store global middleware
         *
         * @private
         * @type {*}
         * @memberOf Http
         */
        this._middleware = [];
        /**
         * Store registered routes
         *
         * @private
         * @type {Array<any>}
         * @memberOf Http
         */
        this._routes = [];
        /**
         * Pass through middleware
         *
         * @private
         * @type {boolean}
         * @memberOf Http
         */
        this._next = false;
    }
    /**
     * Get request handler
     * @readonly
     * @type {*}
     * @memberOf Http
     */
    get handler() {
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
    _handler(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (req.url === "/favicon.ico") {
                return;
            }
            req.params = {};
            req.parsed = url_1.parse(req.url, true);
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
                let middleware = yield Promise.all(this._middleware.map((f) => __awaiter(this, void 0, void 0, function* () {
                    this._next = false;
                    if ((typeof (f) === "function")) {
                        return yield this.execute(f, req, res);
                    }
                })));
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
                        yield req.route.middleware(req, res, () => __awaiter(this, void 0, void 0, function* () {
                            this._next = true;
                        }));
                    }
                }
                if (!this._next) {
                    return;
                }
                req.route.service(req, res);
            }
            else {
                res.return(500, "Invalid Route");
            }
        });
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
    execute(f, req, res) {
        return new Promise((resolve, reject) => {
            f(req, res, () => {
                this._next = true;
                return resolve("Next called");
            });
        });
    }
    /**
     * Register global middleware
     *
     * @param {any} middleware
     *
     * @memberOf Http
     */
    use(middleware) {
        this._middleware.push(middleware);
    }
    /**
     * Register routes
     *
     * @param {any} routes
     *
     * @memberOf Http
     */
    register(routes) {
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
    listen(port) {
        this.server = http_1.createServer(this.handler).listen(port);
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
    slashed(path) {
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
    _route(req) {
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
    _return(res) {
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
exports.Http = Http;
