import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Animated, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { FungibleAsset, formatAssetBalance } from '../services/movementAssets';

interface ProjectItemProps {
    name: string;
    iconUri: string;
    appUrl: string;
    assets: FungibleAsset[];
    isHidden: boolean;
}

export const ProjectItem = ({ name, iconUri, appUrl, assets, isHidden }: ProjectItemProps) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [animation] = useState(new Animated.Value(0));

    const toggleExpand = () => {
        const toValue = isExpanded ? 0 : 1;
        setIsExpanded(!isExpanded);

        Animated.timing(animation, {
            toValue,
            duration: 300,
            useNativeDriver: false,
        }).start();
    };

    const heightInterpolate = animation.interpolate({
        inputRange: [0, 1],
        outputRange: [0, assets.length * 60 + 85], // Increased to accommodate button + margins
    });

    const rotateInterpolate = animation.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '180deg'],
    });

    const handleLaunchApp = () => {
        Linking.openURL(appUrl);
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={styles.header}
                onPress={toggleExpand}
                activeOpacity={0.8}
            >
                <Image source={{ uri: iconUri }} style={styles.projectIcon} />
                <View style={styles.projectInfo}>
                    <View style={styles.titleRow}>
                        <Text style={styles.projectName}>{name}</Text>
                        <TouchableOpacity onPress={handleLaunchApp} style={styles.externalLink}>
                            <Ionicons name="open-outline" size={14} color="#ffda34" />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.projectSubtext}>{assets.length} Positions</Text>
                </View>
                <Animated.View style={{ transform: [{ rotate: rotateInterpolate }] }}>
                    <Ionicons name="chevron-down" size={20} color="#8B98A5" />
                </Animated.View>
            </TouchableOpacity>

            <Animated.View style={[styles.content, { height: heightInterpolate, opacity: animation }]}>
                <View style={styles.innerContent}>
                    <View style={styles.divider} />
                    {assets.map((asset, index) => {
                        const balance = formatAssetBalance(asset.amount, asset.metadata.decimals);
                        return (
                            <View key={`${asset.asset_type}-${index}`} style={styles.assetRow}>
                                {asset.metadata.icon_uri ? (
                                    <Image
                                        source={{ uri: asset.metadata.icon_uri }}
                                        style={styles.assetIcon}
                                    />
                                ) : (
                                    <View style={styles.assetIconPlaceholder}>
                                        <Text style={styles.assetIconText}>{asset.metadata.symbol?.charAt(0) || '?'}</Text>
                                    </View>
                                )}
                                <View style={styles.assetDetails}>
                                    <Text style={styles.assetName}>{asset.metadata.name}</Text>
                                    <Text style={styles.assetAmount}>{isHidden ? '••••' : `${balance} ${asset.metadata.symbol}`}</Text>
                                </View>
                                <View style={styles.assetRight}>
                                    <Text style={styles.assetValue}>{isHidden ? '••••' : `$0.00`}</Text>
                                </View>
                            </View>
                        );
                    })}
                    <TouchableOpacity style={styles.launchButton} onPress={handleLaunchApp}>
                        <LinearGradient
                            colors={['#ffda34', '#d4b42b']}
                            style={styles.gradientButton}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <Text style={styles.launchText}>Launch {name} App</Text>
                            <Ionicons name="arrow-forward" size={14} color="black" />
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#1E2024',
        borderRadius: 16,
        marginBottom: 12,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        height: 80,
    },
    projectIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        marginRight: 12,
    },
    projectInfo: {
        flex: 1,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    projectName: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
    },
    externalLink: {
        opacity: 0.8,
    },
    projectSubtext: {
        color: '#8B98A5',
        fontSize: 13,
        marginTop: 2,
    },
    content: {
        overflow: 'hidden',
    },
    innerContent: {
        paddingHorizontal: 16,
        paddingBottom: 4, // Add a little bottom padding for the button
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        marginBottom: 10,
    },
    assetRow: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 60,
    },
    assetIconPlaceholder: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 218, 52, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    assetIconText: {
        color: '#ffda34',
        fontSize: 14,
        fontWeight: '700',
    },
    assetIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        marginRight: 12,
    },
    assetDetails: {
        flex: 1,
    },
    assetName: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
    },
    assetAmount: {
        color: '#8B98A5',
        fontSize: 12,
        marginTop: 2,
    },
    assetRight: {
        alignItems: 'flex-end',
    },
    assetValue: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
    },
    launchButton: {
        marginTop: 10,
        marginBottom: 16,
        alignSelf: 'flex-start',
    },
    gradientButton: {
        height: 28,
        paddingHorizontal: 12,
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
    },
    launchText: {
        color: 'black',
        fontSize: 11,
        fontWeight: '700',
    },
});
