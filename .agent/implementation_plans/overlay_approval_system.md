# Overlay Approval System Implementation Plan

## 🎯 Objective
Implement two approval modes for transaction/connection requests:
1. **Full App Switch Mode** (Default): Traditional deep-link flow with app switching
2. **Overlay Modal Mode** (Experimental): Android overlay that appears on top of the dApp

Users can choose their preferred mode via Developer Settings.

---

## 📋 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        dApp (Chrome)                        │
│                  Sends Deep Link Request                    │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Column Wallet (Background Service)             │
│                  Receives Deep Link Intent                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
              ┌──────────┴──────────┐
              │  Check User Setting  │
              └──────────┬──────────┘
                         │
         ┌───────────────┴───────────────┐
         │                               │
         ▼                               ▼
┌────────────────────┐      ┌────────────────────────┐
│  Full App Switch   │      │    Overlay Modal       │
│                    │      │                        │
│ 1. Bring app to    │      │ 1. Show system overlay │
│    foreground      │      │ 2. Display on top of   │
│ 2. Show approval   │      │    current app         │
│    screen          │      │ 3. User approves       │
│ 3. User approves   │      │ 4. Dismiss overlay     │
│ 4. Redirect back   │      │ 5. Send response       │
└────────────────────┘      └────────────────────────┘
```

---

## 🏗️ Phase 1: Developer Settings UI

### 1.1 Create Developer Settings Storage

**File**: `services/DeveloperSettings.ts`

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ApprovalMode = 'full-switch' | 'overlay';

export interface DeveloperSettings {
  approvalMode: ApprovalMode;
  overlayEnabled: boolean;
  trustedDapps: string[]; // Future: whitelist of dApp URLs
  debugMode: boolean;
}

const DEFAULT_SETTINGS: DeveloperSettings = {
  approvalMode: 'full-switch',
  overlayEnabled: false,
  trustedDapps: [],
  debugMode: false,
};

const STORAGE_KEY = '@column_developer_settings';

export class DeveloperSettingsService {
  static async getSettings(): Promise<DeveloperSettings> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
    } catch (error) {
      console.error('Failed to load developer settings:', error);
      return DEFAULT_SETTINGS;
    }
  }

  static async updateSettings(updates: Partial<DeveloperSettings>): Promise<void> {
    try {
      const current = await this.getSettings();
      const updated = { ...current, ...updates };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to update developer settings:', error);
      throw error;
    }
  }

  static async getApprovalMode(): Promise<ApprovalMode> {
    const settings = await this.getSettings();
    return settings.approvalMode;
  }

  static async setApprovalMode(mode: ApprovalMode): Promise<void> {
    await this.updateSettings({ approvalMode: mode });
  }
}
```

### 1.2 Create Developer Settings Screen

