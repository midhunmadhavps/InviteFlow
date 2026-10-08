import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const DataTable = ({
  columns,
  data = [],
  loading = false,
  searchPlaceholder = "Search...",
  searchValue = "",
  onSearchChange,
  page = 1,
  totalPages = 1,
  total = 0,
  onPageChange,
  emptyMessage = "No records found.",
  filters,
  activeFilter,
  onFilterChange,
  headerAction,
  onRowPress,
}) => {
  return (
    <View style={styles.container}>
      {/* Controls Bar */}
      <View style={styles.controlsBar}>
        <View style={styles.leftControls}>
          {onSearchChange && (
            <View style={styles.searchBox}>
              <MaterialCommunityIcons name="magnify" size={20} color="#94A3B8" />
              <TextInput
                style={styles.searchInput}
                placeholder={searchPlaceholder}
                placeholderTextColor="#94A3B8"
                value={searchValue}
                onChangeText={onSearchChange}
              />
              {searchValue ? (
                <TouchableOpacity onPress={() => onSearchChange("")}>
                  <MaterialCommunityIcons name="close-circle" size={16} color="#94A3B8" />
                </TouchableOpacity>
              ) : null}
            </View>
          )}

          {filters && filters.length > 0 && (
            <View style={styles.filterTabs}>
              {filters.map((f) => (
                <TouchableOpacity
                  key={f.key || f}
                  style={[
                    styles.filterTab,
                    (activeFilter === (f.key || f)) && styles.filterTabActive,
                  ]}
                  onPress={() => onFilterChange(f.key || f)}
                >
                  <Text
                    style={[
                      styles.filterTabText,
                      (activeFilter === (f.key || f)) && styles.filterTabTextActive,
                    ]}
                  >
                    {f.label || f}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {headerAction && <View>{headerAction}</View>}
      </View>

      {/* Table Content */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.tableWrapper}>
          {/* Header Row */}
          <View style={styles.tableHeader}>
            {columns.map((col, index) => (
              <View
                key={index}
                style={[
                  styles.headerCell,
                  { flex: col.flex || 1, minWidth: col.width || 120 },
                ]}
              >
                <Text style={styles.headerCellText}>{col.title}</Text>
              </View>
            ))}
          </View>

          {/* Rows */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4F46E5" />
              <Text style={styles.loadingText}>Loading data...</Text>
            </View>
          ) : data.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="folder-open-outline" size={48} color="#CBD5E1" />
              <Text style={styles.emptyText}>{emptyMessage}</Text>
            </View>
          ) : (
            data.map((row, rowIndex) => {
              const RowContainer = onRowPress ? TouchableOpacity : View;
              return (
                <RowContainer
                  key={row._id || row.id || rowIndex}
                  style={[
                    styles.tableRow,
                    rowIndex % 2 === 1 && styles.tableRowAlt,
                    onRowPress && styles.clickableTableRow,
                  ]}
                  onPress={onRowPress ? () => onRowPress(row) : undefined}
                  activeOpacity={onRowPress ? 0.75 : undefined}
                  accessibilityRole={onRowPress ? "button" : undefined}
                  accessibilityLabel={onRowPress ? "Open row actions" : undefined}
                >
                  {columns.map((col, colIndex) => (
                    <View
                      key={colIndex}
                      style={[
                        styles.cell,
                        { flex: col.flex || 1, minWidth: col.width || 120 },
                      ]}
                    >
                      {col.renderCell ? (
                        col.renderCell(row)
                      ) : (
                        <Text style={styles.cellText} numberOfLines={2}>
                          {row[col.field] !== undefined ? String(row[col.field]) : "-"}
                        </Text>
                      )}
                    </View>
                  ))}
                </RowContainer>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Pagination Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerInfo}>
          Showing {data.length} of {total} items
        </Text>

        {totalPages > 1 && onPageChange && (
          <View style={styles.paginationControls}>
            <TouchableOpacity
              style={[styles.pageBtn, page <= 1 && styles.pageBtnDisabled]}
              disabled={page <= 1}
              onPress={() => onPageChange(page - 1)}
            >
              <MaterialCommunityIcons
                name="chevron-left"
                size={20}
                color={page <= 1 ? "#CBD5E1" : "#475569"}
              />
              <Text style={[styles.pageBtnText, page <= 1 && styles.pageBtnTextDisabled]}>
                Prev
              </Text>
            </TouchableOpacity>

            <View style={styles.pageIndicator}>
              <Text style={styles.pageIndicatorText}>
                Page {page} of {totalPages}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.pageBtn, page >= totalPages && styles.pageBtnDisabled]}
              disabled={page >= totalPages}
              onPress={() => onPageChange(page + 1)}
            >
              <Text style={[styles.pageBtnText, page >= totalPages && styles.pageBtnTextDisabled]}>
                Next
              </Text>
              <MaterialCommunityIcons
                name="chevron-right"
                size={20}
                color={page >= totalPages ? "#CBD5E1" : "#475569"}
              />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  controlsBar: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    gap: 12,
  },
  leftControls: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 240,
  },
  searchInput: {
    marginLeft: 8,
    fontSize: 14,
    color: "#0F172A",
    flex: 1,
    outlineStyle: "none",
  },
  filterTabs: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    borderRadius: 8,
    padding: 3,
    gap: 4,
  },
  filterTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  filterTabActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#64748B",
  },
  filterTabTextActive: {
    color: "#4F46E5",
    fontWeight: "600",
  },
  tableWrapper: {
    minWidth: "100%",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#F8FAFC",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  headerCell: {
    paddingHorizontal: 8,
    justifyContent: "center",
  },
  headerCellText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  tableRowAlt: {
    backgroundColor: "#FAFBFD",
  },
  clickableTableRow: {
    cursor: "pointer",
  },
  cell: {
    paddingHorizontal: 8,
    justifyContent: "center",
  },
  cellText: {
    fontSize: 14,
    color: "#1E293B",
  },
  loadingContainer: {
    paddingVertical: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    color: "#64748B",
    fontSize: 14,
  },
  emptyContainer: {
    paddingVertical: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    marginTop: 10,
    color: "#94A3B8",
    fontSize: 15,
    fontWeight: "500",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    backgroundColor: "#FAFAFA",
    flexWrap: "wrap",
    gap: 12,
  },
  footerInfo: {
    fontSize: 13,
    color: "#64748B",
  },
  paginationControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pageBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
    gap: 4,
  },
  pageBtnDisabled: {
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
  },
  pageBtnText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#475569",
  },
  pageBtnTextDisabled: {
    color: "#CBD5E1",
  },
  pageIndicator: {
    paddingHorizontal: 8,
  },
  pageIndicatorText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#334155",
  },
});

export default DataTable;
