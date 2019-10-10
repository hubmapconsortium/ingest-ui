from flask import Flask, request, session, redirect, url_for, Response
from flask_cors import CORS, cross_origin
from globus_sdk import AuthClient, AccessTokenAuthorizer, ConfidentialAppAuthClient, RefreshTokenAuthorizer
from pprint import pprint
import json

# Create the Flask instance
app = Flask(__name__, instance_relative_config=True)
app.config.from_pyfile('app.cfg')

# Default
@app.route("/")
def hello():
    return "Welcome to HuBMAP UUID!"

# Redirect users from react app login page to Globus auth login widget then redirect back
@app.route('/login')
@cross_origin()
def login():
    #redirect_uri = url_for('login', _external=True)
    redirect_uri = app.config['FLASK_APP_BASE_URI'] + 'login'

    confidential_app_auth_client = ConfidentialAppAuthClient(app.config['GLOBUS_APP_ID'], app.config['GLOBUS_APP_SECRET'])
    confidential_app_auth_client.oauth2_start_flow(redirect_uri, refresh_tokens=True)

    # If there's no "code" query string parameter, we're in this route
    # starting a Globus Auth login flow.
    # Redirect out to Globus Auth
    if 'code' not in request.args:                                        
        auth_uri = confidential_app_auth_client.oauth2_get_authorize_url(additional_params={"scope": "openid profile email urn:globus:auth:scope:transfer.api.globus.org:all urn:globus:auth:scope:auth.globus.org:view_identities urn:globus:auth:scope:nexus.api.globus.org:groups" })
        return redirect(auth_uri)
    # If we do have a "code" param, we're coming back from Globus Auth
    # and can start the process of exchanging an auth code for a token.
    else:
        auth_code = request.args.get('code')

        token_response = confidential_app_auth_client.oauth2_exchange_code_for_tokens(auth_code)
        
        # Get all Bearer tokens
        auth_token = token_response.by_resource_server['auth.globus.org']['access_token']
        nexus_token = token_response.by_resource_server['nexus.api.globus.org']['access_token']
        transfer_token = token_response.by_resource_server['transfer.api.globus.org']['access_token']
        # Also get the user info (sub, email, name, preferred_username) using the AuthClient with the auth token
        user_info = get_user_info(auth_token)
        
        info = {
            'name': user_info['name'],
            'email': user_info['email'],
            'globus_id': user_info['sub'],
            'auth_token': auth_token,
            'nexus_token': nexus_token,
            'transfer_token': transfer_token,
        }

        # Turns json dict into a str
        json_str = json.dumps(info)
        #print(json_str)
        
        # Store the resulting tokens in server session
        session.update(
            tokens=token_response.by_resource_server
        )
      
        # Finally redirect back to the client
        return redirect(app.config['CLIENT_APP_URI'] + '?info=' + str(json_str))

   
@app.route('/logout')
@cross_origin()
def logout():
    """
    - Revoke the tokens with Globus Auth.
    - Destroy the session state.
    - Redirect the user to the Globus Auth logout page.
    """
    confidential_app_auth_client = ConfidentialAppAuthClient(app.config['GLOBUS_APP_ID'], app.config['GLOBUS_APP_SECRET'])

    # Revoke the tokens with Globus Auth
    if 'tokens' in session:    
        for token in (token_info['access_token']
            for token_info in session['tokens'].values()):
                confidential_app_auth_client.oauth2_revoke_token(token)

    # Destroy the session state
    session.clear()

    # build the logout URI with query params
    # there is no tool to help build this (yet!)
    globus_logout_url = (
        'https://auth.globus.org/v2/web/logout' +
        '?client={}'.format(app.config['GLOBUS_APP_ID']) +
        '&redirect_uri={}'.format(app.config['CLIENT_APP_URI']) +
        '&redirect_name={}'.format(app.config['CLIENT_APP_NAME']))

    # Redirect the user to the Globus Auth logout page
    return redirect(globus_logout_url)


def get_user_info(token):
    auth_client = AuthClient(authorizer=AccessTokenAuthorizer(token))
    return auth_client.oauth2_userinfo()