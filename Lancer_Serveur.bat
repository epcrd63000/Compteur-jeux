@echo off
echo ====================================================
echo Demarrage du Compteur de Jeux (Mode Multijoueur)
echo ====================================================
echo.
echo Verification de l'environnement...
if not exist "venv" (
    echo Creation de l'environnement virtuel...
    python -m venv venv
    call venv\Scripts\activate
    pip install fastapi uvicorn
) else (
    call venv\Scripts\activate
)

echo.
echo Le serveur est en cours de lancement...
echo ====================================================
echo ADRESSES POUR REJOINDRE LE JEU :
echo ====================================================
echo.
echo  1. Sur ce PC :
echo     http://127.0.0.1:8000
echo.
echo  2. Sur un telephone (doit etre sur le meme Wi-Fi) :
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    set IP=%%a
    goto :found_ip
)
:found_ip
set IP=%IP: =%
echo     http://%IP%:8000
echo     http://%COMPUTERNAME%:8000 (alternative)
echo.
echo ====================================================
echo.
uvicorn server:app --host 0.0.0.0 --port 8000
