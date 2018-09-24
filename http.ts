import * as fs from "fs";
import { createServer, IncomingMessage, Server, ServerResponse } from "http";
import "reflect-metadata";
import { parse } from "url";

export interface IResponse extends ServerResponse {
	return(status?: number, message?: Object): void;
}
export interface IParam {
	index?: number;
	name?: string;
	fn: Function
}

export interface IRoute {
	method: number;
	middleware: Function[];
	name: string;
	params: IParam[];
	path: string;
	service: any;
}

export interface IRequest extends IncomingMessage {
	query: any;
	body: any;
	payload: any;
	params: any;
	parsed: any;
	route: IRoute;
	files: any;
	next: any;
	response: IResponse;
	request: IRequest;
}

export interface IReturn {
	code: number;
	message: object | string | Buffer;
	headers?: object;
}

export interface INext {
	(data?: object): Function;
}

export enum HttpMethodsEnum {
	GET = 0,
	POST = 1,
	PUT = 2,
	DELETE = 3,
	PATCH = 4,
	MIXED = 5,
}

export enum Constants {
	INVALID_ROUTE = "Invalid route",
	NO_RESPONSE = "No response",
	JSON_RESPONSE = "application/json",
	ROUTE_DATA = "route:data",
}

export class Http {
	public server: Server;
	public routes: any[] = [];

	private next: boolean = false;
	private middleware: Function[] = [];
	public Controller(path: string = "") {
		return (target: Function) => {
			const controllerMiddleware = Reflect.getMetadata("route:middleware", target) || [];
			const routes = Reflect.getMetadata(Constants.ROUTE_DATA, target.prototype) || [];

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

			Reflect.defineMetadata(Constants.ROUTE_DATA, this.routes, target);
		};
	}

	public use(middleware: Function) {
		this.middleware.push(middleware);
	}

	public listen(port: number) {
		this.server = createServer(this.handleRequest.bind(this)).listen(port);
	}

	public Use(...middlewares: any[]): any {
		return (target: any, propertyKey: string, descriptor: TypedPropertyDescriptor<any>) => {
			Reflect.defineMetadata(`route:middleware${propertyKey ? "_" + propertyKey : ""}`, middlewares, target);
		};
	}

	public Route(method: number, path: string) {
		return (target: any, name: string, descriptor: TypedPropertyDescriptor<any>) => {
			const meta = Reflect.getMetadata(Constants.ROUTE_DATA, target) || [];
			meta.push({ method, path, name, descriptor });
			Reflect.defineMetadata(Constants.ROUTE_DATA, meta, target);
		};
	}

	public Param(key?: string) {
		return this.inject((req: IRequest) => !key ? req.params : req.params[key]);
	}

	public Query(key?: string) {
		return this.inject((req: IRequest) => !key ? req.query : req.query[key]);
	}

	public Body(key?: string) {
		return this.inject((req: IRequest) => !key ? req.body : req.body[key]);
	}

	public Response() {
		return this.inject((req: IRequest) => req.response);
	}

	public Request() {
		return this.inject((req: IRequest) => req.request);
	}

	public Get(path: string) {
		return this.Route(HttpMethodsEnum.GET, path);
	}

	public Post(path: string) {
		return this.Route(HttpMethodsEnum.POST, path);
	}

	public Put(path: string) {
		return this.Route(HttpMethodsEnum.PUT, path);
	}

	public Patch(path: string) {
		return this.Route(HttpMethodsEnum.PATCH, path);
	}

	public Delete(path: string) {
		return this.Route(HttpMethodsEnum.DELETE, path);
	}

	public Mixed(path: string) {
		return this.Route(HttpMethodsEnum.MIXED, path);
	}

	public autoload(source: string) {
		fs.readdirSync(source).map((file) => {
			if (file.endsWith(".js")) {
				require(source + "/" + file.replace(/\.[^.$]+$/, ""));
			}
		});
	}

