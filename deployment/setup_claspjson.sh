#!/bin/sh

CLASPJSON=$(cat <<-END
    {
        "scriptId": "$SCRIPT_ID"
    }
END
)

echo $CLASPJSON > ~/.clasp.json