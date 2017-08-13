class Auth {
	run_before_method(req: Request, res: Response, next) {
		console.log("Running before method is called");

		// Pass extra data from middleware to the controller
		next({
			hello: "world"
		});
	}
	run_before_class(req: Request, res: Response, next) {
		console.log("Global middleware for all routes");

		// Wait 2s before executing run_before_method()
		setTimeout(() => next(), 2000);

	}
}

export default new Auth();