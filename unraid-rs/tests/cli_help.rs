use std::process::Command;

#[test]
fn help_lists_unraid_commands() {
    let output = Command::new(env!("CARGO_BIN_EXE_runraid"))
        .arg("--help")
        .output()
        .unwrap();

    let stderr = String::from_utf8(output.stderr).unwrap();
    assert!(
        stderr.contains("unraid docker") && stderr.contains("unraid setup plugin-hook"),
        "help output should list unraid commands, got:\n{stderr}"
    );
}

#[test]
fn version_flag_reports_package_name() {
    let output = Command::new(env!("CARGO_BIN_EXE_runraid"))
        .arg("--version")
        .output()
        .unwrap();

    assert!(output.status.success(), "--version failed: {output:?}");
    let stdout = String::from_utf8(output.stdout).unwrap();
    assert!(
        stdout.contains("unraid-rmcp"),
        "version output should mention unraid-rmcp, got:\n{stdout}"
    );
}
