const { app, BrowserWindow, globalShortcut, ipcMain } = require('electron');
const path = require('path');
const screenshot = require('screenshot-desktop');
const fs = require('fs');
const { GoogleGenAI } = require('@google/genai');



let config;
try {
  const configPath = path.join(__dirname, 'config.json');
  const configData = fs.readFileSync(configPath, 'utf8');
  config = JSON.parse(configData);
  
  if (!config.apiKey) {
    throw new Error("API key is missing in config.json");
  }
  
  // Set default model if not specified
  if (!config.model) {
    config.model = "gemini-2.5-flash";
    console.log("Model not specified in config, using default:", config.model);
  }
} catch (err) {
  console.error("Error reading config:", err);
  app.quit();
}


const ai = new GoogleGenAI({ apiKey: config.apiKey });
let mainWindow;
let screenshots = [];
let multiPageMode = false;
let showWindow = true;
let stage = 0; // 0 = boot up stage, 1 = multi capture, 2 = AI Answered
let responseType = 'both';
ipcMain.on('set-response-type', (event, type) => {
  responseType = type;
});

function updateInstruction(instruction) {
  if (mainWindow?.webContents) {
    mainWindow.webContents.send('update-instruction', instruction);
  }
}

function hideInstruction() {
  if (mainWindow?.webContents) {
    mainWindow.webContents.send('hide-instruction');
  }
}

async function captureScreenshot() {
  try {
    hideInstruction();
    mainWindow.hide();
    await new Promise(res => setTimeout(res, 200));

    const timestamp = Date.now();
    const dsaDir = path.join(app.getPath('pictures'), 'DSA');
    if (!fs.existsSync(dsaDir)) {
      fs.mkdirSync(dsaDir, { recursive: true });
    }
    for (const img of screenshots) {
      const filePath = path.join(app.getPath('pictures'), 'DSA', `screenshot_*.png`);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    const imagePath = path.join(dsaDir, `screenshot_${timestamp}.png`);
    await screenshot({ filename: imagePath });

    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');

    mainWindow.show();
    return base64Image;
  } catch (err) {
    mainWindow.show();
    if (mainWindow.webContents) {
      mainWindow.webContents.send('error', err.message);
    }
    throw err;
  }
}

function showMainWindow() {
  mainWindow.show();
  if (stage == 2)
    mainWindow.webContents.send('show-app');
  else
    updateInstruction();
  showWindow = true;
}

function hideMainWindow() {
  mainWindow.webContents.send('hide-app');
  mainWindow.hide();
  showWindow = false;
}

async function processScreenshots() {
  try {
    let prompt;
    if (responseType === 'code') {
      prompt = "This is a data structures and algorithms (DSA) question. Please provide only the final code (C++) and use #include <bits/stdc++.h> and using namespace std;. Do not include any explanation and comments, just the code.";
    } else if (responseType === 'explanation') {
      prompt = "This is a data structures and algorithms (DSA) question. Please provide only the explanation and approach, including time and space complexity like you would explain to an interviewer, but do not include any code.";
    } else {
      prompt = "This is a data structures and algorithms (DSA) question. Please provide a detailed solution, including the final code (C++) and use #include <bits/stdc++.h> and using namespace std;, and the time and space complexity but don't explain the time and space complexity in the code. If possible, include comments in the code and a concise summary of the approach.";
    }

    // Format image parts
    const imageParts = screenshots.map(img => ({
      inlineData: {
        mimeType: "image/png",
        data: img,
      }
    }));

    // Use generateContent from @google/genai
    const response = await ai.models.generateContent({
      model: config.model,
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            ...imageParts
          ]
        }
      ]
    });

    // Get result text
    const resultText = response.text || 'No response from Gemini.';
    mainWindow.webContents.send('analysis-result', resultText);
    stage = 2;

  } catch (err) {
    console.error("Error in processScreenshots:", err);
    if (mainWindow.webContents) {
      mainWindow.webContents.send('error', err.message);
    }
  }
}

// Reset everything
function resetProcess() {
  screenshots = [];
  multiPageMode = false;
  mainWindow.webContents.send('clear-result');
  updateInstruction("Ctrl+Shift+S: Screenshot | Ctrl+Shift+A: Multi-mode | Ctrl+Shift+W: Hide Window | Ctrl+Shift+Q: Close");
  stage = 0;
}

function createWindow() {
  stage = 0;
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    paintWhenInitiallyHidden: true,
    contentProtection: true,
    type: 'toolbar',
  });

  mainWindow.loadFile('index.html');
  mainWindow.setContentProtection(true);
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  mainWindow.setAlwaysOnTop(true, 'screen-saver', 1);

  // Ctrl+Shift+S => single or final screenshot
  globalShortcut.register('CommandOrControl+Shift+S', async () => {
    try {
      // Ask renderer for response type
      if (mainWindow && mainWindow.webContents) {
        responseType = await mainWindow.webContents.executeJavaScript('window.getResponseType && window.getResponseType()');
      }
      const img = await captureScreenshot();
      screenshots.push(img);
      await processScreenshots();
    } catch (error) {
      console.error("Ctrl+Shift+S error:", error);
    }
  });

  // Ctrl+Shift+A => multi-page mode
  globalShortcut.register('CommandOrControl+Shift+A', async () => {
    try {
      if (!multiPageMode) {
        multiPageMode = true;
        updateInstruction("Multi-mode: Ctrl+Shift+A to add, Ctrl+Shift+S to finalize");
      }
      const img = await captureScreenshot();
      screenshots.push(img);
      updateInstruction("Multi-mode: Ctrl+Shift+A to add, Ctrl+Shift+S to finalize");
      stage = 1;
    } catch (error) {
      console.error("Ctrl+Shift+A error:", error);
    }
  });

  // Ctrl+Shift+R => reset
  globalShortcut.register('CommandOrControl+Shift+R', () => {
    resetProcess();
  });

  // Ctrl+Shift+W => Hide app
  globalShortcut.register('CommandOrControl+Shift+W', () => {
    if (showWindow)
    {
      hideMainWindow();
    }
    else
    {
      showMainWindow();
    }
  });
     
  // Ctrl+Shift+Q => Quit the application
  globalShortcut.register('CommandOrControl+Shift+Q', () => {
    console.log("Quitting application...");
  
    // Unregister all shortcuts
    globalShortcut.unregisterAll();
  
    // Destroy window if exists
    if (mainWindow) {
      mainWindow.destroy();
    }
  
    // Give it a moment to release handles (screenshot, fs, etc.)
    setTimeout(() => {
      app.quit(); // Ensures all Electron processes exit
      process.exit(0); // Force shutdown if anything remains
    }, 100);
  });
  

  // Ctrl+Arrow keys => Move window
  globalShortcut.register('CommandOrControl+Left', () => {
    if (mainWindow) {
      const [x, y] = mainWindow.getPosition();
      mainWindow.setPosition(x - 20, y);
    }
  });
  globalShortcut.register('CommandOrControl+Right', () => {
    if (mainWindow) {
      const [x, y] = mainWindow.getPosition();
      mainWindow.setPosition(x + 20, y);
    }
  });
  globalShortcut.register('CommandOrControl+Up', () => {
    if (mainWindow) {
      const [x, y] = mainWindow.getPosition();
      mainWindow.setPosition(x, y - 20);
    }
  });
  globalShortcut.register('CommandOrControl+Down', () => {
    if (mainWindow) {
      const [x, y] = mainWindow.getPosition();
      mainWindow.setPosition(x, y + 20);
    }
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  globalShortcut.unregisterAll();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
