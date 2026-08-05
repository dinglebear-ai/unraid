//! Immutable operation catalog and atomic active-catalog store.

use std::{collections::BTreeMap, sync::Arc};

use arc_swap::ArcSwap;

use super::{
    models::OperationSpec,
    types::{OperationPath, ToolName},
};

/// Immutable index of generated GraphQL operations.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct OperationCatalog {
    /// Cache and compiler compatibility version.
    pub format_version: u32,
    /// Canonical operation-path index.
    pub by_path: BTreeMap<OperationPath, Arc<OperationSpec>>,
    /// Rendered MCP tool-name index.
    pub by_tool_name: BTreeMap<ToolName, Arc<OperationSpec>>,
}

impl OperationCatalog {
    /// Construct deterministic bootstrap state before discovery succeeds.
    pub fn empty() -> Self {
        Self {
            format_version: 1,
            by_path: BTreeMap::new(),
            by_tool_name: BTreeMap::new(),
        }
    }
}

impl Default for OperationCatalog {
    fn default() -> Self {
        Self::empty()
    }
}

/// Lock-free reader access to the active immutable catalog.
#[derive(Clone)]
pub struct CatalogStore {
    active: Arc<ArcSwap<OperationCatalog>>,
}

impl CatalogStore {
    /// Create a store with the initial catalog.
    pub fn new(initial: OperationCatalog) -> Self {
        Self {
            active: Arc::new(ArcSwap::from_pointee(initial)),
        }
    }

    /// Load one catalog snapshot for the complete request lifetime.
    pub fn load(&self) -> Arc<OperationCatalog> {
        self.active.load_full()
    }

    /// Atomically replace the active catalog.
    pub fn store(&self, next: Arc<OperationCatalog>) {
        self.active.store(next);
    }
}

impl Default for CatalogStore {
    fn default() -> Self {
        Self::new(OperationCatalog::empty())
    }
}

#[cfg(test)]
mod tests {
    use std::sync::Arc;

    use super::{CatalogStore, OperationCatalog};

    #[test]
    fn dynamic_empty_catalog_is_deterministic() {
        let first = OperationCatalog::empty();
        let second = OperationCatalog::empty();

        assert_eq!(first.format_version, 1);
        assert!(first.by_path.is_empty());
        assert!(first.by_tool_name.is_empty());
        assert_eq!(first, second);
    }

    #[test]
    fn dynamic_catalog_store_swaps_without_invalidating_loaded_arc() {
        let store = CatalogStore::new(OperationCatalog::empty());
        let old = store.load();
        let mut next = OperationCatalog::empty();
        next.format_version = 2;

        store.store(Arc::new(next));
        let current = store.load();

        assert_eq!(old.format_version, 1);
        assert_eq!(current.format_version, 2);
        assert!(!Arc::ptr_eq(&old, &current));
    }
}
