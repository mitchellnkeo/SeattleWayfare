# OneBusAway API Key Setup

## Getting Your API Key

1. **Email Request:**
   - Send email to: **oba_api_key@soundtransit.org**
   - Include:
     - Your name
     - Your email
     - Acknowledgment of Terms of Use
   - Processing time: ~2 business days

2. **Set Your API Key:**

   **Option A: Direct in Code (Development Only)**
   - Open `src/config/env.js`
   - Replace the empty string with your key:
   ```javascript
   const OBA_API_KEY_FROM_ENV = 'your_actual_api_key_here';
   ```
   - ⚠️ **DO NOT COMMIT THIS FILE WITH YOUR REAL KEY**

   **Option B: Environment Variable (Recommended)**
   - Install react-native-dotenv: `npm install react-native-dotenv`
   - Create `.env` file in project root
   - Add: `OBA_API_KEY=your_actual_api_key_here`
   - Add `.env` to `.gitignore` (already done)

## Testing Without API Key

The service will work but show warnings. You can:
- Test the service structure
- See error messages
- Verify the code works (once you add a key)

## Security Notes

- Never commit API keys to git
- Use environment variables for production
- The `.env` file is already in `.gitignore`
- For development, you can set it directly in `env.js` but be careful not to commit it

