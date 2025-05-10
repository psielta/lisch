// components/SearchableSelector.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  ListRenderItem,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface Item {
  [key: string]: any;
}

interface RenderCustomItemProps {
  item: Item;
  onSelect: () => void;
}

interface SearchableSelectorProps {
  data: Item[];
  value: string | null;
  onChange: (value: string | null) => void;
  displayKey?: string;
  valueKey?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  renderCustomItem?: (
    props: RenderCustomItemProps
  ) => React.ReactElement | null;
  formatOption?: ((item: Item) => string) | null;
  error?: boolean;
  initialSearch?: string;
  allowClear?: boolean;
  isLoading?: boolean;
  renderSelectedValue?: ((item: Item) => React.ReactElement | null) | null;
  maxResults?: number;
}

const SearchableSelector: React.FC<SearchableSelectorProps> = ({
  data,
  value,
  onChange,
  displayKey = "nome",
  valueKey = "id",
  placeholder = "Selecione um item",
  searchPlaceholder = "Pesquisar...",
  renderCustomItem,
  formatOption = null,
  error = false,
  initialSearch = "",
  allowClear = true,
  isLoading = false,
  renderSelectedValue = null,
  maxResults = 100, // Para performance, limitar resultados mostrados
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [filteredData, setFilteredData] = useState<Item[]>(data);

  // Selecionar o item com base no valor atual
  const selectedItem = data.find((item) => item[valueKey] === value);

  // Atualizar dados filtrados quando os dados mudam
  useEffect(() => {
    handleSearch(searchQuery);
  }, [data]);

  // Lógica de pesquisa e filtragem
  const handleSearch = (query: string) => {
    setSearchQuery(query);

    if (!query.trim()) {
      setFilteredData(data.slice(0, maxResults));
      return;
    }

    const filtered = data.filter((item) => {
      const searchIn = formatOption
        ? formatOption(item)
        : String(item[displayKey] || "");
      return searchIn.toLowerCase().includes(query.toLowerCase());
    });

    setFilteredData(filtered.slice(0, maxResults));
  };

  // Função para renderizar cada item na lista
  const renderItem: ListRenderItem<Item> = ({ item }) => {
    if (renderCustomItem) {
      return renderCustomItem({
        item,
        onSelect: () => {
          onChange(item[valueKey]);
          setModalVisible(false);
        },
      });
    }

    const displayValue = formatOption
      ? formatOption(item)
      : String(item[displayKey] || "");

    return (
      <TouchableOpacity
        style={styles.item}
        onPress={() => {
          onChange(item[valueKey]);
          setModalVisible(false);
        }}
      >
        <Text style={styles.itemText} numberOfLines={1} ellipsizeMode="tail">
          {displayValue}
        </Text>
      </TouchableOpacity>
    );
  };

  // Renderização do valor selecionado
  const renderCurrentSelection = () => {
    if (renderSelectedValue && selectedItem) {
      return renderSelectedValue(selectedItem);
    }

    if (selectedItem) {
      const displayValue = formatOption
        ? formatOption(selectedItem)
        : String(selectedItem[displayKey] || "");

      return (
        <Text
          style={styles.selectedText}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {displayValue}
        </Text>
      );
    }

    return <Text style={styles.placeholderText}>{placeholder}</Text>;
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.selector, error ? styles.selectorError : null]}
        onPress={() => setModalVisible(true)}
      >
        <View style={styles.valueContainer}>
          {isLoading ? (
            <ActivityIndicator size="small" color="#6200ee" />
          ) : (
            renderCurrentSelection()
          )}
        </View>

        <View style={styles.iconContainer}>
          {value && allowClear ? (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={(e) => {
                e.stopPropagation();
                onChange(null);
              }}
            >
              <Ionicons name="close-circle" size={18} color="#666" />
            </TouchableOpacity>
          ) : null}
          <Ionicons name="chevron-down" size={18} color="#666" />
        </View>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.searchHeader}>
            <View style={styles.searchBar}>
              <Ionicons
                name="search"
                size={20}
                color="#666"
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChangeText={handleSearch}
                autoFocus
                clearButtonMode="while-editing"
              />
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#6200ee" />
              <Text style={styles.loadingText}>Carregando...</Text>
            </View>
          ) : filteredData.length > 0 ? (
            <FlatList
              data={filteredData}
              renderItem={renderItem}
              keyExtractor={(item) => String(item[valueKey])}
              initialNumToRender={20}
              maxToRenderPerBatch={20}
              windowSize={10}
              keyboardShouldPersistTaps="handled"
              style={styles.list}
              contentContainerStyle={styles.listContent}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                Nenhum resultado encontrado para "{searchQuery}"
              </Text>
            </View>
          )}

          {filteredData.length >= maxResults && (
            <View style={styles.maxResultsContainer}>
              <Text style={styles.maxResultsText}>
                Exibindo os primeiros {maxResults} resultados. Refine sua busca
                para melhores resultados.
              </Text>
            </View>
          )}
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  selector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
    backgroundColor: "#fff",
    height: 50,
    paddingHorizontal: 12,
  },
  selectorError: {
    borderColor: "#f44336",
  },
  valueContainer: {
    flex: 1,
    justifyContent: "center",
    marginRight: 8, // Garante espaço entre o texto e os ícones
  },
  iconContainer: {
    flexDirection: "row",
    alignItems: "center",
    minWidth: 40, // Garante espaço mínimo para ícones
  },
  clearButton: {
    marginRight: 8,
  },
  selectedText: {
    fontSize: 16,
  },
  placeholderText: {
    fontSize: 16,
    color: "#aaa",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  searchHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    padding: 8,
    marginRight: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  closeButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  closeButtonText: {
    fontSize: 16,
    color: "#6200ee",
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 20,
  },
  item: {
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  itemText: {
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  maxResultsContainer: {
    padding: 10,
    backgroundColor: "#f8f8f8",
    borderTopWidth: 1,
    borderTopColor: "#ddd",
  },
  maxResultsText: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
});

export default SearchableSelector;
