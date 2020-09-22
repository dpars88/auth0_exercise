import React, { useState } from "react";
import { Button, Alert } from "reactstrap";
import Highlight from "../components/Highlight";
import { useAuth0, withAuthenticationRequired } from "@auth0/auth0-react";
import config from "../auth_config.json";
import Loading from "../components/Loading";

const { apiOrigin = "http://localhost:3001" } = config;

const ExternalApiComponent = () => {
  const [state, setState] = useState({
    showResult: false,
    apiMessage: "",
    error: null
  });

  const {
    getAccessTokenSilently,
    loginWithPopup,
    getAccessTokenWithPopup
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

    await callPublicApi();
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

    await callPublicApi();
  };

  const callPrivateApi = async () => {
    try {
      const token = await getAccessTokenSilently();
      const response = await fetch(`${apiOrigin}/api/private`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const responseData = await response.json();

      setState({
        ...state,
        showResult: true,
        apiMessage: responseData
      });
    } catch (error) {
      setState({
        ...state,
        error: error.error
      });
    }
  };

  const callRoleBasedApi = async () => {
    try {
      const token = await getAccessTokenSilently();
      const response = await fetch(`${apiOrigin}/api/private/role`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const responseData = await response.json();

      setState({
        ...state,
        showResult: true,
        apiMessage: responseData
      });
    } catch (error) {
      setState({
        ...state,
        error: error.error
      });
    }
  };

  const callPublicApi = async () => {
    try {
      const response = await fetch(`${apiOrigin}/api/public`);
      const responseData = await response.json();
      setState({
        ...state,
        showResult: true,
        apiMessage: responseData
      });
    } catch (error) {
      setState({
        ...state,
        error: error.error
      });
    }
  };

  const handle = (e, fn) => {
    e.preventDefault();
    fn();
  };

  console.log(state.apiMessage, state.showResult);

  return (
    <>
      <div className="mb-5">
        {state.error === "consent_required" && (
          <Alert color="warning">
            You need to{" "}
            <a
              href="#/"
              class="alert-link"
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
              class="alert-link"
              onClick={(e) => handle(e, handleLoginAgain)}
            >
              log in again
            </a>
          </Alert>
        )}

        <h1>External API</h1>
        <p>
          Ping an external API by clicking one of the buttons below. The private
          APIs will call the external API using an access token, and the API
          will validate it using the API's audience value.
        </p>

        <Button color="primary" className="mt-5" onClick={callPublicApi}>
          Ping Public API
        </Button>
        <Button color="primary" className="mt-5" onClick={callPrivateApi}>
          Ping Private API
        </Button>
        <Button color="primary" className="mt-5" onClick={callRoleBasedApi}>
          Ping Role Based API
        </Button>
      </div>

      <div className="result-block-container">
        {state.showResult && (
          <div className="result-block" data-testid="api-result">
            <h6 className="muted">Result</h6>
            {state.apiMessage.msg}
          </div>
        )}
      </div>
    </>
  );
};

export default withAuthenticationRequired(ExternalApiComponent, {
  onRedirecting: () => <Loading />
});