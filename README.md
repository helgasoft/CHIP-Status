CHIP Monitoring Panel
=====================

CHIP monitoring panel based on Node.js to check temperature, memory status (free, cached, buffered, total), CPU load and top tasks. 
Adapted for the [CHIP](http://getchip.com/pages/chip "CHIP") from the original Raspberry Pi source code.

# Author

This project has been developed by [Mario Pérez Esteso](http://github.com/marioperezesteso "Mario Pérez Esteso").

#### Contributors

* [Bernat Borrás Paronella](http://github.com/alorma "Bernat Borrás Paronella")
* [Helgasoft](http://www.helgasoft.com "Helgasoft")

# Screenshot
![CHIP Monitoring Panel](https://raw.githubusercontent.com/helgasoft/CHIP-Status/master/chip-status.png "CHIP Monitoring Panel")

# How to install

**Install software**
~~~
sudo apt-get update
sudo apt-get upgrade
sudo apt-get install nodejs npm git
git clone https://github.com/helgasoft/CHIP-Status.git
~~~
**Install web pages/modules**
~~~
mkdir /var/www/html/chip	# create your web folder for the application, could be anywhere
cd CHIP-Status			# your Git folder
shopt -s extglob		# enable name exclusion
cp !(*git*) /var/www/html/chip/	# copy non-Git files from Git folder to web folder
cd /var/www/html/chip
npm install socket.io   	# will create a subfolder "node_modules"
~~~
**Run**
~~~
sudo DEBUG=-* nodejs server.js	# run without debugging
~~~
**Result:**

Open a browser with your CHIP's IP on port 8000. For example: [http://192.168.1.100:8000](http://192.168.1.100:8000)
~~~
**Run as a service (optional)**
~~~
sudo adduser chip i2c		# take care of permissions
nano /var/www/html/chip/ChipStatusApp.service		# edit ExecStart and WorkingDirectory with your path
mv /var/www/html/chip/ChipStatusApp.service /etc/systemd/system/		# move to services folder
systemctl daemon-reload		
systemctl start ChipStatusApp
systemctl status ChipStatusApp.service	# to confirm service is running


# License
~~~~~~
Copyright 2014 GeekyTheory (Mario Pérez Esteso)

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
~~~~~~~

# More info

For more details, please visit: [Geeky Theory](http://geekytheory.com/panel-de-monitorizacion-para-raspberry-pi-con-node-js/ "Geeky Theory")
