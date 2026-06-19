import {
  type BarcodeScanningResult,
  CameraView,
  useCameraPermissions,
} from 'expo-camera';
import { X } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from '@repo/i18n';
import { extractTotpSecret } from '@/lib/totp';
import { Colors } from '@/theme/colors';
import { fonts } from '@/theme/globals';

interface Props {
  visible: boolean;
  onClose: () => void;
  onScanned: (secret: string) => void;
}

/**
 * Full-screen camera modal that scans a 2FA enrollment QR code and returns the
 * Base32 secret. Accepts both `otpauth://` URIs and bare Base32 payloads.
 */
export function TotpScanner({ visible, onClose, onScanned }: Props) {
  const { t } = useTranslation();
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const c = Colors[scheme];
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [invalid, setInvalid] = useState(false);
  // Guards against a burst of frames firing the callback many times.
  const handledRef = useRef(false);

  useEffect(() => {
    if (visible) {
      handledRef.current = false;
      setInvalid(false);
      if (permission && !permission.granted && permission.canAskAgain) {
        void requestPermission();
      }
    }
  }, [visible, permission, requestPermission]);

  const handleScan = (result: BarcodeScanningResult) => {
    if (handledRef.current) {
      return;
    }
    const secret = extractTotpSecret(result.data);
    if (!secret) {
      setInvalid(true);
      return;
    }
    handledRef.current = true;
    onScanned(secret);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={[styles.root, { backgroundColor: '#000' }]}>
        {permission?.granted ? (
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={handleScan}
          />
        ) : (
          <View style={[styles.permission, { backgroundColor: c.background }]}>
            <Text
              style={[
                styles.permissionText,
                { color: c.foreground, fontFamily: fonts.body },
              ]}
            >
              {t('totp.cameraDenied')}
            </Text>
            <Pressable
              onPress={() => void requestPermission()}
              accessibilityRole="button"
              style={[styles.grantButton, { backgroundColor: c.foreground }]}
            >
              <Text
                style={[
                  styles.grantText,
                  { color: c.background, fontFamily: fonts.bodySemiBold },
                ]}
              >
                {t('totp.grantCamera')}
              </Text>
            </Pressable>
          </View>
        )}

        {/* Scan frame + hint overlay */}
        {permission?.granted ? (
          <View style={styles.overlay} pointerEvents="none">
            <View style={styles.frame} />
            <Text style={[styles.hint, { fontFamily: fonts.body }]}>
              {invalid ? t('totp.invalidQr') : t('totp.scanHint')}
            </Text>
          </View>
        ) : null}

        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={t('totp.close')}
          hitSlop={10}
          style={[styles.close, { top: insets.top + 12 }]}
        >
          <X size={24} color="#FFFFFF" />
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  permission: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  permissionText: { fontSize: 16, textAlign: 'center', lineHeight: 23 },
  grantButton: {
    minHeight: 48,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  grantText: { fontSize: 15 },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  frame: {
    width: 240,
    height: 240,
    borderRadius: 20,
    borderCurve: 'continuous',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.9)',
  },
  hint: {
    color: '#FFFFFF',
    fontSize: 15,
    textAlign: 'center',
    maxWidth: 280,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowRadius: 6,
  },
  close: {
    position: 'absolute',
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
