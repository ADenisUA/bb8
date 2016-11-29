# bb8
Experiments with Sphero BB-8 NodeJS based SDK

Requires: a laptop with bluetooth, https://github.com/orbotix/sphero.js

After launching the server, connect to localhost:3000

It shows web page where you can select what BB-8 to connect (if you don't see it in the dropdown - press "Update")
After selecting BB-8 from the list click "Connect".
When the status displays "Connected" (instead of default "Disconnected") you can ask him to find your laptop (by using BT signal strength). BB-8 moves in steps, basically rolling for 30-100 cm, and then stopping to analisyse changes in the signal strength (identify it's position in regards to the laptop).

On the web page you can see two canvases, where we draw:
1) the path of BB-8
2) directions

Each line has either green, red, blue or yellow color:
Green - means that BB-8 feels that it comes closer to the laptop. Next time BB
Red - means that goes away from the laptop. Next time BB-8 will try to roll in the opposite direction.
Grey (Yellow or Blue glow of BB-8) - means no any significant changes in BT signal strength, so BB-8 needs to change it's direction (+/-90 degress).

Note: BT signal strenght is not very reliable source of direction to the laptop, so BB-8 needs some time (iterations) to find it's way.

