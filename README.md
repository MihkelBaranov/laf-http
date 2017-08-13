# LAF-HTTP
Simple _express like_ http router using decorators

### Installation
yarn:
```sh
$ yarn add laf-http
```

### Example
```typescript
import { app, Request, Response, Next } from "laf-http"

const auth = (req: Request, res: Response, next: Next) => {
    next(); 
}

@app.Controller()
class Hello {
    @app.Get("/")
    world(req: Request, res: Response) {
        return res.return(200, {
            message: "Hello world"
        })
    }

    @app.Get("/echo/:name")
    echo(req: Request, res: Response) {
        return res.return(200, {
            message: `Hello ${req.params.name}`
        })
    }

    @app.Get("/secure")
    @app.Use(auth)
    secure(req: Request, res: Response) {
        return res.return(200, {
            message: "Secure page"
        })
    }
}


app.listen(3000);
console.log("Server running on port 3000");
```