	private getArguments(params: IParam[], req: IRequest) {
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

	private async handleRequest(req: IRequest, res: IResponse) {
		try {
			// Init request object
			req.params = {};
			req.parsed = parse(req.url, true);
			req.query = req.parsed.query;

			req.response = res;
			req.request = req;
			res.return = this._return(res);

			this.next = true;

			if (this.middleware.length > 0) {
				await this.run(this.middleware, req, res);
			}

			req.route = this.findRoute(req);

			if (!req.route) {
				throw Constants.INVALID_ROUTE;
			}

			if (req.route.middleware && this.next) {
				await this.run(req.route.middleware, req, res);
			}

			if (!this.next) {
				return;
			}

			const args = this.getArguments(req.route.params, req);

			const result: IReturn = await req.route.service(...args);

			if (result) {
				res.return(result.code, result);
			} else {
				if (!res.finished) {
					throw Constants.NO_RESPONSE;
				}
			}

		} catch (e) {
			this._return(res)(404, {
				code: 404,
				message: {
					error: e,
				},
			});
		}

	}

	private execute(Middleware: Function, req: IRequest, res: IResponse): Promise<string> {
		return new Promise((resolve, reject) => {
			Middleware(req, res, (data?: string | number | object | string[]) => {
				this.next = true;
				req.next = data || {};
				return resolve();
			});
		});
	}

	private async run(middleware: Function[], req: IRequest, res: IResponse) {
		return await Promise.all(middleware.map(async (fn) => {
			this.next = false;
			if (fn instanceof Function) {
				return await this.execute(fn, req, res);
			}
		}));
	}

	private slashed(path: string): string {
		return path.endsWith("/") ? path.slice(0, -1) : path;
	}

	private findRoute(req: IRequest): IRoute {
		return this.routes.find((route) => {

			const path = this.slashed(route.path);
			const regex = new RegExp(path.replace(/:[^\s/]+/g, "([^/\]+)"));
			const matches = this.slashed(req.url.split("?")[0]).match(regex);
			const params = path.match(/:[^\s/]+/g);
			if (matches && matches[0] === matches.input
				&& (route.method === HttpMethodsEnum[<any>req.method]
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

	private _return(res: IResponse): any {
		return (status: number, response: { headers?: object, message: void, stream: fs.ReadStream }) => {
			let headers: any = {
				"Content-Type": Constants.JSON_RESPONSE,
			};

			if (response.headers) {
				headers = Object.assign(headers, response.headers);
			}

			const body = headers["Content-Type"] === Constants.JSON_RESPONSE ? JSON.stringify(response) : response.message;

			res.writeHead(status, headers);
			if (response.stream) {
				response.stream.pipe(res);
				return;
			}

			if (headers['Connection'] !== "keep-alive") {
				res.write(body);
				res.end();
			}
		};
	}

	private inject(fn: Function) {
		return (target: Function, name: string, index: number) => {
			const meta = Reflect.getMetadata(`route:params_${name}`, target) || [];
			meta.push({ index, name, fn });
			Reflect.defineMetadata(`route:params_${name}`, meta, target);
		};
	}
}

export const app = new Http();
export const Get = app.Get.bind(app);
export const Put = app.Put.bind(app);
export const Post = app.Post.bind(app);
export const Patch = app.Patch.bind(app);
export const Delete = app.Delete.bind(app);
export const Use = app.Use.bind(app);
export const Mixed = app.Mixed.bind(app);
export const Route = app.Route.bind(app);
export const Controller = app.Controller.bind(app);
export const Autoload = app.autoload.bind(app);
export const Body = app.Body.bind(app);
export const Param = app.Param.bind(app);
export const Query = app.Query.bind(app);
export const Req = app.Request.bind(app);
export const Res = app.Response.bind(app);
// Will be removed in a future release
export const Queries = app.Query.bind(app);
export const Params = app.Param.bind(app);
