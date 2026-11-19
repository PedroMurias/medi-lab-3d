@echo off
chcp 65001 >nul
setlocal
set B=%~dp0..
cd /d "%B%"
echo === Muntatge del video d'obertura ===
if not exist "ffmpeg\bin\ffmpeg.exe" (
  echo Baixant ffmpeg ^(gratuit, uns 150 MB^)...
  curl -L -o ffmpeg.zip https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip
  tar -xf ffmpeg.zip
  for /d %%D in (ffmpeg-master-*) do move "%%D" ffmpeg >nul
  del ffmpeg.zip
)
if not exist "ffmpeg\bin\ffmpeg.exe" ( echo ERROR: no s'ha pogut baixar ffmpeg & pause & exit /b 1 )
echo Muntant... ^(uns minuts^)
"ffmpeg\bin\ffmpeg.exe" -y -hide_banner -loglevel warning -stats ^
 -i muntatge\titol.mp4 ^
 -framerate 24 -i render\03_astronauta\f%%04d.png ^
 -framerate 24 -i render\04_gir360\f%%04d.png ^
 -framerate 24 -i render\05_planetes\f%%04d.png ^
 -framerate 24 -i render\06_foratnegre\f%%04d.png ^
 -framerate 24 -i render\07_galaxia\f%%04d.png ^
 -framerate 24 -i render\08_univers\f%%04d.png ^
 -c:v libvpx-vp9 -i muntatge\hud.webm ^
 -i muntatge\final.mp4 ^
 -filter_complex "[1][2][3][4][5][6]concat=n=6:v=1,setsar=1[s];[s][7]overlay=format=auto:shortest=1[e];[0]setsar=1,fps=24[t];[8]setsar=1,fps=24[f];[t][e][f]concat=n=3:v=1,format=yuv420p[v]" ^
 -map "[v]" -c:v libx264 -preset medium -crf 18 -movflags +faststart obertura_v1.mp4
if exist obertura_v1.mp4 ( echo FET: obertura_v1.mp4 ) else ( echo Alguna cosa ha fallat: mira els missatges de dalt )
pause
