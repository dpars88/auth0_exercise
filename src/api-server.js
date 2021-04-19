const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const authConfig = require("./auth_config.json");
const jwt = require("express-jwt");
const jwksRsa = require("jwks-rsa");
const jwtAuthz = require("express-jwt-authz");
const ManagementClient = require("auth0").ManagementClient;

const app = express();

const port = process.env.API_PORT || 3001;
const appPort = process.env.SERVER_PORT || 3000;
const appOrigin = authConfig.appOrigin || `http://localhost:${appPort}`;

if (!authConfig.domain || !authConfig.audience) {
  throw new Error(
    "Please make sure that auth_config.json is in place and populated"
  );
}

const authorizeAccessToken = jwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://${authConfig.domain}/.well-known/jwks.json`
  }),
  audience: authConfig.audience,
  issuer: `https://${authConfig.domain}/`,
  algorithms: ["RS256"]
});

const managementAPI = new ManagementClient({
  domain: authConfig.domain,
  clientId: authConfig.management_id,
  clientSecret: authConfig.secret
});

const checkPermissions = jwtAuthz(["read:clients", "read:rules"], {
  customScopeKey: "permissions",
  checkAllScopes: true
});


app.use(morgan("dev"));
app.use(helmet());
app.use(cors({ origin: appOrigin }));

app.get("/api/public", (req, res) => {
  res.send({
    msg: "You called the public endpoint!"
  });
});

app.get("/api/role", authorizeAccessToken, checkPermissions, (req, res) => {
    res.send({
      msg: "Thank you for verifying your role, you now can now retrieve all clients and rules"
    });
});

app.get("/api/rules", authorizeAccessToken, checkPermissions, (req, res) => {
  try {
    managementAPI
      .getRules()
      .then(rules => {
        res.send(rules);
      })
      .catch(function(err) {
        res.send(err);
      });
  } catch (err) {
    res.send(err);
  }
});

app.get("/api/clients", authorizeAccessToken, checkPermissions, (req, res) => {
  try {
    managementAPI
      .getClients()
      .then(clients => {
        res.send(clients);
      })
      .catch(function(err) {
        res.send(err);
      });
  } catch (err) {
    res.send(err);
  }
});

app.listen(port, () => console.log(`API Server listening on port ${port}`));
