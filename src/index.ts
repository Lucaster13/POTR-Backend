import cors from "cors";
import { ContractIdT, NetworkAddressT } from "potr-common";
import express, { Request } from "express";
import { summon } from "./handlers";

const SERVER_PORT = 3001;

const app = express();

app.use(express.json());
app.use(cors());

type SummonRequest = {
	addr: NetworkAddressT;
	ctcId: ContractIdT;
};

app.get("/summon", async (req: Request<any, any, any, SummonRequest>, res) => {
	const { addr, ctcId } = req.query;
	await summon(addr, ctcId);
	res.sendStatus(200);
});

app.listen(SERVER_PORT, () => {
	console.log(`app listening on port ${SERVER_PORT}`);
});
