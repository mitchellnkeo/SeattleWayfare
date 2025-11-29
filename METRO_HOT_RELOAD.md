# Metro Bundler & Hot Reloading

## What is Metro?

**Metro** is the JavaScript bundler that comes built-in with Expo and React Native. It's already running when you use `npm start` - you don't need to install it separately!

## Real-Time Updates

Metro automatically provides **Fast Refresh** (hot reloading) when you:
1. Run `npm start` or `expo start`
2. Open the app in Expo Go or iOS/Android simulator
3. Make changes to your code

### How It Works

- **Save a file** → Metro detects the change
- **Rebundles** → Only the changed code
- **Hot reloads** → Updates the app instantly (usually < 1 second)

### What Gets Hot Reloaded

✅ **Component code** - React components update instantly  
✅ **Styles** - StyleSheet changes apply immediately  
✅ **Business logic** - Functions, utilities, services  
✅ **State** - Component state is preserved during reload  

### What Doesn't Hot Reload

❌ **Native code changes** - Requires app restart  
❌ **New dependencies** - Requires restart  
❌ **app.json changes** - Requires restart  
❌ **Babel config** - Requires restart  

## Using Hot Reload

1. **Start the dev server:**
   ```bash
   npm start
   ```

2. **Open in simulator:**
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app

3. **Make changes:**
   - Edit any `.js` or `.jsx` file
   - Save the file
   - Watch it update instantly! 🎉

## Tips

- **Keep the terminal open** - Metro shows compilation status
- **Check for errors** - Red screen = syntax error (fix it to continue)
- **Yellow warnings** - Usually safe to ignore during development
- **Full reload** - Press `r` in the terminal or shake device → "Reload"

## Current Setup

Your app is already configured for hot reloading! Just:
1. Run `npm start`
2. Open in simulator
3. Edit `App.js` or any component
4. See changes instantly

The test interface in `App.js` will update in real-time as you modify the GTFS service or any other code.

