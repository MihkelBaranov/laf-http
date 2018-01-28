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

test("laf:json", async (t) => {
	@Controller()
	class Test {

		@Get("/json")
		public json( @Req() req: IRequest, @Param("number") numb: number) {
			return {
				code: 200,
				message: {
					data: true,
				},
			};
		}
	}
	t.plan(2);
	app.listen(3000);
	const res: any = await supertest(app.server).get("/json").expect(200).expect("Content-Type", /json/);

	t.is(res.status, 200);
	t.is(res.body.message.data, true);

});

test("laf:html-with-middleware/param", async (t) => {
	const getNumber = (req: IRequest, res: IResponse, next) => {
		req.params.number = parseInt(req.params.number, 0);
		t.is(req.params.number, 10);
		next({
			hello: 5,
		});

	};

	@Controller("/test")
	class Test {

		@Get("/html/:number")
		@Use(getNumber)
		public html( @Req() req: IRequest, @Param("number") numb: number) {
			t.is(req.params.number, 10);
			t.is(req.next.hello, 5);

			t.is(req.next.hello, numb - req.next.hello);

			return {
				code: 200,
				headers: {
					"Content-Type": "text/html",
				},
				message: "<h1>Hello<h1>",
			};
		}

	}

	t.plan(6);

	if (!app.server) {
		app.listen(3000);
	}

	const r: any = await supertest(app.server).get("/test/html/10").expect(200).expect("Content-Type", /html/);

	t.is(r.status, 200);
	t.is(r.text, "<h1>Hello<h1>");
});
