import React, { useState } from "react";
import { Button, Alert } from "reactstrap";
import { useAuth0 } from "@auth0/auth0-react";
import config from "../auth_config.json";


const { apiOrigin = "http://localhost:3001" } = config;

const ExternalApiComponent = () => {
  const [state, setState] = useState({
    showResult: false,
    endpointMessage: "",
    error: null
  });
  const [role, setRole] = useState(false);
  const [clientRules, setClientRules] = useState([]);

  const {
    loginWithPopup,
    getAccessTokenWithPopup,
    getAccessTokenSilently
  } = useAuth0();

  const handleConsent = async () => {
    try {
      await getAccessTokenWithPopup();
      setState({
        ...state,
        error: null
      });
    } catch (error) {
      setState({
        ...state,
        error: error.error
      });
    }
  };

  const handleLoginAgain = async () => {
    try {
      await loginWithPopup();
      setState({
        ...state,
        error: null
      });
    } catch (error) {
      setState({
        ...state,
        error: error.error
      });
    }

    await callPublicEndpoint();
  };

  const callPublicEndpoint = async () => {
    try {
      const response = await fetch(`${apiOrigin}/api/public`);
      const responseData = await response.json();
      setState({
        ...state,
        showResult: true,
        endpointMessage: responseData
      });
    } catch (error) {
      setState({
        ...state,
        error: error.error
      });
    }
  };

  const callRoleBasedEndpoint = async () => {
    try {
      const token = await getAccessTokenSilently();
      const response = await fetch(`${apiOrigin}/api/role`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const responseData = await response.json();
      setState({
        ...state,
        showResult: true,
        endpointMessage: responseData
      });
      setRole(true)
    } catch (error) {
      setState({
        ...state,
        error: error.error
      });
    }
  };
  const callClientRulesEndpoint = async () => {
    try {
      const token = await getAccessTokenSilently();
      const clientsResponse = await fetch(`${apiOrigin}/api/clients`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const clientsResponseData = await clientsResponse.json();
      const rulesResponse = await fetch(`${apiOrigin}/api/rules`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const rulesResponseData = await rulesResponse.json();
      let allRules = [];
      let clientRules = clientsResponseData.map(client => {
	            let rulesList = "";
	            let name = client.name;
	            // eslint-disable-next-line array-callback-return
	            rulesResponseData.map(rule => {
		                let func = rule.script;
		                if (func.includes(name) && rule.enabled) {
			                rule.used = true;
			                rulesList += rule.name;
		                } 
	            })
	      client.rules = rulesList;
        return client;
      });
      // eslint-disable-next-line array-callback-return
      rulesResponseData.map(rule => {
        if (rule.enabled && !rule.used) {
          allRules.push(rule);
        }
      })
      setClientRules([clientRules, allRules])
    } catch (error) {
      console.log(error);
    }
  }

  const handle = (e, fn) => {
    e.preventDefault();
    fn();
  };

  if(!role) {
    return (
      <>
        <div className="mb-5">
          {state.error === "consent_required" && (
            <Alert color="warning">
              You need to{" "}
              <a
                href="#/"
                className="alert-link"
                onClick={(e) => handle(e, handleConsent)}
              >
                consent to get access to users api
              </a>
            </Alert>
          )}
  
          {state.error === "login_required" && (
            <Alert color="warning">
              You need to{" "}
              <a
                href="#/"
                className="alert-link"
                onClick={(e) => handle(e, handleLoginAgain)}
              >
                log in again
              </a>
            </Alert>
          )}
  
          <h1>External API</h1>
          <p>
            Authorize your role by clicking the button below for additional resources
          </p>
            <div>
              <Button
                color="primary"
                className="mt-5"
                onClick={callRoleBasedEndpoint}
              >
                Authorize Role
              </Button>
            </div>
        </div>
      </>
    );
  } else {
    return (
      <>
        <div className="mb-5">
          {state.error === "consent_required" && (
            <Alert color="warning">
              You need to{" "}
              <a
                href="#/"
                className="alert-link"
                onClick={(e) => handle(e, handleConsent)}
              >
                consent to get access to users api
              </a>
            </Alert>
          )}
  
          {state.error === "login_required" && (
            <Alert color="warning">
              You need to{" "}
              <a
                href="#/"
                className="alert-link"
                onClick={(e) => handle(e, handleLoginAgain)}
              >
                log in again
              </a>
            </Alert>
          )}
  
          <h1>External API</h1>
          <p>
            Authorize your role by clicking the button below for additional resources
          </p>
            <div>
              <Button
                color="primary"
                className="mt-5"
                onClick={callRoleBasedEndpoint}
              >
                Authorize Role
              </Button>
            </div>
            <br></br>
            <div className="max-height=30px">
              {state.showResult && (
                <div data-testid="api-result">
                  <h6 className="muted">Result</h6>
                  {state.endpointMessage.msg}
                </div>
              )}
            </div>
            <div>
              <Button
                color="primary"
                className="mt-5"
                onClick={callClientRulesEndpoint}
              >
                Retrieve Current Clients and Corresponding Rules
              </Button>
            </div>
        </div>
        <div>
          Clients and The Rules Assocaited To Each
          {clientRules.length > 0 && clientRules[0].map(clientRule => {
            return <div key={clientRule.client_id}> CLIENT NAME: {clientRule.name} CLIENT RULE(S): {clientRule.rules}</div>
          })}
        </div>
        <div>
          All Enabled Rules
          {clientRules.length > 0 && clientRules[1].map(rule => {
            return <div key={rule.id}> RULE ID: {rule.id} RULE NAME: {rule.name}</div>
          })}
        </div>
      </>
    );
  }
  
};

export default ExternalApiComponent;