**File**: `app/developer-settings.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, ScrollView, Alert } from 'react-native';
import { Stack } from 'expo-router';
import { DeveloperSettingsService, ApprovalMode } from '../services/DeveloperSettings';
import { requestOverlayPermission, checkOverlayPermission } from '../services/OverlayPermissionService';

export default function DeveloperSettingsScreen() {
  const [approvalMode, setApprovalMode] = useState<ApprovalMode>('full-switch');
  const [hasOverlayPermission, setHasOverlayPermission] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await DeveloperSettingsService.getSettings();
      setApprovalMode(settings.approvalMode);
      
      const permission = await checkOverlayPermission();
      setHasOverlayPermission(permission);
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprovalModeChange = async (mode: ApprovalMode) => {
    if (mode === 'overlay' && !hasOverlayPermission) {
      Alert.alert(
        'Permission Required',
        'Overlay mode requires "Display over other apps" permission. Would you like to grant it now?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Grant Permission',
            onPress: async () => {
              const granted = await requestOverlayPermission();
              if (granted) {
                setHasOverlayPermission(true);
                await DeveloperSettingsService.setApprovalMode(mode);
                setApprovalMode(mode);
              } else {
                Alert.alert('Permission Denied', 'Overlay mode requires system overlay permission.');
              }
            },
          },
        ]
      );
      return;
    }

    await DeveloperSettingsService.setApprovalMode(mode);
    setApprovalMode(mode);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Developer Settings', headerShown: true }} />
      
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Transaction Approval Mode</Text>
          <Text style={styles.sectionDescription}>
            Choose how transaction approval requests are displayed
          </Text>

          {/* Full App Switch Option */}
          <View style={styles.option}>
            <View style={styles.optionLeft}>
              <Text style={styles.optionTitle}>Full App Switch</Text>
              <Text style={styles.optionDescription}>
                Traditional mode: Opens wallet app for approval
              </Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>DEFAULT</Text>
              </View>
            </View>
            <Switch
              value={approvalMode === 'full-switch'}
              onValueChange={() => handleApprovalModeChange('full-switch')}
              trackColor={{ false: '#333', true: '#c4ff34' }}
              thumbColor={approvalMode === 'full-switch' ? '#fff' : '#666'}
            />
          </View>

          {/* Overlay Modal Option */}
          <View style={styles.option}>
            <View style={styles.optionLeft}>
              <Text style={styles.optionTitle}>Overlay Modal</Text>
              <Text style={styles.optionDescription}>
                Experimental: Shows approval on top of dApp
              </Text>
              <View style={[styles.badge, styles.badgeExperimental]}>
                <Text style={styles.badgeText}>EXPERIMENTAL</Text>
              </View>
              {!hasOverlayPermission && (
                <Text style={styles.warningText}>⚠️ Requires overlay permission</Text>
              )}
            </View>
            <Switch
              value={approvalMode === 'overlay'}
              onValueChange={() => handleApprovalModeChange('overlay')}
              trackColor={{ false: '#333', true: '#c4ff34' }}
              thumbColor={approvalMode === 'overlay' ? '#fff' : '#666'}
            />
          </View>
        </View>

        {/* Information Section */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>ℹ️ About Approval Modes</Text>
          
          <Text style={styles.infoSubtitle}>Full App Switch:</Text>
          <Text style={styles.infoText}>
            • Most compatible with all Android versions{'\n'}
            • Works on all devices{'\n'}
            • Requires switching between apps
          </Text>

          <Text style={styles.infoSubtitle}>Overlay Modal:</Text>
          <Text style={styles.infoText}>
            • Seamless experience - no app switching{'\n'}
            • Faster approval workflow{'\n'}
            • Requires Android 6.0+ and overlay permission{'\n'}
            • May be affected by battery optimization
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#888',
    marginBottom: 20,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#111',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#222',
  },
  optionLeft: {
    flex: 1,
    marginRight: 12,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 13,
    color: '#888',
    marginBottom: 8,
  },
  badge: {
    backgroundColor: 'rgba(196, 255, 52, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  badgeExperimental: {
    backgroundColor: 'rgba(255, 165, 0, 0.15)',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#c4ff34',
    letterSpacing: 0.5,
  },
  warningText: {
    fontSize: 12,
    color: '#ff9500',
    marginTop: 6,
  },
  infoSection: {
    backgroundColor: '#0a0a0a',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1a1a1a',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  infoSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#c4ff34',
    marginTop: 12,
    marginBottom: 6,
  },
  infoText: {
    fontSize: 13,
    color: '#888',
    lineHeight: 20,
  },
});
```

### 1.3 Add Link to Settings Screen

Update your main settings screen to include a link to Developer Settings:

```typescript
// In your main settings screen
<TouchableOpacity onPress={() => router.push('/developer-settings')}>
  <View style={styles.settingItem}>
    <Text style={styles.settingLabel}>🛠️ Developer Settings</Text>
    <Text style={styles.settingValue}>›</Text>
  </View>
</TouchableOpacity>
```

---

## 🏗️ Phase 2: Overlay Permission Service (Android)

### 2.1 Create Native Module for Overlay Permission

**File**: `android/app/src/main/java/com/column/OverlayPermissionModule.kt`

