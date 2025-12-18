
Sabor a Mexico KDS
==================

This folder contains a simple Kitchen Display System:

- FRONT:  front.html  (order taking with your full menu + prices + modifiers)
- KITCHEN: kitchen.html  (chef ACCEPT / DONE / CANCEL, no prices)
- REPORTS: reports.html  (daily summary + CSV export)
- Backend: server.js (Node + Express, stores orders in orders.json)

How to run
----------
1. Install Node.js
2. Open Terminal in this folder and run:

   npm install
   npm start

3. Open browser:

   Front Desk:   http://localhost:5050/front.html
   Kitchen:      http://localhost:5050/kitchen.html
   Reports:      http://localhost:5050/reports.html

Data storage
------------
All orders are stored in orders.json in this same folder.
Do NOT delete this file if you want to keep history.
You can back it up (USB / cloud) whenever you like.

To use from another device on the same Wi-Fi, replace localhost
with the Mac's IP address, e.g.:

   http://192.168.1.218:5050/front.html
