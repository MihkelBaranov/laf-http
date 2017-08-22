import test from 'ava';
import { app, Get, Post, Put, Patch, Delete, Controller, Use, Request, Response } from '../http';
import * as supertest from 'supertest-as-promised';

test('get', (t) => {
	@Controller()
	class Test {
		@Get('/test')
		getTest() { }
	}

	t.is(app._routes.length, 1);
	let route = app._routes[0];
	t.is(route.name, 'getTest');
	t.is(typeof route.service, "function");
	t.is(route.method, 'GET');
	t.is(route.path, '/test');

	app._routes = [];
});


test('multiple', (t) => {
	@Controller()
	class Test {
		@Get('/test')
		getTest() { }

		@Post('/test')
		postTest() { }
	}
	t.is(app._routes.length, 2);
	app._routes = [];
});

test('controllerPath', (t) => {
	@Controller('/v1')
	class Test {
		@Get('/test')
		getTest() { };
	}

	t.is(app._routes[0].path, '/v1/test');
	app._routes = [];
});

test('middleware method', (t) => {
	const middleware = (req: Request, res: Response, next) => { }
	@Controller('/v1')
	class Test {

		@Get('/test')
		@Use(middleware)
		getTest() { };

	}

	app.use((req: Request, res: Response) => { })

	let route = app._routes[0];
	t.is(route.path, '/v1/test');
	t.is(route.middleware.length, 2);
	app._routes = [];

});

test('middleware class method', (t) => {
	const middleware = (req: Request, res: Response, next) => { }
	@Controller('/v1')
	@Use(middleware)
	class Test {

		@Get('/test')
		@Use(middleware)
		getTest() { };

	}

	let route = app._routes[0];
	t.is(route.path, '/v1/test');
	t.is(route.middleware.length, 2);
	app._routes = [];

});



test('laf', (t) => {
	const getNumber = (req: Request, res: Response, next) => {
		req.params.number = parseInt(req.params.number)
		t.is(req.params.number, 10);
		next({
			hello: 5
		});

	}
	@Controller('/foo')
	class Test {

		@Get('/test/:number')
		@Use(getNumber)
		getTest(req: Request, res: Response) {
			t.is(req.params.number, 10);
			t.is(req.next.hello, 5);

			res.return(200, "success")
		};

	}

	t.plan(3);


	app.use((req: Request, res: Response, next) => {
		console.log("In middleware");

		next();
	})

	app.listen(3000);
	return supertest(app.server).get('/foo/test/10').expect(200);
});
