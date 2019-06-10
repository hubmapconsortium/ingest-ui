import traceback
from flask import Flask, request, session, redirect, url_for, Response, jsonify
from pprint import pprint
import globus_sdk #pip import globus_sdk
import base64
import hm_auth
from hm_auth import secured, AuthHelper

app = Flask(__name__)
app.config.from_pyfile('common_app.conf')
authHelper = None

@app.route("/")
def hello():
    return "Hello World!"
 
 
@app.route('/ptest', methods=['POST'])
def ptest():
    tokens = authHelper.getAuthorizationTokens(request.headers)
    if tokens is Response: return tokens
    if not isinstance(tokens, dict): return Response("MBearer token required", 401)
    if not 'nexus_token' in tokens: return Response('Nexus token required', 401)
    if not 'transfer_token' in tokens: return Response("Transfer token required", 401)
    
    pprint(tokens)
    return('blech')

@app.route('/usergroups', methods=['GET'])
def userGroupss():
    userInfo = authHelper.getUserInfoUsingRequest(request, getGroups=True)
    if isinstance(userInfo, Response):
        return userInfo
    return jsonify(userInfo) 
    
@app.route('/userinfo', methods=['GET'])
@secured(groups="HuBMAP-read")
def userInfo():
    userInfo = authHelper.getUserInfoUsingRequest(request)
    if isinstance(userInfo, Response):
        return userInfo
    return jsonify(userInfo) 

@app.route("/tester")
@secured(scopes=["EmAIls", "profile"])
def tester():
    print("TESTING!")
    return "BLECH"

@app.route('/login')
def login():
    redirect_uri = url_for('login', _external=True)

    client = globus_sdk.ConfidentialAppAuthClient(app.config['APP_CLIENT_ID'], app.config['APP_CLIENT_SECRET'])
    client.oauth2_start_flow(redirect_uri)

    # If there's no "code" query string parameter, we're in this route
    # starting a Globus Auth login flow.
    # Redirect out to Globus Auth
    if 'code' not in request.args:                                        
        auth_uri = client.oauth2_get_authorize_url(additional_params={"scope": "openid profile email urn:globus:auth:scope:transfer.api.globus.org:all urn:globus:auth:scope:auth.globus.org:view_identities urn:globus:auth:scope:nexus.api.globus.org:groups" })
        #auth_uri = client.oauth2_get_authorize_url(additional_params={"scope": "openid profile email urn:globus:auth:scope:transfer.api.globus.org:all urn:globus:auth:scope:auth.globus.org:view_identities" }) #"urn:globus:auth:scope:transfer.api.globus.org:all zzyyxcdid openid email profile"})
        return redirect(auth_uri)
    # If we do have a "code" param, we're coming back from Globus Auth
    # and can start the process of exchanging an auth code for a token.
    else:
        code = request.args.get('code')
        tokens = client.oauth2_exchange_code_for_tokens(code)

        # store the resulting tokens in the session
        session.update(
            tokens=tokens.by_resource_server,
            is_authenticated=True
        )
        print('client/app token: ' + str(base64.b64encode(bytes(app.config['APP_CLIENT_ID'] + ':' + app.config['APP_CLIENT_SECRET'], 'utf-8'))))
        tokes = session['tokens'].items()
        for key, token in tokes:
            authorizer = globus_sdk.AccessTokenAuthorizer(token['access_token'])
            print("=============================================")
            print("-- info for " + key)
            pprint(vars(authorizer))
      
        return redirect(url_for('hello'))
    
    

@app.route('/logout')
def logout():
    """
    - Revoke the tokens with Globus Auth.
    - Destroy the session state.
    - Redirect the user to the Globus Auth logout page.
    """
    client = globus_sdk.ConfidentialAppAuthClient(app.config['APP_CLIENT_ID'], app.config['APP_CLIENT_SECRET'])

    # Revoke the tokens with Globus Auth
    if 'tokens' in session:    
        for token in (token_info['access_token']
                      for token_info in session['tokens'].values()):
            client.oauth2_revoke_token(token)

    # Destroy the session state
    session.clear()

    # the return redirection location to give to Globus AUth
    redirect_uri = url_for('hello', _external=True)

    # build the logout URI with query params
    # there is no tool to help build this (yet!)
    globus_logout_url = (
        'https://auth.globus.org/v2/web/logout' +
        '?client={}'.format(app.config['APP_CLIENT_ID']) +  #'?client={}'.format(app.config['PORTAL_CLIENT_ID']) +
        '&redirect_uri={}'.format(redirect_uri) +
        '&redirect_name=Globus Example App')

    # Redirect the user to the Globus Auth logout page
    return redirect(globus_logout_url)



if __name__ == "__main__":
    try:
        hm_auth.hm_application = app 
        
        cId = app.config['APP_CLIENT_ID']
        cSecret = app.config['APP_CLIENT_SECRET']
        if not AuthHelper.isInitialized():
            authHelper = AuthHelper.create(clientId=cId, clientSecret=cSecret)
        else:
            authHelper.instance()              
        app.run()
    except Exception as e:
        traceback.print_exc()                                                                                                            
        print("Error during startup.")                                                                                              
        print(str(e))                                                                                                                 
