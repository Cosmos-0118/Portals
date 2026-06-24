export async function openSideBySide(currentWindowId, targetUrl) {
  // Get current window
  const currentWindow = await chrome.windows.get(currentWindowId);
  
  // Get all displays
  const displays = await chrome.system.display.getInfo();
  
  // Find the display containing the current window based on its center
  let activeDisplay = displays[0];
  const windowCenterX = currentWindow.left + (currentWindow.width / 2);
  const windowCenterY = currentWindow.top + (currentWindow.height / 2);

  for (const display of displays) {
    const { bounds } = display;
    if (
      windowCenterX >= bounds.left &&
      windowCenterX < bounds.left + bounds.width &&
      windowCenterY >= bounds.top &&
      windowCenterY < bounds.top + bounds.height
    ) {
      activeDisplay = display;
      break;
    }
  }

  const { bounds, workArea } = activeDisplay;
  
  // Use workArea if available to avoid overlapping with OS taskbars, fallback to bounds
  const area = workArea || bounds;
  
  // Keep the user's preferred vertical positioning and height unless maximized
  const isMaximized = currentWindow.state === 'maximized' || currentWindow.state === 'fullscreen';
  const targetTop = isMaximized ? area.top : currentWindow.top;
  const targetHeight = isMaximized ? area.height : currentWindow.height;

  // Ideally, both windows keep the current window's width (or half screen if maximized)
  let targetWidth = isMaximized ? Math.floor(area.width / 2) : currentWindow.width;
  
  // But if two of them side-by-side exceed the screen width, cap them to half the screen
  if (targetWidth * 2 > area.width) {
    targetWidth = Math.floor(area.width / 2);
  }

  // Center the two windows together horizontally on the screen
  const totalWidth = targetWidth * 2;
  const startLeft = area.left + Math.floor((area.width - totalWidth) / 2);

  // If the window is maximized or fullscreen, we must change its state to normal FIRST.
  // Otherwise, Chrome will often ignore the positioning arguments.
  if (isMaximized) {
    await chrome.windows.update(currentWindowId, { state: 'normal' });
  }

  // Move and resize the current window to the left
  await chrome.windows.update(currentWindowId, {
    state: 'normal',
    left: startLeft,
    top: targetTop,
    width: targetWidth,
    height: targetHeight
  });

  // Create the new window immediately to its right
  await chrome.windows.create({
    url: targetUrl,
    left: startLeft + targetWidth,
    top: targetTop,
    width: targetWidth,
    height: targetHeight,
    state: 'normal'
  });
}
