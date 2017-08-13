import { app } from "../http"


class Server {
	constructor() {
		this.setup();
	}

	setup() {
		// Autoload controller files
		app.autoload("./controllers");

		// Start new server on port 3000
		app.listen(3000);
	}
}

export default new Server();

