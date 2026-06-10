!macro customInstall
  CreateShortcut "$DESKTOP\Nexus Forge.lnk" "$INSTDIR\Nexus Forge.exe" "" "$INSTDIR\Nexus Forge.exe" 0
!macroend

!macro customUnInstall
  Delete "$DESKTOP\Nexus Forge.lnk"
!macroend