```kotlin
package com.column

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import com.facebook.react.bridge.*

class OverlayPermissionModule(reactContext: ReactApplicationContext) : 
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "OverlayPermission"

    @ReactMethod
    fun checkPermission(promise: Promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                val hasPermission = Settings.canDrawOverlays(reactApplicationContext)
                promise.resolve(hasPermission)
            } else {
                // Overlay permission not needed on Android < 6.0
                promise.resolve(true)
            }
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun requestPermission(promise: Promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                if (!Settings.canDrawOverlays(reactApplicationContext)) {
                    val intent = Intent(
                        Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                        Uri.parse("package:${reactApplicationContext.packageName}")
                    )
                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    reactApplicationContext.startActivity(intent)
                    
                    // Note: We can't directly get the result, user needs to check manually
                    promise.resolve(false)
                } else {
                    promise.resolve(true)
                }
            } else {
                promise.resolve(true)
            }
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }
}
```

**File**: `android/app/src/main/java/com/column/OverlayPermissionPackage.kt`

```kotlin
package com.column

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class OverlayPermissionPackage : ReactPackage {
    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
        return listOf(OverlayPermissionModule(reactContext))
    }

    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
        return emptyList()
    }
}
```

Register in `MainApplication.kt`:

```kotlin
import com.column.OverlayPermissionPackage

override fun getPackages(): List<ReactPackage> {
    return PackageList(this).packages.apply {
        add(OverlayPermissionPackage())
    }
}
```

### 2.2 Create React Native Service

**File**: `services/OverlayPermissionService.ts`

```typescript
import { NativeModules, Platform } from 'react-native';

const { OverlayPermission } = NativeModules;

export const checkOverlayPermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') {
    return false; // iOS doesn't support system overlays
  }

  try {
    return await OverlayPermission.checkPermission();
  } catch (error) {
    console.error('Failed to check overlay permission:', error);
    return false;
  }
};

export const requestOverlayPermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') {
    return false;
  }

  try {
    await OverlayPermission.requestPermission();
    // Wait a bit for user to grant permission
    await new Promise(resolve => setTimeout(resolve, 1000));
    return await checkOverlayPermission();
  } catch (error) {
    console.error('Failed to request overlay permission:', error);
    return false;
  }
};
```

---

## 🏗️ Phase 3: Overlay Modal Component

### 3.1 Create Overlay Service (Android Native)

**File**: `android/app/src/main/java/com/column/OverlayService.kt`

```kotlin
package com.column

import android.app.Service
import android.content.Intent
import android.graphics.PixelFormat
import android.os.Build
import android.os.IBinder
import android.view.Gravity
import android.view.WindowManager
import android.widget.FrameLayout
import com.facebook.react.ReactInstanceManager
import com.facebook.react.ReactRootView
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule

class OverlayService : Service() {
    private var windowManager: WindowManager? = null
    private var overlayView: FrameLayout? = null
    private var reactRootView: ReactRootView? = null

    companion object {
        const val ACTION_SHOW_APPROVAL = "com.column.SHOW_APPROVAL"
        const val ACTION_HIDE_APPROVAL = "com.column.HIDE_APPROVAL"
        const val EXTRA_REQUEST_DATA = "request_data"
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_SHOW_APPROVAL -> {
                val requestData = intent.getStringExtra(EXTRA_REQUEST_DATA)
                showOverlay(requestData)
            }
            ACTION_HIDE_APPROVAL -> {
                hideOverlay()
            }
        }
        return START_STICKY
    }

    private fun showOverlay(requestData: String?) {
        if (overlayView != null) return // Already showing

        windowManager = getSystemService(WINDOW_SERVICE) as WindowManager

        val layoutFlag = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
        } else {
            @Suppress("DEPRECATION")
            WindowManager.LayoutParams.TYPE_PHONE
        }

        val params = WindowManager.LayoutParams(
            WindowManager.LayoutParams.MATCH_PARENT,
            WindowManager.LayoutParams.MATCH_PARENT,
            layoutFlag,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
            WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN or
            WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
            PixelFormat.TRANSLUCENT
        )

        params.gravity = Gravity.TOP or Gravity.START

        overlayView = FrameLayout(this)
        
        // Create React Root View for the overlay
        reactRootView = ReactRootView(this).apply {
            val initialProps = Arguments.createMap().apply {
                putString("requestData", requestData)
            }
            // You'll need to get ReactInstanceManager from your MainApplication
            // startReactApplication(reactInstanceManager, "OverlayApprovalModal", initialProps)
        }

        overlayView?.addView(reactRootView)
        windowManager?.addView(overlayView, params)
    }

    private fun hideOverlay() {
        overlayView?.let {
            windowManager?.removeView(it)
            overlayView = null
        }
        reactRootView = null
    }

    override fun onDestroy() {
        super.onDestroy()
        hideOverlay()
    }
}
```

