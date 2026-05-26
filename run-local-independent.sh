#!/usr/bin/env bash

SESSION="emergency-dev"

# Kill old session if it exists
tmux kill-session -t $SESSION 2>/dev/null

# Create session detached
tmux new-session -d -s $SESSION -n backend-silo

# Window 0 - backend silo
tmux send-keys -t $SESSION:backend-silo \
  "cd apps/backend && bun run dev:silo" C-m

# Window 1 - backend platform
tmux new-window -t $SESSION -n backend-platform
tmux send-keys -t $SESSION:backend-platform \
  "cd apps/backend && bun run dev:platform" C-m

# Window 2 - super admin backend
tmux new-window -t $SESSION -n super-admin
tmux send-keys -t $SESSION:super-admin \
  "cd apps/super-admin-backend && bun run dev" C-m

# Window 3 - mobile responder
tmux new-window -t $SESSION -n mobile-responder
tmux send-keys -t $SESSION:mobile-responder \
  "cd apps/mobile-responder && bun run dev" C-m

# Window 4 - mobile responder 8082
tmux new-window -t $SESSION -n mobile-user-8082
tmux send-keys -t $SESSION:mobile-user-8082 \
  "cd apps/mobile-user && bun run dev --port 8082" C-m

# If already inside tmux, switch client
if [ -n "$TMUX" ]; then
  tmux switch-client -t $SESSION
else
  tmux attach-session -t $SESSION
fi
