use serde_json::json;
use unraid_rmcp::testing::paginate_array;

#[test]
fn basic_pagination_reports_has_more_and_next_offset() {
    let data = json!({
        "containers": [
            { "name": "a" },
            { "name": "b" },
            { "name": "c" },
            { "name": "d" },
            { "name": "e" },
        ]
    });

    let out = paginate_array(data, &["containers"], 2, 0, None);
    let env = &out["containers"];

    assert_eq!(env["items"].as_array().unwrap().len(), 2);
    assert_eq!(env["total"], 5);
    assert_eq!(env["limit"], 2);
    assert_eq!(env["offset"], 0);
    assert_eq!(env["has_more"], true);
    assert_eq!(env["next_offset"], 2);
}

#[test]
fn last_page_has_no_more_and_next_offset_equals_total() {
    let data = json!({
        "containers": [
            { "name": "a" },
            { "name": "b" },
            { "name": "c" },
            { "name": "d" },
            { "name": "e" },
        ]
    });

    // offset 4, limit 2 → only the final element remains.
    let out = paginate_array(data, &["containers"], 2, 4, None);
    let env = &out["containers"];

    assert_eq!(env["items"].as_array().unwrap().len(), 1);
    assert_eq!(env["total"], 5);
    assert_eq!(env["has_more"], false);
    assert_eq!(env["next_offset"], env["total"]);
    assert_eq!(env["next_offset"], 5);
}

#[test]
fn offset_beyond_total_yields_empty_page() {
    let data = json!({
        "containers": [
            { "name": "a" },
            { "name": "b" },
        ]
    });

    let out = paginate_array(data, &["containers"], 5, 10, None);
    let env = &out["containers"];

    assert_eq!(env["items"].as_array().unwrap().len(), 0);
    assert_eq!(env["total"], 2);
    assert_eq!(env["offset"], 10);
    assert_eq!(env["has_more"], false);
    assert_eq!(env["next_offset"], 2);
}

#[test]
fn single_key_path_wraps_top_level_array() {
    let data = json!({
        "containers": [
            { "name": "a" },
            { "name": "b" },
            { "name": "c" },
        ]
    });

    let out = paginate_array(data, &["containers"], 10, 0, None);
    let env = &out["containers"];

    assert_eq!(env["items"].as_array().unwrap().len(), 3);
    assert_eq!(env["total"], 3);
    assert_eq!(env["has_more"], false);
}

#[test]
fn nested_path_wraps_inner_array_and_preserves_siblings() {
    let data = json!({
        "docker": {
            "containers": [
                { "name": "a" },
                { "name": "b" },
                { "name": "c" },
            ],
            "version": "24.0.0"
        }
    });

    let out = paginate_array(data, &["docker", "containers"], 2, 0, None);
    let env = &out["docker"]["containers"];

    assert_eq!(env["items"].as_array().unwrap().len(), 2);
    assert_eq!(env["total"], 3);
    assert_eq!(env["has_more"], true);
    assert_eq!(env["next_offset"], 2);
    // Sibling keys under the parent are untouched.
    assert_eq!(out["docker"]["version"], "24.0.0");
}

#[test]
fn filter_matches_name_case_insensitively() {
    let data = json!({
        "containers": [
            { "name": "Plex" },
            { "name": "Sonarr" },
            { "name": "PlexAmp" },
        ]
    });

    let out = paginate_array(data, &["containers"], 10, 0, Some("plex".to_string()));
    let env = &out["containers"];

    assert_eq!(env["total"], 2);
    let items = env["items"].as_array().unwrap();
    assert_eq!(items.len(), 2);
    assert_eq!(items[0]["name"], "Plex");
    assert_eq!(items[1]["name"], "PlexAmp");
}

#[test]
fn filter_matches_first_name_in_names_array_case_insensitively() {
    let data = json!({
        "containers": [
            { "names": ["MyApp"] },
            { "names": ["OtherApp"] },
        ]
    });

    let out = paginate_array(data, &["containers"], 10, 0, Some("myapp".to_string()));
    let env = &out["containers"];

    assert_eq!(env["total"], 1);
    let items = env["items"].as_array().unwrap();
    assert_eq!(items.len(), 1);
    assert_eq!(items[0]["names"][0], "MyApp");
}

#[test]
fn filter_matches_state_field() {
    let data = json!({
        "containers": [
            { "state": "RUNNING" },
            { "state": "EXITED" },
            { "state": "running-paused" },
        ]
    });

    let out = paginate_array(data, &["containers"], 10, 0, Some("running".to_string()));
    let env = &out["containers"];

    assert_eq!(env["total"], 2);
    let items = env["items"].as_array().unwrap();
    assert_eq!(items.len(), 2);
    assert_eq!(items[0]["state"], "RUNNING");
    assert_eq!(items[1]["state"], "running-paused");
}

#[test]
fn missing_array_at_path_returns_data_without_pagination_envelope() {
    let data = json!({ "docker": {} });

    let out = paginate_array(data, &["docker", "containers"], 10, 0, None);

    // No pagination envelope is injected when the path does not resolve
    // to an array — the data is returned as-is rather than wrapped.
    assert!(out["docker"]["containers"].get("items").is_none());
    assert!(out["docker"]["containers"].get("total").is_none());
    assert!(out["docker"]["containers"].get("has_more").is_none());
}

#[test]
fn missing_array_at_path_preserves_existing_data() {
    // The unrelated sibling data is preserved when the path does not
    // resolve to an array, and no pagination envelope is injected.
    let data = json!({ "docker": {}, "vms": { "count": 3 } });

    let out = paginate_array(data, &["docker", "containers"], 10, 0, None);

    // Unrelated sibling data is preserved.
    assert_eq!(out["vms"]["count"], 3);
    // No pagination envelope is injected at the unresolved path.
    assert!(out["docker"]["containers"].get("items").is_none());
    assert!(out["docker"]["containers"].get("total").is_none());
}
