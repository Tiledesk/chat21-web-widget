# npm version prerelease --preid=beta
version=`node -e 'console.log(require("./package.json").version)'`
echo "version $version"
echo "____________WIDGET-V5______________"
echo "CREATING TAG ON GIT FOR version: $version"


# Get curent branch name
current_branch=$(git rev-parse --abbrev-ref HEAD)
remote_name=$(git config --get branch.$current_branch.remote)

## Push commit to git
git add .
git commit -m "version added: ### $version"
git push "$remote_name" "$current_branch"


# Get curent branch name
current_branch=$(git rev-parse --abbrev-ref HEAD)
remote_name=$(git config --get branch.$current_branch.remote)

## Push commit to git
git add .
git commit -m "version added: ### $version"
git push "$remote_name" "$current_branch"

if [ "$version" != "" ]; then
    git tag -a "$version" -m "`git log -1 --format=%s`"
    echo "Created a new tag, $version"
    git push --tags
    npm publish
fi