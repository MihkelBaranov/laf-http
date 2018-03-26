import * as fs from "fs";
import { createServer, IncomingMessage, Server, ServerResponse } from "http";
import "reflect-metadata";
import { parse } from "url";

export interface IResponse extends ServerResponse {
	return(status?, message?): void;
}

export interface IRoute {
	method: number;
	middleware: void[];
	name: string;
	params: object;
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
	(data?: {});
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
	private middleware: void[] = [];
	public Controller(path: string = "") {
		return (target) => {
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

	public use(middleware) {
		this.middleware.push(middleware);
	}

	public listen(port: number) {
		this.server = createServer(this.handle_request.bind(this)).listen(port);
	}

	public Use(...middlewares: any[]): any {
		return (target: any, propertyKey: string, descriptor: TypedPropertyDescriptor<any>) => {
			Reflect.defineMetadata(`route:middleware${propertyKey ? "_" + propertyKey : ""}`, middlewares, target);
		};
	}

	public Route(method, path) {
		return (target: any, name: string, descriptor: TypedPropertyDescriptor<any>) => {
			const meta = Reflect.getMetadata(Constants.ROUTE_DATA, target) || [];
			meta.push({ method, path, name, descriptor });
			Reflect.defineMetadata(Constants.ROUTE_DATA, meta, target);
		};
	}

	public Param(key?) {
		return this.inject((req) => !key ? req.params : req.params[key]);
	}

	public Query(key?) {
		return this.inject((req) => !key ? req.query : req.query[key]);
	}

	public Body() {
		return this.inject((req) => req.body);
	}

	public Response() {
		return this.inject((req) => req.response);
	}

	public Request() {
		return this.inject((req) => req.request);
	}

	public Queries() {
		return this.Query();
	}

	public Params() {
		return this.Param();
	}

	public Get(path) {
		return this.Route(HttpMethodsEnum.GET, path);
	}

	public Post(path) {
		return this.Route(HttpMethodsEnum.POST, path);
	}

	public Put(path) {
		return this.Route(HttpMethodsEnum.PUT, path);
	}

	public Patch(path) {
		return this.Route(HttpMethodsEnum.PATCH, path);
	}

	public Delete(path) {
		return this.Route(HttpMethodsEnum.DELETE, path);
	}

	public Mixed(path) {
		return this.Route(HttpMethodsEnum.MIXED, path);
	}

	public autoload(source) {
		fs.readdirSync(source).map((file) => {
			if (file.endsWith(".js")) {
				require(source + "/" + file.replace(/\.[^.$]+$/, ""));
			}
		});
	}

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

	private async handle_request(req: IRequest, res: IResponse) {
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

			req.route = this.find_route(req);

			if (!req.route) {
				throw Constants.INVALID_ROUTE;
			}

			if (req.route.middleware && this.next) {
				await this.run(req.route.middleware, req, res);
			}

			if (!this.next) {
				return;
			}

			const args = this.get_arguments(req.route.params, req);

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

	private execute(Middleware, req: IRequest, res: IResponse): Promise<string> {
		return new Promise((resolve, reject) => {
			Middleware(req, res, (data?) => {
				this.next = true;
				req.next = data || {};
				return resolve();
			});
		});
	}

	private async run(middleware, req, res) {
		return await Promise.all(middleware.map(async (fn) => {
			this.next = false;
			if (fn instanceof Function) {
				return await this.execute(fn, req, res);
			}
		}));
	}

	private slashed(path): string {
		return path.endsWith("/") ? path.slice(0, -1) : path;
	}

	private find_route(req: IRequest): IRoute {
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

	private _return(res: IResponse): any {
		return (status, response) => {
			let headers = {
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

			res.write(body);
			res.end();
		};
	}

	private inject(fn) {
		return (target: any, name: string, index: number) => {
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
export const Params = app.Params.bind(app);
export const Query = app.Query.bind(app);
export const Queries = app.Queries.bind(app);
export const Req = app.Request.bind(app);
export const Res = app.Response.bind(app);
