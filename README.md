# Scripts

Personal collection of home automation, kiosk, LLM assistant, and utility scripts. Expects to run from `~/scripts`.

## Projects

### MAX - Local LLM Assistant

Voice-controlled LLM with a custom wake word. Listens via mic, responds with synthesized speech.

```bash
bash ~/scripts/max/max
```

**Key files:**
- `max` - Main script
- `max/check-if-home` - Device presence detection (runs in background)
- `max/mic-listener.py` - Mic listener
- `max/model/` - Vosk model files
- `max/s-query` - Spotify query tool

**Requirements:** nodejs, npm, vosk, sounddevice, espeak-ng

---

### KSK - Tmux Kiosk

Dashboard for TV display running in tmux.

```bash
bash ~/scripts/ksk/kak
```

| Module | Description |
|--------|-------------|
| `kak` | Keep-Alive-Kiosk |
| `ksk` | Main tmux scripts |
| `c-playing` | Current Spotify track with ASCII art |
| `s-player` | Spotify controls (play/pause/skip/volume) |
| `mycal` | Calendar events with color coding |
| `cava` | Audio visualizer |
| `tty-clock` | time/date display |
| `bus` | Next bus arrivals with ASCII map |
| `timers` | Countdown timers |
| `gmail` | Unread emails display |

**Requirements:** tmux, playerctl, tty-clock, cava, nodejs, npm

---

### Tuya Control

Smart device control via Tuya API.

```bash
node ~/scripts/tuya-control/remote.js <device> <on|off|status|mode> [white|scene|color]
```

---

### HTML Scripts

Self-hosted `curl|bash` installer scripts served via web server.

```bash
# Setup web server
sudo rm -rf /var/www/html
sudo ln -s ~/scripts/html /var/www/html
```

| Script | Description |
|--------|-------------|
| `bashrc` | Remote bashrc setup |
| `disk` | Disk usage |
| `files` | Lists all system files to use with grep |
| `home_dir_backup` | Backup home dir and send to external host |
| `inodes` | Inode usage count |
| `ns` | Domain/Subdomain/IP scan for DNS records and site status check |
| `space` | (broken) File space usage count |
| `wp-path-fix` | WordPress path/URL replacement |
| `wp-to-zone.ftp` | WordPress FTP migrator |
| `wp-to-zone.ssh` | WordPress SSH migrator |
| `win/*` | Windows utility |

### Windows Scripts

| Script | Description |
|--------|-------------|
| `win/bash` | Git Bash setup (origin: winsyg) |
| `win/fix` | Debloat Windows utility shortcut |
| `win/man.ahk` | Window manager using AutoHotkey |
| `win/rc` | winRC setup file |
| `win/rc.bat` | winRC .bat file for shell:startup |

---

## Other Utilities

| Script | Description |
|--------|-------------|
| `start-audio` | Linux audio sink configuration (combined dual output) |
| `external_ip_check` | Check and update external IP for set domains A-record |
| `toggle-brightness.sh` | Adjust screen brightness |

---

## Bashrc (html/bashrc)

Remote config fetched on shell start (~/.bashrc sources from external web server):

**System:**
- Auto apt update/upgrade
- Auto install set packages
- Sudo permissions check & auto-configure
- Fail2ban auto-configure (sshd, apache-req-limit)
- Crontab setup

**Shell:**
- Color variables & prompt (PS1)
- History config
- Directory colors & aliases
- Bash completion
- Nanorc config

**Desktop:**
- Keyboard layout
- Xbindkeys config
- Firefox profile setup
- GSettings (GTK theme, dark mode)
- Xfce4-terminal default

**Other:**
- MOTD/login message
- Hosts file setup
- Kali Linux (zshrc) handling

---

## Setup

### For LLM and Kiosk:

```bash
sudo apt install \
nodejs npm playerctl tty-clock pipx pipewire-pulse pulseaudio-utils espeak-ng cava tmux \
wireplumber pavucontrol libxml2-utils libportaudio2 libportaudiocpp0 portaudio19-dev
```

```bash
pip install \
sounddevice vosk \
--break-system-packages
```

```
git clone https://github.com/rastapasta/mapscii.git
cd mapscii
npm install
```

> Note: Might need `~/.mapscii/*` and `~/.cache/mapscii-nodejs/*` files from previous machine if migrating.

```
systemctl --user enable --now pipewire pipewire-pulse
```

```
sudo usermod -aG systemd-journal $USER
```

> Note: Relogin to force changes.
