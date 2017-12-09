import { IncomingMessage, ServerResponse, Server, createServer } from "http";
import { parse } from "url";
import 'reflect-metadata';
import * as fs from "fs";

export interface Response extends ServerResponse {
    return(status?, message?): void;
}

export interface Request extends IncomingMessage {
    query: any;
    body: any;
    payload: any;
    params: any;
    parsed: any;
    route: any;
    files: any;
    next: any;
    response: Response;
    request: Request
}

export interface Return {
    code: number;
    message: any;
}

export interface Next {
    (data?: {}): any;
}

export class Http {
    public server: any;

    public _routes: Array<any> = [];
    private _next: boolean = false;
    private middleware: Array<Function> = [];

    constructor() { }

    private get_arguments(params, req) {
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

    private async handle_request(req: Request, res: Response) {
        req.params = {};
        req.parsed = parse(req.url, true);
        req.query = req.parsed.query;

        req.response = res;
        req.request = req;

        res.return = this._return(res);
        this._next = true;
        if (this.middleware.length > 0) {
            await this.run(this.middleware, req, res);
        }


        req.route = this.find_route(req);

        if (req.route) {

            if (req.route.middleware && this._next) {
                await this.run(req.route.middleware, req, res);
            }

            if (!this._next) {
                return;
            }

            const args = this.get_arguments(req.route.params, req);

            const result = await req.route.service(...args);

            if (result) {
                res.return(result.code, result);
            } else {
                if (!res.finished) {
                    res.return(400, {
                        code: 400,
                        message: {
                            error: "No Response"
                        }
                    });
                }
            }
        } else {
            res.return(404, {
                code: 404,
                message: {
                    error: "Invalid Route"
                }
            });
        }
    }

    private execute(Middleware, req: Request, res: Response): Promise<string> {
        return new Promise((resolve, reject) => {
            Middleware(req, res, (data?) => {
                this._next = true;
                req.next = data || {};
                return resolve("Next called");
            });
        })
    }

    private async run(middleware, req, res) {
        return await Promise.all(middleware.map(async (middleware) => {
            this._next = false;
            if (middleware instanceof Function) {
                return await this.execute(middleware, req, res);
            }
        }))
    }

    public use(middleware) {
        this.middleware.push(middleware);
    }

    public listen(port: number) {
        this.server = createServer(this.handle_request.bind(this)).listen(port);
    }

    private slashed(path): string {
        return path.endsWith("/") ? path.slice(0, -1) : path;
    }

    private find_route(req: Request): Object {
        return this._routes.find(route => {

            let path = this.slashed(route.path);
            let regex = new RegExp(path.replace(/:[^\s/]+/g, "([^/\]+)"));
            let matches = this.slashed(req.url.split("?")[0]).match(regex);
            let params = path.match(/:[^\s/]+/g);
            if (matches && matches[0] === matches["input"] && route.method === req.method) {
                for (let k in params) {
                    req.params[params[k].slice(1)] = decodeURI(matches[parseInt(k) + 1]);
                }

                return route;
            }
        });
    }

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

    private inject(fn) {
        return (target: any, name: string, index: number) => {
            const meta = Reflect.getMetadata(`route:params_${name}`, target) || [];
            meta.push({ index, name, fn });
            Reflect.defineMetadata(`route:params_${name}`, meta, target);
        };
    }

    public Controller(path: string = '') {
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
                })
            }

            Reflect.defineMetadata("route:data", this._routes, target);
        };
    }

    public Use(...middlewares: any[]): any {
        return (target: any, propertyKey: string, descriptor: TypedPropertyDescriptor<any>) => {
            Reflect.defineMetadata(`route:middleware${propertyKey ? "_" + propertyKey : ""}`, middlewares, target);
        };
    }

    public Route(method, path) {
        return (target: any, name: string, descriptor: TypedPropertyDescriptor<any>) => {
            const meta = Reflect.getMetadata("route:data", target) || [];
            meta.push({ method, path, name, descriptor });
            Reflect.defineMetadata("route:data", meta, target);
        };
    }

    public Param(key?) {
        return this.inject(req => !key ? req.params : req.params[key]);
    }

    public Query(key?) {
        return this.inject(req => !key ? req.query : req.query[key]);
    }

    public Body() {
        return this.inject(req => req.body);
    }

    public Response() {
        return this.inject(req => req.response);
    }

    public Request() {
        return this.inject(req => req.request);
    }

    public Queries() {
        return this.Query();
    }

    public Params() {
        return this.Param();
    }

    public Get(path) {
        return this.Route("GET", path);
    }

    public Post(path) {
        return this.Route("POST", path);
    }

    public Put(path) {
        return this.Route("PUT", path);
    }

    public Patch(path) {
        return this.Route("PATCH", path);
    }

    public Delete(path) {
        return this.Route("DELETE", path);
    }

    public autoload(source) {
        fs.readdirSync(source).map(file => {
            if (file.endsWith(".js")) {
                require(source + "/" + file.replace(/\.[^.$]+$/, ""));
            }
        });
    }

}

export const app = new Http();
export const Get = app.Get.bind(app);
export const Put = app.Put.bind(app);
export const Post = app.Post.bind(app);
export const Patch = app.Patch.bind(app);
export const Delete = app.Delete.bind(app);
export const Use = app.Use.bind(app);
export const Route = app.Route.bind(app);
export const Controller = app.Controller.bind(app);
export const Autoload = app.autoload.bind(app);

// New stuff
export const Body = app.Body.bind(app);
export const Param = app.Param.bind(app);
export const Params = app.Params.bind(app);

export const Query = app.Query.bind(app);
export const Queries = app.Queries.bind(app);

export const Req = app.Request.bind(app);
export const Res = app.Response.bind(app);
