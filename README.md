# LAF-HTTP
WIP

### Installation
```sh
$ npm add laf-http@next
```

### Basic Example
```typescript
import { app, Controller, Get, Param, Req,  Use } from "laf-http";

const middleware = (req, res, next) => {
    next();
};

@Controller("/hello")
class Hello {

    @Get("/:name")
    @Use(middleware)
    public hello(@Param("name") name) {
        return {
            code: 200,
            message: {
                name,
            },
        };
    }
}

app.listen(3000);
```
