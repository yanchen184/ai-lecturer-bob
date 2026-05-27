#!/bin/bash
# PostToolUse hook（matcher: Bash）：偵測「git push 成功」後，注入一段提示，
# 叫 Claude 進入「排程 1 分鐘後驗 GitHub Pages deploy、過了就停、沒過才修」流程。
#
# 真實 payload 欄位（依官方 hooks 文件，非憑印象）：
#   tool_name / tool_input.command / tool_output
# PostToolUse 只在工具「成功」時觸發 → 觸發本身即代表 push 沒失敗，不必再判 exit code。
# 輸出格式：hookSpecificOutput.{hookEventName, additionalContext}
#
# 排除噪音：dry-run / --help / 顯然不是真正 push 的指令不觸發。

set -euo pipefail

PAYLOAD="$(cat)"

# 沒有 jq 就靜默退出，不擋任何事
command -v jq >/dev/null 2>&1 || exit 0

TOOL_NAME="$(printf '%s' "$PAYLOAD" | jq -r '.tool_name // empty')"
COMMAND="$(printf '%s' "$PAYLOAD" | jq -r '.tool_input.command // empty')"

# 只認 Bash 工具
[ "$TOOL_NAME" = "Bash" ] || exit 0

# command 必須包含 "git push"
case "$COMMAND" in
  *"git push"*) : ;;
  *) exit 0 ;;
esac

# 排除明顯不是真推送的情境
case "$COMMAND" in
  *"--dry-run"*|*"--help"*|*"git push -h"*) exit 0 ;;
esac

# 注入提示。語氣對齊：要 Claude 用 ScheduleWakeup 非阻塞地等 ~70 秒，
# 醒來只跑一次 gh run 驗證；conclusion=success 就停（不再 loop），
# 失敗才去看 log 修，修完重推會再次觸發本 hook。
read -r -d '' CTX <<'EOF' || true
偵測到 git push 成功。請啟動一次性的 deploy 驗證（不要無限 loop）：

1. 用 ScheduleWakeup 排約 70 秒後醒來（GitHub Pages deploy.yml 約 1 分半跑完，70 秒先探一次；reason 寫「驗 deploy」）。
2. 醒來後跑：gh run list --workflow=deploy.yml --limit=1 --json status,conclusion,headSha,databaseId
   - status 還在 in_progress / queued → 再排一次 70 秒（最多探 3 次，約 3.5 分鐘）。
   - status=completed 且 conclusion=success → 回報「deploy 通過（headSha 對得上剛推的 commit）」然後停，不再排程。
   - conclusion=failure → 跑 gh run view <databaseId> --log-failed 看失敗原因，修掉問題、重新 push（會再次觸發本驗證），不要在沒修的情況下重排。
3. 確認 headSha 對得上你剛 push 的 commit，避免驗到舊的 run。

這是一次性驗證流程，過了或修完就結束，不要變成持續輪詢。
EOF

jq -n --arg ctx "$CTX" '{
  hookSpecificOutput: {
    hookEventName: "PostToolUse",
    additionalContext: $ctx
  }
}'
