/* eslint-env node */

const express = require("express");
const app = express();


app.use(express.static("public"));

app.get("/", (request, response) => {
  response.sendFile(__dirname + "/index.html");
});

app.use("/build", express.static("build"));

// listen for requests :)
const listener = app.listen(process.env.PORT, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
