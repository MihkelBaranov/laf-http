# LAF-HTTP
Simple _express like_ http module built with Typescript

### Installation
yarn:
```sh
$ yarn add laf-http
```
npm:
```sh
$ npm i -g laf-http
```
### Example
```typescript
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
