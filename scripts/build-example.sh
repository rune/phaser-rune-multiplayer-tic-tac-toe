perl -pe 's/multiplayer\.js/multiplayer-dev\.js/' ./dist/index.html > ./dist/temp.html
cp ./dist/temp.html ./dist/index.html
rm ./dist/temp.html