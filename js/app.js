// The Auth0 client, initialized in configureClient()
let auth0 = null;
let accessToken = "";

const app_path = "mapbox_template/";

/**
 * Starts the authentication flow
 */
const login = async (targetUrl) => {
  try {
    let op_temp = window.location.origin
    if(app_path != ""){
      op_temp = window.location.origin + "/" + app_path ;
    }
    const options = {
      redirect_uri: op_temp
    };
    if (targetUrl) {
      options.appState = { targetUrl };
    }
    if(auth0 != null){
      await auth0.loginWithRedirect(options);
    }else{
    }
  } catch (err) {
    console.log("Log in failed", err);
  }
};

/**
 * Executes the logout flow
 */
const logout = () => {
  try {
    console.log("Logging out");
    // returnTo: window.location.origin
    auth0.logout({
      returnTo: window.location.origin + "/" + app_path
    });
  } catch (err) {
    console.log("Log out failed", err);
  }
};

/**
 * Retrieves the auth configuration from the server
 */

 let temp_root = "";
 if(app_path != ""){
  temp_root = "/" + app_path ;
}
const fetchAuthConfig = () => fetch(temp_root + "/auth_config.json?date=20220107_2");

/**
 * Initializes the Auth0 client
 */
const configureClient = async () => {
  const response = await fetchAuthConfig();
  const config = await response.json();
	
  try {
//  	auth0 = await createAuth0Client({
//      domain: config.domain,
//      audience : config.audience,
//      client_id: config.clientId,
//    });
  	
  	 auth0 = new Auth0Client({
      domain: config.domain,
      audience : config.audience,
      client_id: config.clientId,
      cacheLocation: 'localstorage',
    });

  } catch (err) {
    console.log("auth0 is NOT activate.");
    console.log("configureClient failed", err);
  }
};

/**
 * Checks to see if the user is authenticated. If so, `fn` is executed. Otherwise, the user
 * is prompted to log in
 * @param {*} fn The function to execute if the user is logged in
 */
const requireAuth = async (fn, targetUrl) => {
  const isAuthenticated = await auth0.isAuthenticated();

  if (isAuthenticated) {
    return fn();
  }

  return login(targetUrl);
};

// Will run when page finishes loading
window.onload = async () => {
  console.log("app.js window.onload");
  await configureClient();

  if(auth0 == null){
    console.log("auth0 is null.");
	return
  }

  const isAuthenticated = await auth0.isAuthenticated();

  if (isAuthenticated) {
    console.log("> User is authenticated");
    window.history.replaceState({}, document.title, window.location.pathname);
    updateUI();
    return;
  }else{
    console.log("> User is NOT authenticated");
  }

  const query = window.location.search;
  const shouldParseResult = query.includes("code=") && query.includes("state=");

  if (shouldParseResult) {
    try {
      const result = await auth0.handleRedirectCallback();

      if (result.appState && result.appState.targetUrl) {
        showContentFromUrl(result.appState.targetUrl);
      }	
    } catch (err) {
      console.log("Error parsing redirect:", err);
    }

    window.history.replaceState({}, document.title, "/" + app_path );
  }else{
    console.log("query is null.")
  }

  updateUI();
};
