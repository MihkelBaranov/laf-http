import { IncomingMessage, ServerResponse, Server, createServer } from "http";
import { parse } from "url";

export interface Response extends ServerResponse {
    return(status?, message?): void;
}

export interface Request extends IncomingMessage {
    query: any;
    params: any;
    parsed: any;
    route: any;
}

export class Http {
    private _middleware: any = [];
    private _httpMethods: any = ["POST", "GET", "PUT", "DELETE"];
    private _routes: Array<any> = [];
    private _next: boolean = false;

    get handler(): any {
        return this.request.bind(this);
    }

    public next() {
        this._next = true;
    }

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

    public use(middleware) {
        this._middleware.push(middleware);
    }

    public register(routes) {
        for (let route of routes) {
            this._routes.push(route);
        }
    }

    public listen(port: number) {
        createServer(this.handler).listen(port);
    }

    private _split(path): Array<any> {
        return path.endsWith("/") ? path.slice(0, -1).split("/") : path.split("/");
    }
    private _route(req: Request) {
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

    private _return(res: Response) {
        return (status = 200, message) => {
            res.writeHead(status, "Content-Type", "application/json");
            res.write(JSON.stringify({ message: message, status: status }));
            return res.end();
        };
    }
}