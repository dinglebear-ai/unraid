//! Connected MCP peer registration and tool-list change notifications.

use std::sync::Arc;

use rmcp::{Peer, RoleServer};
use tokio::sync::Mutex;

/// Bounded registry of peers that have observed the dynamic tool surface.
#[derive(Clone, Default)]
pub struct PeerRegistry {
    peers: Arc<Mutex<Vec<Peer<RoleServer>>>>,
}

impl PeerRegistry {
    const MAX_PEERS: usize = 128;

    /// Register a peer for future tool-list change notifications.
    pub async fn register(&self, peer: Peer<RoleServer>) {
        let mut peers = self.peers.lock().await;
        if peers.len() == Self::MAX_PEERS {
            peers.remove(0);
        }
        peers.push(peer);
    }

    /// Notify all live peers and prune those whose transport has closed.
    pub async fn notify_tool_list_changed(&self) -> usize {
        let peers = self.peers.lock().await.clone();
        let mut live = Vec::with_capacity(peers.len());
        let mut notified = 0usize;
        for peer in peers {
            if peer.notify_tool_list_changed().await.is_ok() {
                notified += 1;
                live.push(peer);
            }
        }
        *self.peers.lock().await = live;
        notified
    }

    /// Number of currently registered peer handles.
    pub async fn len(&self) -> usize {
        self.peers.lock().await.len()
    }

    /// Whether no peers are currently registered.
    pub async fn is_empty(&self) -> bool {
        self.len().await == 0
    }
}

#[cfg(test)]
mod tests {
    use super::PeerRegistry;

    #[tokio::test]
    async fn dynamic_empty_peer_registry_notification_is_a_noop() {
        let registry = PeerRegistry::default();
        assert!(registry.is_empty().await);
        assert_eq!(registry.notify_tool_list_changed().await, 0);
    }
}
