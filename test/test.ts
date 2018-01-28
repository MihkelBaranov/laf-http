import test from "ava";
import * as supertest from "supertest";
// tslint:disable-next-line:max-line-length
import { app, Controller, Delete, Get, HttpMethodsEnum, IRequest, IResponse, IRoute, Param, Patch, Post, Put, Req, Use } from "../http";

test("get request", (t) => {
	@Controller()
	class Test {
		@Get("/test")
		public getTest() {
			// test
			return {
				code: 200,
				message: 1,
			};
		}
	}

	t.is(app.routes.length, 1);
	const route: IRoute = app.routes[0];
	t.is(route.name, "getTest");
	t.is(typeof route.service, "function");
	t.is(route.method, HttpMethodsEnum.GET);
	t.is(route.path, "/test");

	app.routes = [];

});

test("multiple", (t) => {
	@Controller()
	class Test {
		@Get("/test")
		public getTest() {
			// test
		}

		@Post("/test")
		public postTest() {
			// test
		}
	}
	t.is(app.routes.length, 2);
	t.is(app.routes[1].method, HttpMethodsEnum.POST);
	app.routes = [];
});

test("laf", (t) => {
	const getNumber = (req: IRequest, res: IResponse, next) => {
		req.params.number = parseInt(req.params.number, 0);
		t.is(req.params.number, 10);
		next({
			hello: 5,
		});

	};

	@Controller("/foo")
	class Test {

		@Get("/test/:number")
		@Use(getNumber)
		public getTest( @Req() req: IRequest, @Param("number") numb: number) {
			t.is(req.params.number, 10);
			t.is(req.next.hello, 5);

			t.is(req.next.hello, numb - req.next.hello);

			return {
				code: 200,
				message: "Hello",
			};
		}

	}

	t.plan(4);

	app.use((req: Request, res: Response, next) => {
		console.info("In middleware");
		next();
	});

	app.listen(3000);
	return supertest(app.server).get("/foo/test/10").expect(200);
});
