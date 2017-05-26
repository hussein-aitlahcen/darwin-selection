#!/bin/bash

echo "Clearing output file"
rm output/openquizz.csv
rm converted/*

echo "Building new file"
cd input
for f in *.csv
do
    iconv -f windows-1252 -t utf-8 $f > ../converted/$f
done

cd ../converted
for f in *.csv 
do 
    cat $f >> ../output/openquizz.csv
    echo "" >> ../output/openquizz.csv
done

echo "Populating db"
cd ..
mongo populate.js