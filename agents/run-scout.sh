#!/bin/bash
set -a
source /var/www/p2ebible.com/.env
set +a
exec node /var/www/p2ebible.com/agents/dist/scout.js
