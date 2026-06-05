
# TODO - DollarBot group reply “not-acceptable” fix

- [ ] Add a safe message-sending wrapper that retries on `not-acceptable` by sanitizing payload (remove `mentions`, fallback to `text`).
- [ ] Use the wrapper for menu sending (image first, then sanitized fallback).
- [ ] Harden group command sending that uses `mentions` (filter to valid JIDs; omit `mentions` if invalid/empty).
- [ ] Restart the bot and test: `.menu`, `.tagall`, `.everyone`, `.hidetag` in a group.

