@echo off
echo ====================================================
echo Installation du Demarrage Automatique (Arriere-plan)
echo ====================================================
echo.

set "STARTUP_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "VBS_FILE=%STARTUP_DIR%\CompteurJeux_AutoStart.vbs"
set "BAT_PATH=%~dp0Lancer_Serveur.bat"

:: Create the VBScript to run the bat file silently (window hidden, 0)
echo Set WshShell = CreateObject("WScript.Shell") > "%VBS_FILE%"
echo WshShell.Run chr(34) ^& "%BAT_PATH%" ^& Chr(34), 0, False >> "%VBS_FILE%"

echo Succes ! Le serveur demarrera desormais de facon totalement
echo invisible en arriere-plan a chaque demarrage de votre PC.
echo.
echo Vous n'aurez plus jamais besoin de venir sur le PC pour jouer !
echo Il suffira que le PC soit allume pour y acceder depuis votre telephone.
echo.
pause
