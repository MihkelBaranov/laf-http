import { app, Request, Response, Next } from "../../http"
import Auth from "../middleware/auth";

// Define the controller route, in this case it will be /v1
@app.Controller("/v1")
@app.Use(Auth.run_before_class)
export default class Hello {

	// GET /v1
	@app.Get("/")
	world(req: Request, res: Response) {
		return res.return(200, {
			message: "Hello world"
		})
	}

	// GET /v1/:name
	@app.Get("/:name")
	@app.Use(Auth.run_before_method)
	echo(req: Request, res: Response) {
		return res.return(200, {
			message: `Hello ${req.params.name}`,
			next: req.next
		})
	}

}

