@echo off
echo Converting WAV files to MP3 for web optimization...

REM Create mp3 directory if it doesn't exist
if not exist "sounds\mp3" mkdir "sounds\mp3"

REM Convert WAV files to MP3 with optimization for web
REM Using 128kbps bitrate for good quality/size balance
ffmpeg -i "sounds\correct.wav" -codec:a libmp3lame -b:a 128k "sounds\correct.mp3"
ffmpeg -i "sounds\game-over.wav" -codec:a libmp3lame -b:a 128k "sounds\game-over.mp3"
ffmpeg -i "sounds\high-score.wav" -codec:a libmp3lame -b:a 128k "sounds\high-score.mp3"
ffmpeg -i "sounds\start-game.wav" -codec:a libmp3lame -b:a 128k "sounds\start-game.mp3"
ffmpeg -i "sounds\toggle-off.wav" -codec:a libmp3lame -b:a 128k "sounds\toggle-off.mp3"
ffmpeg -i "sounds\toggle-on.wav" -codec:a libmp3lame -b:a 128k "sounds\toggle-on.mp3"

REM Remove the duplicate new-round.wav (identical to start-game.wav)
echo Removing duplicate new-round.wav file...
if exist "sounds\new-round.wav" del "sounds\new-round.wav"

echo Conversion complete!
echo Original WAV files: ~636KB
echo Optimized MP3 files: ~150-200KB (estimated 70% reduction)
echo.
echo Next steps:
echo 1. Run this script to convert files
echo 2. The code has been updated to use MP3 files
echo 3. Test the game to ensure sounds work properly
pause
