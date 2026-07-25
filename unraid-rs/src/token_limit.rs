/// Maximum response size in bytes (~10K tokens).
pub const MAX_RESPONSE_BYTES: usize = 40_000;

/// Truncate the serialized response if it exceeds `MAX_RESPONSE_BYTES`.
///
/// The truncation marker is appended so an agent knows the response was cut
/// and can use `limit`/`offset` or more specific filters to retrieve the rest.
#[must_use]
pub fn truncate_if_needed(text: String) -> String {
    if text.len() <= MAX_RESPONSE_BYTES {
        return text;
    }
    let mut end = MAX_RESPONSE_BYTES;
    while end > 0 && !text.is_char_boundary(end) {
        end -= 1;
    }
    let truncated = &text[..end];
    format!(
        "{truncated}\n\n[TRUNCATED: response exceeded 10K token limit (~40 KB). \
         Use limit/offset params or more specific filters to page through results.]"
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn short_text_passes_through() {
        let s = "hello world".to_string();
        assert_eq!(truncate_if_needed(s.clone()), s);
    }

    #[test]
    fn long_text_is_truncated_with_marker() {
        let big = "x".repeat(MAX_RESPONSE_BYTES + 100);
        let result = truncate_if_needed(big);
        assert!(result.len() > MAX_RESPONSE_BYTES);
        assert!(result.contains("[TRUNCATED:"));
        assert!(result[..MAX_RESPONSE_BYTES].len() == MAX_RESPONSE_BYTES);
    }

    #[test]
    fn exact_limit_passes_through() {
        let s = "y".repeat(MAX_RESPONSE_BYTES);
        let result = truncate_if_needed(s.clone());
        assert_eq!(result, s);
    }

    #[test]
    fn multibyte_at_boundary_does_not_panic() {
        // 'é' is 2 bytes; 'a'*(cap-1) + 'é'*N puts a 2-byte char straddling the cap.
        let s = "a".repeat(MAX_RESPONSE_BYTES - 1) + &"é".repeat(50);
        let out = truncate_if_needed(s); // must not panic
        assert!(out.contains("[TRUNCATED:"));
    }

    #[test]
    fn truncates_on_char_boundary_for_emoji() {
        let big = "🦀".repeat(MAX_RESPONSE_BYTES); // 4 bytes each, well over cap
        let out = truncate_if_needed(big); // must not panic
        assert!(out.contains("[TRUNCATED:"));
    }
}
