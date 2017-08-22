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
}

export interface Next {
    (data?: {}): any;
}

export class Http {
    public server: any;

    public _routes: Array<any> = [];
    private _next: boolean = false;
    private global_middleware: Array<Function> = [];
    constructor() { }

    private async _handler(req: Request, res: Response) {

        if (req.url === "/favicon.ico") {
            return;
        }

        req.params = {};
        req.parsed = parse(req.url, true);
        req.query = req.parsed.query;

        res.return = this._return(res);
        this._next = true;
        if (this.global_middleware.length > 0) {
            await this.run(this.global_middleware, req, res);
        }



        // Find route
        req.route = this._route(req);

        if (req.route) {

            if (req.route.middleware && this._next) {
                await this.run(req.route.middleware, req, res);
            }

            if (!this._next) {
                return;
            }

            req.route.service(req, res);
        } else {
            res.return(500, "Invalid Route");
        }
    }

    private execute(f, req: Request, res: Response): Promise<string> {
        return new Promise((resolve, reject) => {
            f(req, res, (data?) => {
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
        this.global_middleware.push(middleware);
    }

    public listen(port: number) {
        this.server = createServer(this._handler.bind(this)).listen(port);
    }

    private slashed(path): string {
        return path.endsWith("/") ? path.slice(0, -1) : path;
    }

    private _route(req: Request): Object {
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

    public Controller(path: string = '') {
        return (target) => {
            const class_middleware = Reflect.getMetadata("route:middleware", target) || [];
            const routes = Reflect.getMetadata("route:data", target.prototype) || [];

            for (const route of routes) {
                const route_middleware = Reflect.getMetadata(`route:middleware_${route.name}`, target.prototype) || [];
                this._routes.push({
                    method: route.method,
                    path: path + route.path,
                    middleware: [...class_middleware, ...route_middleware],
                    service: route.descriptor.value,
                    name: route.name
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
