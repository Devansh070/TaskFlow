import "dotenv/config";
import { createServer } from "http";
import app from "./app";
import { initSocket } from "./sockets";

const PORT = process.env.PORT || 4000;

const httpServer = createServer(app);
initSocket(httpServer);

httpServer.listen(PORT, () => {
  console.log(`TaskFlow backend listening on port ${PORT}`);
});