### 3.2 Create React Native Overlay Modal

**File**: `components/OverlayApprovalModal.tsx`

```typescript
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  BackHandler,
} from 'react-native';
import { BlurView } from 'expo-blur';

interface OverlayApprovalModalProps {
  requestData: any; // Deep link request data
  onApprove: () => void;
  onReject: () => void;
}

export const OverlayApprovalModal: React.FC<OverlayApprovalModalProps> = ({
  requestData,
  onApprove,
  onReject,
}) => {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  useEffect(() => {
    // Animate in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Handle back button
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      onReject();
      return true;
    });

    return () => backHandler.remove();
  }, []);

  const handleApprove = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 50,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => onApprove());
  };

  const handleReject = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 50,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => onReject());
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <BlurView intensity={80} style={StyleSheet.absoluteFill} tint="dark" />
      
      <Animated.View
        style={[
          styles.modal,
          {
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logo}>COLUMN</Text>
          </View>
          <Text style={styles.title}>Approve Transaction</Text>
          <Text style={styles.subtitle}>{requestData?.appName || 'Unknown dApp'}</Text>
        </View>

        {/* Transaction Details */}
        <View style={styles.details}>
          <DetailRow label="Type" value={requestData?.type || 'Transaction'} />
          <DetailRow label="Network" value={requestData?.network || 'Movement'} />
          {requestData?.amount && (
            <DetailRow label="Amount" value={`${requestData.amount} MOVE`} />
          )}
          {requestData?.recipient && (
            <DetailRow label="To" value={requestData.recipient} mono />
          )}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.rejectBtn} onPress={handleReject}>
            <Text style={styles.rejectText}>Reject</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.approveBtn} onPress={handleApprove}>
            <Text style={styles.approveText}>Approve</Text>
          </TouchableOpacity>
        </View>

        {/* Indicator */}
        <View style={styles.indicator}>
          <View style={styles.indicatorDot} />
          <Text style={styles.indicatorText}>Overlay Mode</Text>
        </View>
      </Animated.View>
    </Animated.View>
  );
};

const DetailRow: React.FC<{ label: string; value: string; mono?: boolean }> = ({
  label,
  value,
  mono,
}) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={[styles.detailValue, mono && styles.monoValue]} numberOfLines={1}>
      {value}
    </Text>
  </View>
);

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  modal: {
    width: width - 40,
    backgroundColor: '#0a0a0a',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#222',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoContainer: {
    backgroundColor: '#c4ff34',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 16,
  },
  logo: {
    fontSize: 16,
    fontWeight: '900',
    color: '#000',
    letterSpacing: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
  },
  details: {
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#888',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
    maxWidth: '60%',
  },
  monoValue: {
    fontFamily: 'monospace',
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  rejectBtn: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
  },
  rejectText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#888',
  },
  approveBtn: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#c4ff34',
    alignItems: 'center',
  },
  approveText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  indicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 8,
  },
  indicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#c4ff34',
  },
  indicatorText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
});
```

---

## 🏗️ Phase 4: Deep Link Handler Integration

### 4.1 Update Deep Link Context

**File**: `context/DeepLinkContext.tsx` (Update existing)

```typescript
import { DeveloperSettingsService } from '../services/DeveloperSettings';
import { showOverlayApproval } from '../services/OverlayService';

// In your deep link handler
const handleDeepLink = async (url: string) => {
  const approvalMode = await DeveloperSettingsService.getApprovalMode();
  
  if (approvalMode === 'overlay') {
    // Show overlay modal
    await showOverlayApproval(parsedRequest);
  } else {
    // Traditional full app switch
    // Navigate to approval screen
    router.push({
      pathname: '/approve-transaction',
      params: { request: JSON.stringify(parsedRequest) },
    });
  }
};
```

### 4.2 Create Overlay Service Bridge

**File**: `services/OverlayService.ts`

