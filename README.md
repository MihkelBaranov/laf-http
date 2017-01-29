# LAF-HTTP
Simple express like http module

Example
```
import { Http, Request, Response } from "laf-http"

let server = new Http();

const routes = [{
    method: "GET",
    path: "/hello/:world",
    service: (req: Request, res: Response) => {
        res.return(200, req.params);
    }
}];

server.use((req: Request, res: Response, next: any) => {
    console.log("Middleware");
    next();
});

server.register(routes);

server.listen(3000);
console.log("Server running on port 3000");
```
