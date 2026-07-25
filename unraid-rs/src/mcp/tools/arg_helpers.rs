use anyhow::bail;
use serde_json::Value;

/// Extract a string field from a JSON args object.
pub(crate) fn string_arg(args: &Value, name: &str) -> Option<String> {
    args.get(name).and_then(|v| v.as_str()).map(String::from)
}

/// Extract an optional array-of-strings field. `None` if absent or not an array;
/// non-string elements are silently dropped (mirrors the existing inline
/// `ids`/`roles` extraction pattern used before this helper existed).
pub(crate) fn string_array_arg(args: &Value, name: &str) -> Option<Vec<String>> {
    args.get(name).and_then(|v| v.as_array()).map(|a| {
        a.iter()
            .filter_map(|x| x.as_str().map(String::from))
            .collect()
    })
}

/// Extract an optional i64 field; error if the field is present but not an integer.
pub(crate) fn i64_arg(args: &Value, name: &str) -> anyhow::Result<Option<i64>> {
    let Some(v) = args.get(name) else {
        return Ok(None);
    };
    v.as_i64()
        .map(Some)
        .ok_or_else(|| anyhow::anyhow!("\"{name}\" must be an integer, got {v:?}"))
}

/// Extract an optional usize field. Rejects negatives with an instructive error
/// (consistent with [`i64_arg`]); the upper bound is explicitly clamped to 10_000.
pub(crate) fn usize_arg(args: &Value, name: &str) -> anyhow::Result<Option<usize>> {
    let Some(n) = i64_arg(args, name)? else {
        return Ok(None);
    };
    if n < 0 {
        bail!("\"{name}\" must be >= 0, got {n}");
    }
    Ok(Some((n as usize).min(10_000)))
}
