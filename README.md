# OA Coder

OA Coder is an Electron application that captures screenshots and leverages the Gemini API to analyze them. It can solve questions, generate code, or provide detailed answers based on screenshots. The app supports both single screenshot processing and multi-page mode for capturing multiple images before analysis.
<br/>
Original repo: https://github.com/archangel0x01/oa-coder
<br/>
I have made my own changes and reuploaded here 

## Features

- **Screenshot Capture:** Use global keyboard shortcuts to capture the screen.
- **Gemini Integration:** Send captured screenshots to Gemini's chat API for automated analysis.
- **Multi-Page Mode:** Combine multiple screenshots for questions spanning several pages.
- **Customizable UI:** Transparent, always-on-top window with an instruction banner and markdown-rendered responses.
- **Global Shortcuts:** Easily control the application using keyboard shortcuts.

## Prerequisites

- [Node.js](https://nodejs.org/) (v14 or later recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- An Gemini API key

## Installation

1. **Clone the repository:**

   ```
   git clone https://github.com/paras-verma7454/OA-coder.git
   cd OA-coder
   ```
2. **Install the dependencies:**
   ```
   npm install
   ```
3. **Configure the application:**
   Create a config.json file in the project root with your OpenAI API key and (optionally) your desired model. For example:
    ```
    {
      "apiKey": "YOUR_GEMINI_API_KEY",
      "model": "gemini-2.5-flash"
    }
    ```
  - Note: If the model field is omitted, the application defaults to "gemini-2.5-flash".


## Usage

1. **Start the Application:**
    Run the following command to launch OA Coder:
    ```
    npm start
    ```
2. **Global Keyboard Shortcuts:**

    - Ctrl+Shift+S: Capture a screenshot and process it immediately. In multi-page mode, this shortcut finalizes the session and sends all captured screenshots for processing.
    - Ctrl+Shift+A: Capture an additional screenshot in multi-page mode. The instruction banner will remind you of the mode and available shortcuts.
    - Ctrl+Shift+R: Reset the current process, clearing all captured screenshots and any displayed results.
    - Ctrl+Shift+Q: Close the running process, clearing all captured screenshot.
    - Ctrl+arrowkeys: Move window


## Status

This program is still under development. Some features may not be fully implemented, and there might be bugs or incomplete functionality. Your feedback and contributions are welcome as we work towards a more stable release.


**Personal Thoughts**: Inspired by interviewcoder.co but didn't like the idea of gatekeeping **cheating** softwares behind paywalls. Like you're literally cheating wtf man? And this might help incompetent software engineers join the company and eat it from the inside forcing companies to realise that Leetcode isn't the only way people should get hired and there are other alternative ways to assess a candidate's abilities.
"# OA-coder" 
