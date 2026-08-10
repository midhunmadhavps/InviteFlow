mobile/src
    ├── api/
    │   ├── client.js
    │   └── endpoints.js
    │
    ├── hooks/
    │   ├── useAuth.js
    │   └── useApi.js
    │
    ├── modules/
    │   ├── auth/
    │   │   ├── api/
    │   │   │   └── auth.api.js
    │   │   ├── screens/
    │   │   │   ├── LoginScreen.js
    │   │   │   ├── RegisterScreen.js
    │   │   │   ├── VerifyOtpScreen.js
    │   │   │   ├── SetPasswordScreen.js
    │   │   │   ├── ForgotPasswordScreen.js
    │   │   │   └── ResetPasswordScreen.js
    │   │   ├── components/
    │   │   │   ├── LoginForm.js
    │   │   │   └── AuthInput.js
    │   │   └── auth.service.js
    │   │
    │   ├── events/
    │   │   ├── api/
    │   │   │   └── event.api.js
    │   │   ├── screens/
    │   │   │   ├── EventListScreen.js
    │   │   │   ├── CreateEventScreen.js
    │   │   │   └── EventDetailsScreen.js
    │   │   ├── components/
    │   │   └── event.service.js
    │   │
    │   ├── invitations/
    │   │   ├── api/
    │   │   ├── screens/
    │   │   └── components/
    │   │
    │   ├── schedules/
    │   │   ├── api/
    │   │   ├── screens/
    │   │   └── components/
    │   │
    │   └── templates/
    │       ├── api/
    │       ├── screens/
    │       └── components/
    │
    ├── navigation/
    │   ├── AppNavigator.js
    │   ├── AuthNavigator.js
    │   └── MainNavigator.js
    │
    ├── components/
    │   ├── Button.js
    │   ├── Input.js
    │   └── Loading.js
    │
    ├── utils/
    │   ├── storage.js
    │   └── validation.js
    │
    ├── App.js
    └── package.json

    npx create-expo-app mobile (unwanted files) or npx create-expo-app mobile --template blank
    npm install axios
    npm install @react-navigation/native
    npm install @react-navigation/native @react-navigation/native-stack
    npx expo install react-native-screens react-native-safe-area-context
    npx expo install expo-secure-store
    npx expo install react-dom react-native-web (for load react load on laptop)
    npm start 
    npx expo start