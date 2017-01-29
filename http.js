"use strict";
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
        return this.request.bind(this);
    }
    /**
     * Pass through middleware
     *
     * @memberOf Http
     */
    next() {
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
    request(req, res) {
        req.params = {};
        req.parsed = url_1.parse(req.url, true);
        req.query = req.parsed.query;
        req.route = this._route(req);
        res.return = this._return(res);
        this._next = true;
        for (let middleware of this._middleware) {
            if (this._next) {
                this._next = false;
                middleware(req, res, this.next.bind(this));
            }
            else {
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
        }
        else {
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
        http_1.createServer(this.handler).listen(port);
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
    _return(res) {
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
exports.Http = Http;
