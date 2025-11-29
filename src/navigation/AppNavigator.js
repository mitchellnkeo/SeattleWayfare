/**
 * App Navigator
 * Sets up React Navigation structure
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import TripPlannerScreen from '../screens/TripPlannerScreen';
import RouteDetailScreen from '../screens/RouteDetailScreen';
import SavedCommutesScreen from '../screens/SavedCommutesScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#1E3A8A',
          },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{
            title: 'Seattle Wayfare',
            headerShown: false, // HomeScreen has its own header
          }}
        />
        <Stack.Screen
          name="TripPlanner"
          component={TripPlannerScreen}
          options={{
            title: 'Plan Trip',
            headerShown: false, // TripPlannerScreen has its own header
          }}
        />
        <Stack.Screen
          name="RouteDetail"
          component={RouteDetailScreen}
          options={{
            title: 'Route Details',
            headerShown: false, // RouteDetailScreen has its own header
          }}
        />
        <Stack.Screen
          name="SavedCommutes"
          component={SavedCommutesScreen}
          options={{
            title: 'Saved Commutes',
            headerShown: false, // SavedCommutesScreen has its own header
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

