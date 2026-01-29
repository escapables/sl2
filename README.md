<<<<<<< HEAD
# 🚆 Swedish Commute Dashboard

A lightweight web dashboard for finding public transport routes across Sweden using buses, trains, trams, and more.

![Dashboard Preview](https://via.placeholder.com/800x400?text=Swedish+Commute+Dashboard)

## Features

- 🔍 **Location Search**: Search for stations and stops across Sweden
- 📍 **Current Location**: Use your GPS to find nearby stops
- 🚆 **Multi-modal Routes**: Get routes using trains, buses, trams, metro, and more
- ⏰ **Departure Time**: Plan trips for specific dates and times
- 🔑 **Secure API Key Storage**: Key is obfuscated and stored locally in your browser
- 📱 **Mobile-friendly**: Responsive design works on all devices
- ⚡ **Lightweight**: No heavy frameworks, fast loading

## Data Source

This app uses the [ResRobot API](https://www.trafiklab.se/api/our-apis/resrobot-v21/route-planner/) from Trafiklab, which covers all public transport operators in Sweden.

## Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Run the App

```bash
python app.py
```

### 3. Open in Browser

Navigate to: http://localhost:5000

### 4. Enter Your API Key

On first launch, you'll see a modal asking for your Trafiklab API key:

1. Go to [trafiklab.se](https://www.trafiklab.se/) and create a free account
2. Subscribe to the **ResRobot - v2.1** API (Bronze tier is free)
3. Copy your API key and paste it into the dashboard
4. Check "Remember this key" to save it securely in your browser

Your API key is **obfuscated** (not plaintext) and stored in your browser's localStorage. You can change it anytime by clicking the **⚙️ Settings** button.

## Usage

1. **Enter Origin**: Type a station name in the "From" field and select from suggestions
2. **Enter Destination**: Type a station name in the "To" field
3. **Set Time** (optional): Adjust the date and time for your journey
4. **Find Routes**: Click "Find Routes" to see available trips
5. **View Details**: Click on any route card to see detailed leg information

### Tips

- Use the 📍 button to find stops near your current location
- Click ⇅ to swap origin and destination
- Station names are formatted for readability

## Project Structure

```
.
├── app.py              # Flask backend
├── requirements.txt    # Python dependencies
├── README.md          # This file
├── static/
│   ├── style.css      # Styling
│   └── app.js         # Frontend logic (with secure key storage)
└── templates/
    └── index.html     # Main page
```

## API Key Security

The API key is handled securely:

- **Obfuscation**: Keys are obfuscated using XOR + Base64 before storage
- **Local only**: Keys are stored in your browser's localStorage, never on our server
- **Per-request**: Key is sent with each API request via HTTP headers
- **Session option**: You can choose not to remember the key (it will only be stored in memory)

**Note**: Obfuscation is not encryption - it prevents casual snooping but determined attackers with access to your browser could still retrieve it. For shared computers, don't check "Remember this key".

## API Endpoints

The Flask backend proxies requests to protect your API key:

- `GET /api/search?q=<query>` - Search for locations
- `GET /api/nearby?lat=<lat>&lon=<lon>` - Find nearby stops
- `GET /api/route?from=<id>&to=<id>&date=<date>&time=<time>` - Get routes
- `POST /api/validate-key` - Validate an API key

All endpoints require the `X-API-Key` header.

## License

MIT License - feel free to use and modify as needed.

## Credits

- Data provided by [Trafiklab](https://www.trafiklab.se/)
- Uses [ResRobot API](https://www.trafiklab.se/api/our-apis/resrobot-v21/)
=======
# sl2
>>>>>>> 4aa85c945ed217d47d7c0ccecdd8b7abccbf3819
