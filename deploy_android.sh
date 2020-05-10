#!/usr/bin/env bash
set -euo pipefail

OPENCV_RN_DIR=/home/owner/git/studia/react-native-opencv3
CAMERA_PATH="android/src/main/java/com/adamfreeman/rnocv3/CvCameraView.java"
NM_FILE=node_modules/react-native-opencv3/$CAMERA_PATH

printHelp() {
	echo "link|copy|reverse"
}

if [ $# -lt 1 ]; then
	printHelp
	exit 1
fi

case $1 in
# link)
# 	test -f $NM_FILE.bak || cp $NM_FILE $NM_FILE.bak
# 	ln -sfT $OPENCV_RN_DIR/$CAMERA_PATH $NM_FILE
# 	;;
copy)
	test -f $NM_FILE.bak || cp $NM_FILE $NM_FILE.bak
	cp $OPENCV_RN_DIR/$CAMERA_PATH $NM_FILE
	;;
reverse)
	echo "Recovering original java file"
	mv $NM_FILE.bak $NM_FILE
	;;
*)
	printHelp
	;;
esac
