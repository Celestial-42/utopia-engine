#!/bin/sh
# 把 main 分支里的 utopia-engine.html 重新发布到 GitHub Pages（站点源分支 gh-pages）。
# 用法：改完 HTML 并 commit 到 main 之后，运行 ./deploy-pages.sh
set -e
cd "$(dirname "$0")"
branch=$(git rev-parse --abbrev-ref HEAD)
[ "$branch" = "main" ] || { echo "请先切到 main 分支（当前 $branch）"; exit 1; }
git diff --quiet || { echo "工作区有未提交改动，先 commit 再发布（保证线上内容可追溯）"; exit 1; }

BLOB=$(git hash-object -w utopia-engine.html)
EMPTY=$(git hash-object -w /dev/null)
# 同一份文件放两个名字：/ 和 /utopia-engine.html 都能打开
TREE=$(printf '100644 blob %s\tindex.html\n100644 blob %s\tutopia-engine.html\n100644 blob %s\t.nojekyll\n' "$BLOB" "$BLOB" "$EMPTY" | git mktree)
if git rev-parse --verify -q origin/gh-pages >/dev/null; then
  COMMIT=$(git commit-tree "$TREE" -p origin/gh-pages -m "Pages: 发布 main@$(git rev-parse --short main)")
else
  COMMIT=$(git commit-tree "$TREE" -m "Pages: 发布 main@$(git rev-parse --short main)")
fi
git update-ref refs/heads/gh-pages "$COMMIT"
git push origin gh-pages
echo "已发布：https://celestial-42.github.io/utopia-engine/ （构建约需 30-60 秒）"
