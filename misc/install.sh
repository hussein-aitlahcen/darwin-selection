#!/bin/bash

echo "Clearing output file"
rm output/openquizz.csv

echo "Building new file"
for f in input/*.csv
do
    iconv -f windows -f utf-8 $f >> output/openquizz.csv
done

echo "Populating db"
mongo populate.js