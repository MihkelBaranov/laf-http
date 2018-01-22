"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("http");
const url_1 = require("url");
require("reflect-metadata");
const fs = require("fs");
class Http {
    constructor() {
        this._routes = [];
        this._next = false;
        this.middleware = [];
    }
    get_arguments(params, req) {
        let args = [req];
        if (params) {
            args = [];
            params.sort((a, b) => a.index - b.index);
            for (const param of params) {
                let result;
                if (param !== undefined) {
                    result = param.fn(req);
                }
                args.push(result);
            }
        }
        return args;
    }
    handle_request(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            req.params = {};
            req.parsed = url_1.parse(req.url, true);
            req.query = req.parsed.query;
            req.response = res;
            req.request = req;
            res.return = this._return(res);
            this._next = true;
            if (this.middleware.length > 0) {
                yield this.run(this.middleware, req, res);
            }
            req.route = this.find_route(req);
            if (req.route) {
                if (req.route.middleware && this._next) {
                    yield this.run(req.route.middleware, req, res);
                }
                if (!this._next) {
                    return;
                }
                const args = this.get_arguments(req.route.params, req);
                const result = yield req.route.service(...args);
                if (result) {
                    res.return(result.code, result);
                }
                else {
                    if (!res.finished) {
                        res.return(400, {
                            code: 400,
                            message: {
                                error: "No Response"
                            }
                        });
                    }
                }
            }
            else {
                res.return(404, {
                    code: 404,
                    message: {
                        error: "Invalid Route"
                    }
                });
            }
        });
    }
    execute(Middleware, req, res) {
        return new Promise((resolve, reject) => {
            Middleware(req, res, (data) => {
                this._next = true;
                req.next = data || {};
                return resolve("Next called");
            });
        });
    }
    run(middleware, req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield Promise.all(middleware.map((middleware) => __awaiter(this, void 0, void 0, function* () {
                this._next = false;
                if (middleware instanceof Function) {
                    return yield this.execute(middleware, req, res);
                }
            })));
        });
    }
    use(middleware) {
        this.middleware.push(middleware);
    }
    listen(port) {
        this.server = http_1.createServer(this.handle_request.bind(this)).listen(port);
    }
    slashed(path) {
        return path.endsWith("/") ? path.slice(0, -1) : path;
    }
    find_route(req) {
        return this._routes.find(route => {
            let path = this.slashed(route.path);
            let regex = new RegExp(path.replace(/:[^\s/]+/g, "([^/\]+)"));
            let matches = this.slashed(req.url.split("?")[0]).match(regex);
            let params = path.match(/:[^\s/]+/g);
            if (matches && matches[0] === matches["input"] && (route.method === req.method || route.method === "MIXED")) {
                for (let k in params) {
                    req.params[params[k].slice(1)] = decodeURI(matches[parseInt(k) + 1]);
                }
                return route;
            }
        });
    }
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
    inject(fn) {
        return (target, name, index) => {
            const meta = Reflect.getMetadata(`route:params_${name}`, target) || [];
            meta.push({ index, name, fn });
            Reflect.defineMetadata(`route:params_${name}`, meta, target);
        };
    }
    Controller(path = '') {
        return (target) => {
            const controller_middleware = Reflect.getMetadata("route:middleware", target) || [];
            const routes = Reflect.getMetadata("route:data", target.prototype) || [];
            for (const route of routes) {
                const route_middleware = Reflect.getMetadata(`route:middleware_${route.name}`, target.prototype) || [];
                const params = Reflect.getMetadata(`route:params_${route.name}`, target.prototype) || [];
                this._routes.push({
                    method: route.method,
                    path: path + route.path,
                    middleware: [...controller_middleware, ...route_middleware],
                    service: route.descriptor.value,
                    name: route.name,
                    params
                });
            }
            Reflect.defineMetadata("route:data", this._routes, target);
        };
    }
    Use(...middlewares) {
        return (target, propertyKey, descriptor) => {
            Reflect.defineMetadata(`route:middleware${propertyKey ? "_" + propertyKey : ""}`, middlewares, target);
        };
    }
    Route(method, path) {
        return (target, name, descriptor) => {
            const meta = Reflect.getMetadata("route:data", target) || [];
            meta.push({ method, path, name, descriptor });
            Reflect.defineMetadata("route:data", meta, target);
        };
    }
    Param(key) {
        return this.inject(req => !key ? req.params : req.params[key]);
    }
    Query(key) {
        return this.inject(req => !key ? req.query : req.query[key]);
    }
    Body() {
        return this.inject(req => req.body);
    }
    Response() {
        return this.inject(req => req.response);
    }
    Request() {
        return this.inject(req => req.request);
    }
    Queries() {
        return this.Query();
    }
    Params() {
        return this.Param();
    }
    Get(path) {
        return this.Route("GET", path);
    }
    Post(path) {
        return this.Route("POST", path);
    }
    Put(path) {
        return this.Route("PUT", path);
    }
    Patch(path) {
        return this.Route("PATCH", path);
    }
    Delete(path) {
        return this.Route("DELETE", path);
    }
    Mixed(path) {
        return this.Route("MIXED", path);
    }
    autoload(source) {
        fs.readdirSync(source).map(file => {
            if (file.endsWith(".js")) {
                require(source + "/" + file.replace(/\.[^.$]+$/, ""));
            }
        });
    }
}
exports.Http = Http;
exports.app = new Http();
exports.Get = exports.app.Get.bind(exports.app);
exports.Put = exports.app.Put.bind(exports.app);
exports.Post = exports.app.Post.bind(exports.app);
exports.Patch = exports.app.Patch.bind(exports.app);
exports.Delete = exports.app.Delete.bind(exports.app);
exports.Use = exports.app.Use.bind(exports.app);
exports.Mixed = exports.app.Mixed.bind(exports.app);
exports.Route = exports.app.Route.bind(exports.app);
exports.Controller = exports.app.Controller.bind(exports.app);
exports.Autoload = exports.app.autoload.bind(exports.app);
// New stuff
exports.Body = exports.app.Body.bind(exports.app);
exports.Param = exports.app.Param.bind(exports.app);
exports.Params = exports.app.Params.bind(exports.app);
exports.Query = exports.app.Query.bind(exports.app);
exports.Queries = exports.app.Queries.bind(exports.app);
exports.Req = exports.app.Request.bind(exports.app);
exports.Res = exports.app.Response.bind(exports.app);
