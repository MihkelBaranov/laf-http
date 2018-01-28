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
const fs = require("fs");
const http_1 = require("http");
require("reflect-metadata");
const url_1 = require("url");
var HttpMethodsEnum;
(function (HttpMethodsEnum) {
    HttpMethodsEnum[HttpMethodsEnum["GET"] = 0] = "GET";
    HttpMethodsEnum[HttpMethodsEnum["POST"] = 1] = "POST";
    HttpMethodsEnum[HttpMethodsEnum["PUT"] = 2] = "PUT";
    HttpMethodsEnum[HttpMethodsEnum["DELETE"] = 3] = "DELETE";
    HttpMethodsEnum[HttpMethodsEnum["PATCH"] = 4] = "PATCH";
    HttpMethodsEnum[HttpMethodsEnum["MIXED"] = 5] = "MIXED";
})(HttpMethodsEnum = exports.HttpMethodsEnum || (exports.HttpMethodsEnum = {}));
var Constants;
(function (Constants) {
    Constants["INVALID_ROUTE"] = "Invalid route";
    Constants["NO_RESPONSE"] = "No response";
    Constants["JSON_RESPONSE"] = "application/json";
})(Constants = exports.Constants || (exports.Constants = {}));
class Http {
    constructor() {
        this.routes = [];
        this.next = false;
        this.middleware = [];
    }
    Controller(path = "") {
        return (target) => {
            const controllerMiddleware = Reflect.getMetadata("route:middleware", target) || [];
            const routes = Reflect.getMetadata("route:data", target.prototype) || [];
            for (const route of routes) {
                const routeMiddleware = Reflect.getMetadata(`route:middleware_${route.name}`, target.prototype) || [];
                const params = Reflect.getMetadata(`route:params_${route.name}`, target.prototype) || [];
                this.routes.push({
                    method: route.method,
                    middleware: [...controllerMiddleware, ...routeMiddleware],
                    name: route.name,
                    params,
                    path: path + route.path,
                    service: route.descriptor.value,
                });
            }
            Reflect.defineMetadata("route:data", this.routes, target);
        };
    }
    use(middleware) {
        this.middleware.push(middleware);
    }
    listen(port) {
        this.server = http_1.createServer(this.handle_request.bind(this)).listen(port);
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
        return this.inject((req) => !key ? req.params : req.params[key]);
    }
    Query(key) {
        return this.inject((req) => !key ? req.query : req.query[key]);
    }
    Body() {
        return this.inject((req) => req.body);
    }
    Response() {
        return this.inject((req) => req.response);
    }
    Request() {
        return this.inject((req) => req.request);
    }
    Queries() {
        return this.Query();
    }
    Params() {
        return this.Param();
    }
    Get(path) {
        return this.Route(HttpMethodsEnum.GET, path);
    }
    Post(path) {
        return this.Route(HttpMethodsEnum.POST, path);
    }
    Put(path) {
        return this.Route(HttpMethodsEnum.PUT, path);
    }
    Patch(path) {
        return this.Route(HttpMethodsEnum.PATCH, path);
    }
    Delete(path) {
        return this.Route(HttpMethodsEnum.DELETE, path);
    }
    Mixed(path) {
        return this.Route(HttpMethodsEnum.MIXED, path);
    }
    autoload(source) {
        fs.readdirSync(source).map((file) => {
            if (file.endsWith(".js")) {
                require(source + "/" + file.replace(/\.[^.$]+$/, ""));
            }
        });
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
            try {
                // Init request object
                req.params = {};
                req.parsed = url_1.parse(req.url, true);
                req.query = req.parsed.query;
                req.response = res;
                req.request = req;
                res.return = this._return(res);
                this.next = true;
                if (this.middleware.length > 0) {
                    yield this.run(this.middleware, req, res);
                }
                req.route = this.find_route(req);
                if (!req.route) {
                    throw Constants.INVALID_ROUTE;
                }
                if (req.route.middleware && this.next) {
                    yield this.run(req.route.middleware, req, res);
                }
                if (!this.next) {
                    return;
                }
                const args = this.get_arguments(req.route.params, req);
                const result = yield req.route.service(...args);
                if (result) {
                    res.return(result.code, result);
                }
                else {
                    if (!res.finished) {
                        throw Constants.NO_RESPONSE;
                    }
                }
            }
            catch (e) {
                this._return(res)(404, {
                    code: 404,
                    message: {
                        error: e,
                    },
                });
            }
        });
    }
    execute(Middleware, req, res) {
        return new Promise((resolve, reject) => {
            Middleware(req, res, (data) => {
                this.next = true;
                req.next = data || {};
                return resolve();
            });
        });
    }
    run(middleware, req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield Promise.all(middleware.map((fn) => __awaiter(this, void 0, void 0, function* () {
                this.next = false;
                if (fn instanceof Function) {
                    return yield this.execute(fn, req, res);
                }
            })));
        });
    }
    slashed(path) {
        return path.endsWith("/") ? path.slice(0, -1) : path;
    }
    find_route(req) {
        return this.routes.find((route) => {
            const path = this.slashed(route.path);
            const regex = new RegExp(path.replace(/:[^\s/]+/g, "([^/\]+)"));
            const matches = this.slashed(req.url.split("?")[0]).match(regex);
            const params = path.match(/:[^\s/]+/g);
            if (matches && matches[0] === matches.input
                && (route.method === HttpMethodsEnum[req.method]
                    || route.method === HttpMethodsEnum.MIXED)) {
                for (const k in params) {
                    if (params[k]) {
                        req.params[params[k].slice(1)] = decodeURI(matches[parseInt(k, 0) + 1]);
                    }
                }
                return route;
            }
        });
    }
    _return(res) {
        return (status, response) => {
            let headers = {
                "Content-Type": Constants.JSON_RESPONSE,
            };
            if (response.headers) {
                headers = Object.assign(headers, response.headers);
            }
            const body = headers["Content-Type"] === Constants.JSON_RESPONSE ? JSON.stringify(response) : response.message;
            res.writeHead(status, headers);
            res.write(body);
            res.end();
        };
    }
    inject(fn) {
        return (target, name, index) => {
            const meta = Reflect.getMetadata(`route:params_${name}`, target) || [];
            meta.push({ index, name, fn });
            Reflect.defineMetadata(`route:params_${name}`, meta, target);
        };
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
exports.Body = exports.app.Body.bind(exports.app);
exports.Param = exports.app.Param.bind(exports.app);
exports.Params = exports.app.Params.bind(exports.app);
exports.Query = exports.app.Query.bind(exports.app);
exports.Queries = exports.app.Queries.bind(exports.app);
exports.Req = exports.app.Request.bind(exports.app);
exports.Res = exports.app.Response.bind(exports.app);
