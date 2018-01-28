import * as fs from "fs";
import {
	app,
	Controller,
	Delete, Get, HttpMethodsEnum, IRequest, IResponse, IReturn, IRoute, Param, Patch, Post, Put, Req, Use,
} from "./http";

@Controller("/foo")
class Test {

	@Get("/test/:number")
	public getTest( @Req() req: IRequest, @Param("number") numb: number): IReturn {
		const audio = fs.readFileSync("./u-a-1.mp3");
		const stat = fs.statSync("./u-a-1.mp3");
		return {
			code: 200,
			message: {
				params: req.params,
			},
		};
	}

	@Get("/image")
	public image(): IReturn {
		const image = fs.readFileSync("./truck-1.png");
		return {
			code: 200,
			headers: {
				"Content-Type": "image/png",
			},
			message: image,
		};
	}

	@Get("/audio")
	public audio(): IReturn {
		const audio = fs.readFileSync("./u-a-1.mp3");
		const stat = fs.statSync("./u-a-1.mp3");
		return {
			code: 200,
			headers: {
				"Accept-Ranges": "bytes",
				"Content-Length": stat.size,
				"Content-Type": "audio/mp3",
			},
			message: audio,

		};
	}
}

app.listen(8800);
