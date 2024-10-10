# npm version patch
version=`node -e 'console.log(require("./package.json").version)'`
echo "version $version"

# --build-optimizer=false if localstorage is disabled (webview) appears https://github.com/firebase/angularfire/issues/970
ng build --configuration="prod" --aot=true   --build-optimizer=true --vendor-chunk=true
##--base-href='./v5/' --output-hashing none

### SET HASHING : START ###
cp ./src/launch_template.js ./dist/launch.js
node ./src/build_launch.js
### SET HASHING : END ###

#### FIREBASE #####
# cd dist
# # aws s3 sync . s3://tiledesk-widget/v5/latest/
# aws s3 sync . s3://tiledesk-widget/v5/$version/ --cache-control max-age=300
# aws s3 sync . s3://tiledesk-widget/v5/ --cache-control max-age=300
# cd ..

# #### MQTT #####
cd dist
# aws s3 sync . s3://tiledesk-widget/v5/latest/
aws s3 sync . s3://tiledesk-widget/v6/$version/ --cache-control max-age=86400 --exclude='launch.js' #8days
aws s3 sync . s3://tiledesk-widget/v6/$version/ --cache-control "no-store,no-cache,private" --exclude='*' --include='launch.js'
aws s3 sync . s3://tiledesk-widget/v6/ --cache-control max-age=86400 --exclude='launch.js' #8days
aws s3 sync . s3://tiledesk-widget/v6/ --cache-control "no-store,no-cache,private" --exclude='*' --include='launch.js'
cd ..

aws  cloudfront create-invalidation --distribution-id E3EJDWEHY08CZZ --paths "/*"
echo new version deployed $version on s3://tiledesk-widget/v5
echo available on https://s3.eu-west-1.amazonaws.com/tiledesk-widget/v5/index.html
echo https://widget.tiledesk.com/v5/index.html
echo https://widget.tiledesk.com/v5/$version/index.html