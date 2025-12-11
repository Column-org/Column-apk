import React, { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList, TextInput, Image, Pressable } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { MosaicToken } from '../../services/mosaic/mosaicService'

interface SwapTokenSelectorProps {
  selectedToken: MosaicToken | null
  tokens: MosaicToken[]
  onSelectToken: (token: MosaicToken) => void
  label: string
}

export default function SwapTokenSelector({ selectedToken, tokens, onSelectToken, label }: SwapTokenSelectorProps) {
  const [modalVisible, setModalVisible] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set())

  const filteredTokens = tokens.filter(token =>
    token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    token.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSelectToken = (token: MosaicToken) => {
    onSelectToken(token)
    setModalVisible(false)
    setSearchQuery('')
  }

  return (
    <>
      <TouchableOpacity
        style={styles.selectorButton}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
      >
        <View style={styles.tokenInfo}>
          {selectedToken && (
            <>
              {selectedToken.logoURI && !failedImages.has(selectedToken.logoURI) ? (
                <Image
                  source={{ uri: selectedToken.logoURI }}
                  style={styles.tokenIcon}
                  onError={() => {
                    setFailedImages(prev => new Set(prev).add(selectedToken.logoURI!))
                  }}
                />
              ) : (
                <View style={styles.tokenIconPlaceholder}>
                  <Text style={styles.tokenIconText}>
                    {selectedToken.symbol.substring(0, 2)}
                  </Text>
                </View>
              )}
              <Text style={styles.tokenSymbol}>
                {selectedToken.symbol}
              </Text>
            </>
          )}
        </View>
        <Ionicons name="chevron-down" size={20} color="#8B98A5" />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
        statusBarTranslucent
      >
        <Pressable
          style={styles.modalContainer}
          onPress={() => setModalVisible(false)}
        >
          <Pressable
            style={styles.modalContent}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>

            {/* Search */}
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#8B98A5" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search tokens..."
                placeholderTextColor="#8B98A5"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
              />
            </View>

            {/* Token List */}
            <FlatList
              data={filteredTokens}
              keyExtractor={(item) => item.address}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.tokenItem}
                  onPress={() => handleSelectToken(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.tokenItemLeft}>
                    {item.logoURI && !failedImages.has(item.logoURI) ? (
                      <Image
                        source={{ uri: item.logoURI }}
                        style={styles.tokenItemIcon}
                        onError={() => {
                          setFailedImages(prev => new Set(prev).add(item.logoURI!))
                        }}
                      />
                    ) : (
                      <View style={styles.tokenItemIconPlaceholder}>
                        <Text style={styles.tokenItemIconText}>
                          {item.symbol.substring(0, 2)}
                        </Text>
                      </View>
                    )}
                    <View>
                      <Text style={styles.tokenItemSymbol}>{item.symbol}</Text>
                      <Text style={styles.tokenItemName}>{item.name}</Text>
                    </View>
                  </View>
                  {selectedToken?.address === item.address && (
                    <Ionicons name="checkmark-circle" size={24} color="#ffda34" />
                  )}
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={false}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  selectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#121315',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  tokenInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  tokenIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  tokenIconPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ffda34',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tokenIconText: {
    color: '#121315',
    fontSize: 14,
    fontWeight: '700',
  },
  tokenSymbol: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#222327',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121315',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    color: 'white',
    fontSize: 16,
  },
  tokenItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  tokenItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tokenItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  tokenItemIconPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffda34',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tokenItemIconText: {
    color: '#121315',
    fontSize: 16,
    fontWeight: '700',
  },
  tokenItemSymbol: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  tokenItemName: {
    color: '#8B98A5',
    fontSize: 13,
    marginTop: 2,
  },
})