```typescript
import { NativeModules, DeviceEventEmitter, Platform } from 'react-native';
import { startActivityAsync } from 'expo-intent-launcher';

export interface ApprovalRequest {
  type: 'connect' | 'transaction' | 'sign';
  appName?: string;
  appUrl?: string;
  network?: string;
  amount?: string;
  recipient?: string;
  payload?: any;
}

export const showOverlayApproval = async (request: ApprovalRequest): Promise<boolean> => {
  if (Platform.OS !== 'android') {
    throw new Error('Overlay mode is only supported on Android');
  }

  return new Promise((resolve) => {
    // Start overlay service
    const { OverlayService } = NativeModules;
    
    OverlayService.showApproval(JSON.stringify(request));

    // Listen for approval/rejection
    const approveListener = DeviceEventEmitter.addListener('overlay_approved', () => {
      approveListener.remove();
      rejectListener.remove();
      resolve(true);
    });

    const rejectListener = DeviceEventEmitter.addListener('overlay_rejected', () => {
      approveListener.remove();
      rejectListener.remove();
      resolve(false);
    });
  });
};
```

---

## 🏗️ Phase 5: Testing & Refinement

### 5.1 Testing Checklist

- [ ] Developer Settings UI displays correctly
- [ ] Approval mode toggle works
- [ ] Overlay permission request works
- [ ] Full app switch mode works (existing functionality)
- [ ] Overlay modal appears on top of Chrome
- [ ] Overlay modal displays transaction details correctly
- [ ] Approve button works and sends response
- [ ] Reject button works and sends response
- [ ] Back button dismisses overlay
- [ ] Overlay dismisses after approval/rejection
- [ ] Works with different Android versions (6.0+)
- [ ] Battery optimization doesn't kill overlay service
- [ ] Multiple overlays don't stack

### 5.2 Edge Cases to Handle

1. **Permission Revoked**: Check permission before showing overlay
2. **Battery Optimization**: Warn users if battery optimization might affect overlay
3. **Multiple Requests**: Queue requests if multiple come in
4. **App Killed**: Handle case where wallet app is killed while overlay is showing
5. **Network Changes**: Handle network switching during overlay display

---

## 📊 Implementation Priority

### High Priority (MVP)
1. ✅ Developer Settings UI
2. ✅ Approval mode toggle
3. ✅ Overlay permission handling
4. ✅ Basic overlay modal display
5. ✅ Full app switch mode (ensure it still works)

### Medium Priority
6. ✅ Overlay modal styling and animations
7. ✅ Transaction detail parsing and display
8. ✅ Proper response handling
9. ✅ Error handling and fallbacks

### Low Priority (Future Enhancements)
10. Trusted dApps whitelist
11. Auto-approve for trusted dApps
12. Overlay customization options
13. Analytics for mode usage
14. iOS alternative (notification-based?)

---

## 🔒 Security Considerations

1. **Overlay Spoofing**: Ensure overlay can't be spoofed by malicious apps
   - Use signature verification
   - Display Column branding prominently
   - Show lock icon and security indicators

2. **Permission Abuse**: Educate users about overlay permission
   - Clear explanation in settings
   - Warning about potential misuse by other apps

3. **Data Exposure**: Ensure sensitive data isn't logged
   - Redact private keys in logs
   - Encrypt request data in transit

4. **Background Service**: Ensure service can't be hijacked
   - Use foreground service with notification
   - Implement proper authentication

---

## 📝 User Documentation

Create help text explaining:
- What each mode does
- When to use overlay mode
- How to grant overlay permission
- Troubleshooting common issues
- How to switch back to full app mode

---

## 🎯 Success Metrics

- User adoption rate of overlay mode
- Time saved per transaction (overlay vs full switch)
- User satisfaction scores
- Bug reports and crash rates
- Battery impact measurements

---

## 🚀 Rollout Plan

1. **Alpha**: Internal testing with developers
2. **Beta**: Limited release to power users via Developer Settings
3. **Stable**: Promote to general users if metrics are positive
4. **Default**: Consider making overlay mode default if adoption is high

---

This implementation plan provides a complete roadmap for building the dual approval mode system. Start with Phase 1 (Developer Settings) and progressively build out the overlay functionality!
