#!/bin/sh
cd /home/z/my-project
while true; do
  if ! ss -tlnp 2>/dev/null | grep -q ':3000'; then
    NODE_OPTIONS='--max-old-space-size=512' npx next dev -p 3000 >> /home/z/my-project/dev.log 2>&1
    sleep 2
  fi
  sleep 3
done
