@echo off
echo Starting the game server...
python -m http.server 8000 --bind 0.0.0.0
echo Server started! You can access the game at:
echo http://localhost:8000
echo http://192.168.1.150:8000 (for other devices on your network)
pause
