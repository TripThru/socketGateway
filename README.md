TripThru websocket gateway
=============

Setup on Linux

    apt-get install git
    apt-get install nodejs
    apt-get install npm
    apt-get install node-legacy
    npm install -g node-gyp
    apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 7F0CEB10
    echo 'deb http://downloads-distro.mongodb.org/repo/ubuntu-upstart dist 10gen' | sudo tee /etc/apt/sources.list.d/mongodb.list
    apt-get update
    apt-get install -y mongodb-org

    cd ~/dev
    git clone https://github.com/TripThru/socketGateway.git
    cd socketGateway
    npm install
    npm install -g grunt

To run tests

    service mongod start
    cd socketGateway
    grunt 
    
