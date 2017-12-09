import { app, Use, Controller, Get, Param, Params, Body, Query, Queries, Res, Req, Request, Response, Return } from "./http"
import { setTimeout } from "timers";


function wait(ms) {
	return new Promise(r => setTimeout(r, ms));
}

class Auth {
	run_before_method(req: Request, res: Response, next) {
		console.log("Running before method is called");
		next({
			hello: "world"
		});
	}
	run_before_class(req: Request, res: Response, next) {
		console.log("Global middleware for all routes");
		setTimeout(() => next(), 2000);

	}
}

@app.Controller("/v1")
export default class Hello {

	@app.Post("/send")
	body( @Body() post_data): Return {

		return {
			code: 200,
			message: {
				post_data
			}
		}

	}

	@Get("/posts/:category")
	@Use(new Auth().run_before_method)
	async posts( @Param("category") category, @Query("count") count, @Res() response: Response, @Req() request: Request) {
		try {
			return {
				code: 200,
				message: `Select ${count} posts from category ${category}`,
				request_params: request.params,
			}
		} catch (e) {
			return {
				code: 400,
				message: e
			}
		}



	}

	@app.Get("/param/:id/:test")
	world( @Param("id") id, @Param("test") test) {

		console.log(id);

		if (parseInt(id) === 20) {
			return {
				code: 200,
				message: {
					id, test
				}

			}
		} else {
			return {
				code: 400,
				message: {
					error: "Invalid id"
				}
			}
		}

	}

	@Get("/hello/:first_name/:last_name")
	async hello( @Params() object: { name: string, lastname: string }) {
		console.log("Parameters", object);
		return {
			code: 200,
			message: object
		};




	}

}

app.listen(5000);

