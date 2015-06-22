. ~/.nvm/nvm.sh
. ~/.profile
. ~/.bashrc
npm install
forever restart xtend_app
forever restart xtend_queue
forever restart xtend_stat
exit
