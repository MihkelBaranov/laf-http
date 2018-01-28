# LAF-HTTP
WIP

### Installation
```sh
$ npm add laf-http@next
```

### Example
```typescript
import {
	app,
	Controller,
	Delete,
	Get,
    IRequest,
    IResponse, 
    IRoute, 
    Param,
    Patch, 
    Post, 
    Put, 
    Req, 
    Use
} from "../http";

const getNumber = (req: IRequest, res: IResponse, next) => {
	req.params.number = parseInt(req.params.number, 0);
	next({
		hello: 5,
	});

};

@Controller("/foo")
class Test {

	@Get("/test/:number")
	@Use(getNumber)
	public getTest( @Req() req: IRequest, @Param("number") numb: number) {

		return {
			code: 200,
			message: {
				numb,
                parms: req.params,
                next: req.next
			},
		};
	}

}

app.use((req: Request, res: Response, next) => {
	console.info("In middleware");
	next();
});

app.listen(3000);

console.log("Server running on port 3000");
```
