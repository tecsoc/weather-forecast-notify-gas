#!/bin/sh

CLASPJSON=$(cat <<-END
  {
    "scriptId": "$SCRIPT_ID"
    "rootDir": "src"
  }
END
)

echo $CLASPJSON > ~/.clasp.json