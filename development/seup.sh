#!/bin/sh

LOGIN=$(cat <<-END
    {
        "token": {
            "access_token": "$ACCESS_TOKEN",
            "scope": "https://www.googleapis.com/auth/script.projects https://www.googleapis.com/auth/drive.metadata.readonly https://www.googleapis.com/auth/script.webapp.deploy https://www.googleapis.com/auth/service.management https://www.googleapis.com/auth/logging.read https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/cloud-platform openid https://www.googleapis.com/auth/script.deployments https://www.googleapis.com/auth/drive.file",
            "token_type": "Bearer",
            "id_token": "$ID_TOKEN",
            "expiry_date":1654073398544,
            "refresh_token": "$REFRESH_TOKEN",
        },
        "oauth2ClientSettings": {
            "clientId": "$CLIENT_ID",
            "clientSecret": "$CLIENT_SECRET",
            "redirectUri": "http://localhost"
        },
        "isLocalCreds": false
    }
END
)

echo $LOGIN > ~/.clasprc.json