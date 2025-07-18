# Wettit

Wettit is a locally-hosted NSFW Reddit media viewer and manager. Browse, search, and organize Reddit images/videos with a sleek, modern UI, fast local backend, and zero cloud bullshit. No user tracking, just pure, unfiltered content straight from your favorite subreddits.

---

## Features

- 🖼️ **NSFW Reddit media gallery**: Fetch, filter, and display images & videos from any subreddit.
- ⚡ **Local-first**: All processing done on your machine. No external servers.
- 🕹️ **Fast, smooth UI**: Responsive web interface for easy navigation.
- 🔍 **Subreddit search & categorization**: Organize your media by subreddit or keyword.
- 📥 **Batch download**: Quickly pull down media for offline viewing.
- 🔒 **Private by default**: No analytics, no tracking, no logs sent anywhere.
- 🎛️ **Custom settings**: Adjust workflow, appearance, favorites, and more.
- 🤖 **Extensible backend**: Written in Python for easy mods/hacks.

---

## Requirements

- Python 3.8+ (recommend 3.10+)
- `pip`
- Node.js + npm (for frontend dev, optional)

---

## Installation

```bash
git clone https://github.com/babydjac/Wettit.git
cd Wettit/wettit
pip install -r requirements.txt
Usage
1. Run Backend (Python)
bash
Copy
Edit
python wettit_backend.py
The backend will start a local server (default: localhost:5000).

Make sure to check wettit_backend.py for port and API settings.

2. Open the Frontend
Open index.html in your browser (in js/ directory), or if served, navigate to the appropriate local URL.

Connect frontend to backend via settings.

Folder Structure
bash
Copy
Edit
wettit/
│
├── wettit_backend.py         # Python backend server
├── requirements.txt          # Backend Python dependencies
├── wettit_load_image.py      # Image fetching/loading utilities
├── wettit_load_video.py      # Video fetching/loading utilities
├── js/                       # Frontend JavaScript code
│   ├── index.js
│   ├── fetch.js
│   ├── style.js
│   ├── subreddits.js
│   ├── reddit_ui.js
│   ├── login.js
│   └── ...
└── __init__.py
Configuration
Set Reddit API credentials or keys inside the backend or via environment variables as needed.

Change server port, storage directory, and UI preferences in the settings menu or config files.

Contributing
Pull requests, issues, and suggestions welcome. Fork, hack, and submit PRs.

License
MIT (or specify)

Credits
Inspired by endless nights lost on r/nsfw and r/gonewild.

Built with Python, JavaScript, sweat, and lube.

Wettit: Because browsing Reddit should always leave you a little wet.
