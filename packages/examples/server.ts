import Bundler from "parcel-bundler";
import express from "express";
import {
  GroupControl,
  FormControl,
  ControlValue,
} from "@react-typed-forms/core";
const app = express();
app.use(express.json());

const file = "index.html"; // Pass an absolute path to the entrypoint here
const options = {}; // See options section of api docs, for the possibilities

// Initialize a new bundler using a file and options
const bundler = new Bundler(file, options);

// Let express use the bundler middleware, this will let Parcel handle every request over your express server

app.post("/api/validate", (req, res) => {
  setTimeout(() => {
    const { value } = req.body;
    if (value === "OK") {
      return res.send({});
    }
    res.send({ error: `Error: "${value}" is not "OK"` });
  }, 1000);
});

app.use(bundler.middleware());

// Listen on port 8080
app.listen(1234);
