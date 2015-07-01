. ~/.nvm/nvm.sh
. ~/.profile
. ~/.bashrc
npm install
if [ ! -f ./config/config.js ]; then
    cp ./sample_config.js ./config/config.js
    echo "Make sure to change the settings in ./config/config.js or set the environment variables as listed in that file."
fi
forever restart xtend_app
forever restart xtend_queue
forever restart xtend_stat
exit
