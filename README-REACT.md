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

    npx create-expo-app
    npm install axios
    npm install @react-navigation/native
    npx expo install react-native-screens react-native-safe-area-context
    npm install @react-navigation/native-stack
    npx expo install expo-secure-store