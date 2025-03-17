#!/bin/bash
git add .
git commit -m $argv[1]
git push origin $argv[2]
