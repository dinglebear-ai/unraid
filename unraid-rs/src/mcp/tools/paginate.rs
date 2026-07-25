use serde_json::{json, Value};

/// Wrap a list at `path` inside `data` with pagination + optional filter metadata.
///
/// `path` is a sequence of JSON keys (e.g. `["docker", "containers"]`).
/// The innermost array is replaced with:
/// ```json
/// { "items": [...], "total": N, "limit": L, "offset": O, "has_more": bool, "next_offset": N }
/// ```
/// If the array is absent the original `data` is returned unchanged.
///
/// `filter` matches against `name`, `names[0]`, or `state` fields
/// (case-insensitive substring).
pub(crate) fn paginate_array(
    mut data: Value,
    path: &[&str],
    limit: usize,
    offset: usize,
    filter: Option<String>,
) -> Value {
    // Navigate to the parent node of the target array.
    let (parent, last_key) = if path.len() == 1 {
        (&mut data, path[0])
    } else {
        let mut cur = &mut data;
        for key in &path[..path.len() - 1] {
            cur = &mut cur[*key];
        }
        (cur, path[path.len() - 1])
    };

    let arr = match parent[last_key].as_array_mut() {
        Some(a) => std::mem::take(a),
        None => {
            // The hardcoded key path did not resolve to an array — likely the
            // upstream GraphQL response shape drifted. Surface it so it's
            // observable; return data unchanged (no behavior change).
            tracing::debug!(
                path = %path.join("."),
                "paginate_array: no array found at expected path; returning data unchanged"
            );
            return data;
        }
    };

    // Apply optional substring filter.
    let filtered: Vec<Value> = if let Some(ref f) = filter {
        let f_lower = f.to_lowercase();
        arr.into_iter()
            .filter(|item| {
                let candidate = item
                    .get("name")
                    .and_then(|v| v.as_str())
                    .or_else(|| {
                        item.get("names")
                            .and_then(|v| v.as_array())
                            .and_then(|a| a.first())
                            .and_then(|v| v.as_str())
                    })
                    .or_else(|| item.get("state").and_then(|v| v.as_str()))
                    .unwrap_or("");
                candidate.to_lowercase().contains(&f_lower)
            })
            .collect()
    } else {
        arr
    };

    let total = filtered.len();
    let page: Vec<Value> = filtered.into_iter().skip(offset).take(limit).collect();
    let has_more = offset + page.len() < total;
    let next_offset = if has_more { offset + page.len() } else { total };

    parent[last_key] = json!({
        "items": page,
        "total": total,
        "limit": limit,
        "offset": offset,
        "has_more": has_more,
        "next_offset": next_offset,
    });

    data
}
