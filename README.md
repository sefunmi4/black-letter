# black-letter

## Google OAuth Setup

1. Install dependencies:

    ```bash
    npm install
    ```

2. Create a Google OAuth Client ID and configure it for the app.
   - Copy the Client ID.
   - Create a `.env` file in the project root with:

     ```env
     VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id
     ```

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Visit `http://localhost:5173/login` to test the custom Google login.

