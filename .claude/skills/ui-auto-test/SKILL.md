# UI Auto Screenshot Testing

A reusable skill to automatically test any page and capture UI screenshots for both Admin and Web apps.

## Purpose

- Visual verification of Admin and Web UI
- Before / after comparison
- Detect layout regressions after refactoring
- Save visual evidence for reviews

## Prerequisites

- Target server running (Admin: 4022, Web: 4021)
- `agent-browser` skill installed
- Playwright browsers installed

## Basic Usage

```bash
# Admin pages (port 4022)
./.claude/skills/ui-auto-test/test.sh --port 4022 --page /event
./.claude/skills/ui-auto-test/test.sh --port 4022 --page /sales

# Web pages (port 4021)
./.claude/skills/ui-auto-test/test.sh --port 4021 --page /
./.claude/skills/ui-auto-test/test.sh --port 4021 --page /search

# Custom screenshot name
./.claude/skills/ui-auto-test/test.sh --port 4021 --page /search --name search-page

# Run with visible browser
./.claude/skills/ui-auto-test/test.sh --port 4022 --page /event --name event-list --headed
```

## Arguments

| Argument   | Default        | Description                                      |
| ---------- | -------------- | ------------------------------------------------ |
| `--port`   | 4022           | Development server port (4022: Admin, 4021: Web) |
| `--page`   | `/event`       | Target page path                                 |
| `--name`   | auto-generated | Screenshot filename                              |
| `--headed` | headless       | Run with visible browser                         |

## Output

Screenshots are saved to:

```
./.screenshots/<name>-TIMESTAMP.png
```

## Recommended Workflow After UI Changes

1. Start servers (`pnpm dev`)
2. Verify the page manually in browser
3. Run screenshot test
4. Compare with previous screenshot
5. Commit screenshot if needed

## When to Use

- UI layout refactoring
- Tailwind CSS theme changes
- shadcn/ui component updates
- GraphQL + urql rendering updates
- React Hook Form + Zod validation UI changes
- Before merging large UI PRs

## Example Pages to Test

### Admin (port 4022)

- `/event` - イベント一覧
- `/event/[id]` - イベント詳細（要ID）
- `/event/[id]/edit/1` - イベント編集 Step1（要ID）
- `/event/[id]/edit/2` - イベント編集 Step2（要ID）
- `/event/[id]/edit/3` - イベント編集 Step3（要ID）
- `/sales` - 売上管理
- `/favorites` - お気に入り

### Web (port 4021)

- `/` - トップページ
- `/search` - 検索
- `/sign-in` - サインイン
- `/sign-up` - サインアップ
- `/event/[eventId]` - イベント詳細（要ID）
- `/event/[eventId]/apply` - チケット申込（要ID）
- `/event/[eventId]/apply/done` - 申込完了（要ID）
- `/artist/[artistId]` - アーティスト詳細（要ID）
- `/ticket` - チケット一覧
- `/favorite` - お気に入り
- `/account` - アカウント
- `/application` - 申込履歴一覧
- `/application/[applicationId]` - 申込詳細（要ID）

## Notes

- Test account login is automated
- Session is cached for faster repeated runs
- Intended for visual verification (not assertion-based E2E)
- Compatible with Tailwind CSS v4 + shadcn/ui styling
