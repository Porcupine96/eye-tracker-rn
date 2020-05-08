#!/usr/bin/env bash
set -euo pipefail


cd node_modules
echo "In node"
rg androidx.core.util --files-with-matches | xargs -I {} sd -s 'androidx.core.util' 'android.support.v4.util' {}
echo "core.util done"
rg androidx.appcompat.app --files-with-matches | xargs -I {} sd -s 'androidx.appcompat.app' 'android.support.v7.app' {}
echo "compat.app done"
