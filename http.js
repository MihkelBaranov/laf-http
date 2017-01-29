"use strict";
const http_1 = require("http");
const url_1 = require("url");
class Http {
    constructor() {
        this._middleware = [];
        this._httpMethods = ["POST", "GET", "PUT", "DELETE"];
        this._routes = [];
        this._next = false;
    }
    get handler() {
        return this.request.bind(this);
    }
    next() {
        this._next = true;
    }
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
    use(middleware) {
        this._middleware.push(middleware);
    }
    register(routes) {
        for (let route of routes) {
            this._routes.push(route);
        }
    }
    listen(port) {
        http_1.createServer(this.handler).listen(port);
    }
    _split(path) {
        return path.endsWith("/") ? path.slice(0, -1).split("/") : path.split("/");
    }
    _route(req) {
        return this._routes.find(route => {
            if (req.method === route.method) {
                let route_path = this._split(route.path);
                let requested_path = this._split(req.url);
                let params = route.path.match(/:([a-z]+)/gi);
                if (route_path.length === requested_path.length && route_path[1] === requested_path[1]) {
                    if (params) {
                        for (let param of params) {
                            req.params[param.replace(":", "")] = requested_path[route_path.findIndex(p => p === param)];
                        }
                    }
                    return true;
                }
                return false;
            }
            return false;
        });
    }
    _return(res) {
        return (status = 200, message) => {
            res.writeHead(status, "Content-Type", "application/json");
            res.write(JSON.stringify({ message: message, status: status }));
            return res.end();
        };
    }
}
exports.Http = Http;
