#Requires AutoHotkey v2

; # --- SWITCH DESKTOPS (alt+1...4) ---
!1:: {
    Loop 10 {
        Send("^#{Left}")
    }
}
!2:: {
    Loop 1 {
        Send("^#{Right}")
    }
}
!3:: {
    Loop 2 {
        Send("^#{Right}")
    }
}
!4:: {
    Loop 3 {
        Send("^#{Right}")
    }
}

; # --- OPEN TERMINAL (alt+q) ---
!q:: Run('cmd.exe /k "cd /d %USERPROFILE%"')
; ## WINBASH (ctrl+q)
^q:: Run('cmd.exe /k "%USERPROFILE%\Downloads\winbash\cygwin-portable\cygwin-portable-terminal.cmd" && exit')

; # --- CLOSE WINDOW (alt+c) ---
!c:: WinClose("A")

; # --- OPEN FIREFOX (alt+f) ---
!f:: Run("firefox.exe")


; # --- MOVE WINDOW (alt+left) ---
!LButton:: {
    CoordMode("Mouse", "Screen")
    MouseGetPos(&startX, &startY, &WinID)
    if !WinID
        return
	WinActivate("ahk_id " WinID)
    WinGetPos(&winX, &winY,,, "ahk_id " WinID)

    offsetX := startX - winX
    offsetY := startY - winY
    SetWinDelay(-1)

    ; ## LOOP WHILE HELD
    while GetKeyState("LButton", "P") {
        MouseGetPos(&currentX, &currentY)
        WinMove(currentX - offsetX, currentY - offsetY,,, "ahk_id " WinID)
        Sleep(1)
    }
}

; # --- RESIZE WINDOW (alt+right) ---
!RButton:: {
    CoordMode("Mouse", "Screen")
    MouseGetPos(&startX, &startY, &WinID)
    if !WinID
        return
	WinActivate("ahk_id " WinID)
    WinGetPos(&winX, &winY, &winW, &winH, "ahk_id " WinID)

    relX := startX - winX
    relY := startY - winY

    resizeRight := (relX > winW / 2)
    resizeBottom := (relY > winH / 2)
    SetWinDelay(-1)  ; No delay between window commands
    
    ; ## LOOP WHILE HELD
    while GetKeyState("RButton", "P") {
        MouseGetPos(&currentX, &currentY)
        deltaX := currentX - startX
        deltaY := currentY - startY
        
        newX := winX
        newY := winY
        newW := winW
        newH := winH
        
        if resizeRight {
            newW := winW + deltaX
        } else {
            newX := winX + deltaX
            newW := winW - deltaX
        }
        
        if resizeBottom {
            newH := winH + deltaY
        } else {
            newY := winY + deltaY
            newH := winH - deltaY
        }
        
        if (newW > 100 && newH > 100) {
            WinMove(newX, newY, newW, newH, "ahk_id " WinID)
        }
        Sleep(1)
    }
}
