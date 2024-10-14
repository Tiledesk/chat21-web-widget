# npm version prerelease --preid=beta
version=`node -e 'console.log(require("./package.json").version)'`
echo "version $version"

ng build --configuration="pre" --aot=true --base-href --build-optimizer=true


# ########## --->>>> NATIVE-MQTT folder START <<<<<------ ########## #

# cd dist
# aws s3 sync . s3://tiledesk-widget-pre/native-mqtt/widget/$version/
# aws s3 sync . s3://tiledesk-widget-pre/native-mqtt/widget/
# cd ..

# #aws  cloudfront create-invalidation --distribution-id E3EJDWEHY08CZZ --paths "/*"
# # echo new version deployed $NEW_VER/$NEW_BUILD/ on s3://tiledesk-widget-pre/v2
# echo new version deployed $version/ on s3://tiledesk-widget-pre/native-mqtt/widget/ and s3://tiledesk-widget-pre/native-mqtt/widget/$version/
# echo available on https://s3.eu-west-1.amazonaws.com/tiledesk-widget-pre/native-mqtt/widget/index.html
# echo https://widget-pre.tiledesk.com/v5/index.html
# echo https://widget-pre.tiledesk.com/v5/$version/index.html

# ########## --->>>> NATIVE-MQTT folder END <<<<<------ ########## #


# ########## --->>>> FIREBASE folder START <<<<<------ ########## #
cd dist
aws s3 sync . s3://tiledesk-widget-pre/v5/$version/ --cache-control max-age=300
aws s3 sync . s3://tiledesk-widget-pre/v5/ --cache-control max-age=300
cd ..

#aws  cloudfront create-invalidation --distribution-id E3EJDWEHY08CZZ --paths "/*"
cd ..

aws  cloudfront create-invalidation --distribution-id E2V5O0YPR61V8P --paths "/*"
# echo new version deployed $NEW_VER/$NEW_BUILD/ on s3://tiledesk-widget-pre/v2
echo new version deployed $version/ on s3://tiledesk-widget-pre/v5 and s3://tiledesk-widget-pre/v5/$version/
echo available on https://s3.eu-west-1.amazonaws.com/tiledesk-widget-pre/v5/index.html
echo https://widget-pre.tiledesk.com/v5/index.html
echo https://widget-pre.tiledesk.com/v5/$version/index.html

# ########## --->>>> FIREBASE folder END <<<<<------ ########## #

## AZIONI per committare: 
## 1) modificare package.json e package-lock.json aggiungendo il num di versione nuovo
## 2) aggiornare il CHANGELOG
## 3) fare il commit tramite sourcetree
## 4) da terminale richiamare ./deploy_pre.sh