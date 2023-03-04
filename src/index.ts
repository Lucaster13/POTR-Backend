import cors from "cors";
import express from "express";
import { RAND_KINGDOM_MNEMONIC } from "./utils/.secrets";

const SERVER_PORT = 3000;

const app = express();

app.use(express.json());
app.use(cors());

app.get("/summon", async (req, res) => {});

app.listen(SERVER_PORT, () => {
    console.log(`app listening on port ${SERVER_PORT}`);
});
